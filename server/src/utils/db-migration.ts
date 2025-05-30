/**
 * Database Migration Utility
 * 
 * This module provides utilities for managing database migrations,
 * tracking schema versions, and ensuring consistency across environments.
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger';
import { withTransaction } from './db-transaction';
import { config } from './config';

// Initialize Prisma client
const prisma = new PrismaClient();

// Migration interface
export interface Migration {
  id: string;
  name: string;
  description: string;
  version: string;
  appliedAt: Date | null;
  scriptPath: string;
  checksum: string;
  status: MigrationStatus;
}

// Migration status enum
export enum MigrationStatus {
  PENDING = 'PENDING',
  APPLIED = 'APPLIED',
  FAILED = 'FAILED',
  REVERTED = 'REVERTED'
}

/**
 * Initialize the migration system
 * 
 * Creates the migration table if it doesn't exist
 */
export async function initializeMigrationSystem(): Promise<void> {
  try {
    // Check if migration table exists by attempting a query
    await prisma.$queryRaw`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        version VARCHAR(50) NOT NULL,
        applied_at TIMESTAMP,
        script_path VARCHAR(255) NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    logger.info('Migration system initialized');
  } catch (error) {
    logger.error('Failed to initialize migration system', { error });
    throw error;
  }
}

/**
 * Get all migrations from the database
 */
export async function getMigrations(): Promise<Migration[]> {
  try {
    const migrations = await prisma.$queryRaw<Migration[]>`
      SELECT * FROM schema_migrations ORDER BY version ASC
    `;
    
    return migrations;
  } catch (error) {
    logger.error('Failed to get migrations', { error });
    return [];
  }
}

/**
 * Get pending migrations
 */
export async function getPendingMigrations(): Promise<Migration[]> {
  try {
    const migrations = await prisma.$queryRaw<Migration[]>`
      SELECT * FROM schema_migrations 
      WHERE status = ${MigrationStatus.PENDING}
      ORDER BY version ASC
    `;
    
    return migrations;
  } catch (error) {
    logger.error('Failed to get pending migrations', { error });
    return [];
  }
}

/**
 * Load migration scripts from the migrations directory
 */
export async function loadMigrationScripts(): Promise<Record<string, string>> {
  const migrationsDir = path.join(process.cwd(), 'prisma/migrations');
  
  try {
    const migrationDirs = await fs.readdir(migrationsDir);
    const scripts: Record<string, string> = {};
    
    for (const dir of migrationDirs) {
      const migrationPath = path.join(migrationsDir, dir);
      const stats = await fs.stat(migrationPath);
      
      if (stats.isDirectory()) {
        const sqlFilePath = path.join(migrationPath, 'migration.sql');
        
        try {
          const content = await fs.readFile(sqlFilePath, 'utf-8');
          scripts[dir] = content;
        } catch (error) {
          logger.warn(`Failed to read migration file: ${sqlFilePath}`, { error });
        }
      }
    }
    
    return scripts;
  } catch (error) {
    logger.error('Failed to load migration scripts', { error });
    return {};
  }
}

/**
 * Register a new migration
 */
export async function registerMigration(migration: Omit<Migration, 'id' | 'appliedAt'>): Promise<Migration> {
  try {
    const id = generateUniqueId();
    
    const result = await prisma.$queryRaw<Migration[]>`
      INSERT INTO schema_migrations (
        id, name, description, version, script_path, checksum, status
      ) VALUES (
        ${id}, ${migration.name}, ${migration.description}, ${migration.version},
        ${migration.scriptPath}, ${migration.checksum}, ${migration.status}
      )
      RETURNING *
    `;
    
    return result[0];
  } catch (error) {
    logger.error('Failed to register migration', { migration, error });
    throw error;
  }
}

/**
 * Update migration status
 */
export async function updateMigrationStatus(
  migrationId: string,
  status: MigrationStatus,
  appliedAt?: Date
): Promise<void> {
  try {
    await prisma.$queryRaw`
      UPDATE schema_migrations
      SET status = ${status}, applied_at = ${appliedAt || null}
      WHERE id = ${migrationId}
    `;
  } catch (error) {
    logger.error('Failed to update migration status', { migrationId, status, error });
    throw error;
  }
}

/**
 * Apply a single migration
 */
export async function applyMigration(migration: Migration): Promise<boolean> {
  try {
    logger.info(`Applying migration: ${migration.name} (${migration.version})`);
    
    // Execute the migration script
    await prisma.$executeRawUnsafe(migration.scriptPath);
    
    // Update migration status
    await updateMigrationStatus(
      migration.id,
      MigrationStatus.APPLIED,
      new Date()
    );
    
    logger.info(`Migration applied successfully: ${migration.name}`);
    return true;
  } catch (error) {
    logger.error(`Migration failed: ${migration.name}`, { error });
    
    // Update migration status to failed
    await updateMigrationStatus(
      migration.id,
      MigrationStatus.FAILED
    );
    
    return false;
  }
}

/**
 * Apply all pending migrations
 */
export async function applyPendingMigrations(): Promise<boolean> {
  const pendingMigrations = await getPendingMigrations();
  
  if (pendingMigrations.length === 0) {
    logger.info('No pending migrations to apply');
    return true;
  }
  
  logger.info(`Applying ${pendingMigrations.length} pending migrations`);
  
  let success = true;
  
  // Apply migrations within a transaction if possible
  try {
    // Using transactions for migrations can be risky with certain DDL statements
    // Some databases don't support transactional DDL
    const useTransactions = config.DB_SUPPORTS_TRANSACTIONAL_DDL;
    
    if (useTransactions) {
      // The transaction parameter is intentionally unused when we're just executing migrations in sequence
      await withTransaction(async () => {
        for (const migration of pendingMigrations) {
          const result = await applyMigration(migration);
          if (!result) {
            throw new Error(`Migration failed: ${migration.name}`);
          }
        }
      });
    } else {
      // Apply migrations sequentially without a transaction
      for (const migration of pendingMigrations) {
        const result = await applyMigration(migration);
        if (!result) {
          success = false;
          break;
        }
      }
    }
    
    logger.info(`Migration completed ${success ? 'successfully' : 'with errors'}`);
    return success;
  } catch (error) {
    logger.error('Migration process failed', { error });
    return false;
  }
}

/**
 * Check if migrations are up to date
 */
export async function isMigrationsUpToDate(): Promise<boolean> {
  const pendingMigrations = await getPendingMigrations();
  return pendingMigrations.length === 0;
}

/**
 * Generate a unique ID for migrations
 */
function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

/**
 * Calculate checksum for a migration script
 */
function calculateChecksum(content: string): string {
  const crypto = require('crypto');
  return crypto
    .createHash('sha256')
    .update(content, 'utf8')
    .digest('hex');
}

/**
 * Validate migration integrity by comparing checksums
 */
export async function validateMigrationIntegrity(): Promise<boolean> {
  try {
    // Get all applied migrations
    const migrations = await prisma.$queryRaw<Migration[]>`
      SELECT * FROM schema_migrations 
      WHERE status = ${MigrationStatus.APPLIED}
    `;
    
    // Load migration scripts
    const scripts = await loadMigrationScripts();
    
    // Validate each migration
    for (const migration of migrations) {
      const scriptContent = scripts[migration.name];
      
      if (!scriptContent) {
        logger.warn(`Migration script not found: ${migration.name}`);
        continue;
      }
      
      const checksum = calculateChecksum(scriptContent);
      
      if (checksum !== migration.checksum) {
        logger.error(`Migration integrity check failed for ${migration.name}`, {
          expected: migration.checksum,
          actual: checksum
        });
        return false;
      }
    }
    
    logger.info('Migration integrity check passed');
    return true;
  } catch (error) {
    logger.error('Failed to validate migration integrity', { error });
    return false;
  }
}

/**
 * Discover new migrations from the filesystem
 */
export async function discoverNewMigrations(): Promise<Migration[]> {
  try {
    // Get existing migrations
    const existingMigrations = await getMigrations();
    const existingVersions = new Set(existingMigrations.map(m => m.version));
    
    // Load migration scripts
    const scripts = await loadMigrationScripts();
    
    // Find new migrations
    const newMigrations: Migration[] = [];
    
    for (const [name, content] of Object.entries(scripts)) {
      // Extract version from name (e.g. "20230101000000_initial")
      const versionRegex = /^(\d+)_/;
      const versionMatch = versionRegex.exec(name);
      
      if (!versionMatch) {
        logger.warn(`Invalid migration name format: ${name}`);
        continue;
      }
      
      const version = versionMatch[1];
      
      // Skip if already registered
      if (existingVersions.has(version)) {
        continue;
      }
      
      // Create new migration
      newMigrations.push({
        id: generateUniqueId(),
        name,
        description: `Migration ${name}`,
        version,
        appliedAt: null,
        scriptPath: path.join('prisma/migrations', name, 'migration.sql'),
        checksum: calculateChecksum(content),
        status: MigrationStatus.PENDING
      });
    }
    
    return newMigrations;
  } catch (error) {
    logger.error('Failed to discover new migrations', { error });
    return [];
  }
}

/**
 * Register newly discovered migrations
 */
export async function registerNewMigrations(): Promise<number> {
  try {
    const newMigrations = await discoverNewMigrations();
    
    if (newMigrations.length === 0) {
      logger.info('No new migrations to register');
      return 0;
    }
    
    logger.info(`Registering ${newMigrations.length} new migrations`);
    
    // Register each migration
    for (const migration of newMigrations) {
      await registerMigration(migration);
    }
    
    return newMigrations.length;
  } catch (error) {
    logger.error('Failed to register new migrations', { error });
    return 0;
  }
}

/**
 * Get migration history
 */
export async function getMigrationHistory(): Promise<Migration[]> {
  try {
    const migrations = await prisma.$queryRaw<Migration[]>`
      SELECT * FROM schema_migrations ORDER BY applied_at DESC
    `;
    
    return migrations;
  } catch (error) {
    logger.error('Failed to get migration history', { error });
    return [];
  }
}

/**
 * Initialize the migration system and apply pending migrations
 */
export async function initializeAndMigrate(): Promise<boolean> {
  try {
    // Initialize migration system
    await initializeMigrationSystem();
    
    // Register new migrations
    await registerNewMigrations();
    
    // Apply pending migrations
    const success = await applyPendingMigrations();
    
    // Validate migration integrity
    if (success) {
      await validateMigrationIntegrity();
    }
    
    return success;
  } catch (error) {
    logger.error('Failed to initialize and migrate', { error });
    return false;
  }
}

export default {
  initializeMigrationSystem,
  getMigrations,
  getPendingMigrations,
  loadMigrationScripts,
  registerMigration,
  updateMigrationStatus,
  applyMigration,
  applyPendingMigrations,
  isMigrationsUpToDate,
  validateMigrationIntegrity,
  discoverNewMigrations,
  registerNewMigrations,
  getMigrationHistory,
  initializeAndMigrate,
  MigrationStatus
};
