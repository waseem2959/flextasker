/**
 * File Upload Utilities
 * 
 * This module provides utilities for handling file uploads securely,
 * including validation, storage, and cleanup.
 */

import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { ValidationError } from './error-utils';
import { logger } from './logger';
import { requestContextUtils } from '../middleware/request-context-middleware';

// Define file upload configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE ?? '5242880', 10); // 5MB default
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed']
};

// Ensure upload directory exists
if (!existsSync(UPLOAD_DIR)) {
  fs.mkdir(UPLOAD_DIR, { recursive: true })
    .catch(error => {
      logger.error('Failed to create upload directory', { error, directory: UPLOAD_DIR });
    });
}

// Define storage engine for multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Generate a unique filename to prevent collisions
    const uniqueId = uuidv4();
    const fileExt = path.extname(file.originalname).toLowerCase();
    const sanitizedName = path.basename(file.originalname, fileExt)
      .replace(/[^a-zA-Z0-9]/g, '_') // Replace special chars with underscore
      .substring(0, 32); // Limit filename length
    
    cb(null, `${sanitizedName}_${uniqueId}${fileExt}`);
  }
});

/**
 * Validate file by type and size
 */
function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
  allowedTypes: string[] = []
) {
  // Check if MIME type is allowed
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
    return cb(new ValidationError(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`));
  }
  
  // File is valid
  cb(null, true);
}

/**
 * Create a multer instance for handling file uploads
 */
interface UploaderOptions {
  fieldName?: string;
  fileTypes?: 'image' | 'document' | 'archive' | string[];
  maxFileSize?: number;
  maxFiles?: number;
}

export function createUploader(options: UploaderOptions = {}) {
  const {
    fileTypes = 'image',
    maxFileSize = MAX_FILE_SIZE,
    maxFiles = 1
  } = options;
  
  // Field name is not used in this implementation but kept for compatibility
  // with the multer interface
  
  // Determine allowed file types
  let allowedTypes: string[];
  if (typeof fileTypes === 'string') {
    allowedTypes = ALLOWED_MIME_TYPES[fileTypes] ?? [];
  } else {
    allowedTypes = fileTypes;
  }
  
  // Create multer instance with configuration
  return multer({
    storage,
    limits: {
      fileSize: maxFileSize,
      files: maxFiles
    },
    fileFilter: (req, file, cb) => fileFilter(req, file, cb, allowedTypes)
  });
}

/**
 * Delete a file from the upload directory
 */
export async function deleteFile(filename: string): Promise<boolean> {
  try {
    const filePath = path.join(UPLOAD_DIR, filename);
    await fs.unlink(filePath);
    logger.info('File deleted successfully', { 
      filename, 
      requestId: requestContextUtils.getRequestId({} as any) 
    });
    return true;
  } catch (error) {
    logger.error('Failed to delete file', { 
      filename, 
      error, 
      requestId: requestContextUtils.getRequestId({} as any) 
    });
    return false;
  }
}

/**
 * Get public URL for a file
 */
export function getFileUrl(filename: string): string {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
  return `${baseUrl}/uploads/${filename}`;
}

/**
 * Move an uploaded file to a permanent location
 */
export async function moveFile(
  sourceFilename: string,
  targetDirectory: string
): Promise<string> {
  try {
    // Create target directory if it doesn't exist
    const targetDir = path.join(UPLOAD_DIR, targetDirectory);
    await fs.mkdir(targetDir, { recursive: true });
    
    // Generate target filename
    const fileExt = path.extname(sourceFilename);
    const uniqueId = uuidv4();
    const targetFilename = `${uniqueId}${fileExt}`;
    
    // Move the file
    const sourcePath = path.join(UPLOAD_DIR, sourceFilename);
    const targetPath = path.join(targetDir, targetFilename);
    await fs.rename(sourcePath, targetPath);
    
    logger.info('File moved successfully', {
      sourceFilename,
      targetDirectory,
      targetFilename,
      requestId: requestContextUtils.getRequestId({} as any)
    });
    
    // Return relative path to the file
    return path.join(targetDirectory, targetFilename);
  } catch (error) {
    logger.error('Failed to move file', {
      sourceFilename,
      targetDirectory,
      error,
      requestId: requestContextUtils.getRequestId({} as any)
    });
    throw error;
  }
}

/**
 * Extract file information from a file
 */
export function getFileInfo(file: Express.Multer.File) {
  return {
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    url: getFileUrl(file.filename)
  };
}

/**
 * Create uploader for common file types
 */
export const uploaders = {
  // Single file uploaders
  singleImage: createUploader({ fieldName: 'image', fileTypes: 'image' }),
  singleDocument: createUploader({ fieldName: 'document', fileTypes: 'document' }),
  singleFile: createUploader({ fieldName: 'file', fileTypes: [...ALLOWED_MIME_TYPES.image, ...ALLOWED_MIME_TYPES.document] }),
  
  // Multiple file uploaders
  multipleImages: createUploader({ fieldName: 'images', fileTypes: 'image', maxFiles: 5 }),
  multipleDocuments: createUploader({ fieldName: 'documents', fileTypes: 'document', maxFiles: 5 }),
  multipleFiles: createUploader({ 
    fieldName: 'files', 
    fileTypes: [...ALLOWED_MIME_TYPES.image, ...ALLOWED_MIME_TYPES.document], 
    maxFiles: 5 
  })
};
