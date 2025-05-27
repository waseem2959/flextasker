# Database Migration Guide

This guide explains how to work with database migrations in the Flextasker project using Prisma.

## Overview

We use Prisma as our ORM and migration tool. This provides type-safe database access and helps manage schema changes over time. Migrations are tracked in the `prisma/migrations` directory and should be committed to version control.

## Getting Started

1. Make sure you have the database running (PostgreSQL)
2. Copy `.env.example` to `.env` and update the `DATABASE_URL` with your credentials
3. Run `npm run db:generate` to generate the Prisma client

## Creating Migrations

When you need to make changes to the database schema:

1. Modify the `prisma/schema.prisma` file with your changes
2. Run `npm run db:migrate -- --name your_migration_name` to create a new migration
3. Prisma will generate migration files in `prisma/migrations/{timestamp}_your_migration_name`
4. Review the generated SQL before committing

Example:
```bash
npm run db:migrate -- --name add_user_preferences
```

## Applying Migrations

To apply migrations to your database:

- In development: Migrations are automatically applied when you run `npm run db:migrate`
- In production: Use `npm run db:migrate:deploy` which is safer for production environments

## Seeding Data

We have seed scripts to populate the database with initial data for development:

1. Modify `prisma/seed.ts` if you need to update the seed data
2. Run `npm run db:seed` to execute the seed script

## Best Practices

1. **Small, Focused Migrations**: Create separate migrations for unrelated changes
2. **Test Migrations**: Always test migrations on a development database before applying to production
3. **Review SQL**: Check the generated SQL to ensure it does what you expect
4. **Data Migration**: When changing column types or removing columns, make sure to handle existing data
5. **Avoid Direct SQL**: Use Prisma's schema definition when possible instead of raw SQL

## Troubleshooting

### Migration Failed

If a migration fails, you may need to:

1. Reset the database: `npx prisma migrate reset` (⚠️ This will delete all data)
2. Fix the migration issue
3. Try again

### Schema Drift

If your database schema doesn't match the migrations:

1. Run `npx prisma migrate diff` to see differences
2. Consider using `npx prisma db push` during development (not recommended for production)

## Prisma Studio

Prisma includes a visual database editor:

```bash
npx prisma studio
```

This will open a browser interface where you can view and edit data in your database.

## Common Commands

- `npm run db:generate`: Generate Prisma client
- `npm run db:migrate`: Create a new migration and apply it
- `npm run db:migrate:deploy`: Apply migrations (safe for production)
- `npm run db:seed`: Seed the database with initial data
- `npm run db:reset`: Reset the database (⚠️ deletes all data)
- `npx prisma studio`: Open visual database editor
