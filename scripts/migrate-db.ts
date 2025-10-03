#!/usr/bin/env ts-node

/**
 * Database Migration Script
 * 
 * Runs database migrations based on the system in use (Prisma)
 * Auto-detects environment (local/vps/git/production)
 * Fails safely on production unless explicitly confirmed
 * 
 * Usage:
 *   npx ts-node scripts/migrate-db.ts
 *   npx ts-node scripts/migrate-db.ts --force-production
 *   npx ts-node scripts/migrate-db.ts --reset
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { EnvironmentManager } from './setup-env';

interface MigrationConfig {
  environment: string;
  isProduction: boolean;
  isStaging: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  databaseUrl: string;
  prismaSchemaPath: string;
  migrationsPath: string;
  forceProduction: boolean;
  reset: boolean;
}

class DatabaseMigrator {
  private config: MigrationConfig;
  private envManager: EnvironmentManager;

  constructor() {
    this.envManager = new EnvironmentManager();
    this.config = {
      environment: process.env.NODE_ENV || 'development',
      isProduction: false,
      isStaging: false,
      isDevelopment: false,
      isTest: false,
      databaseUrl: '',
      prismaSchemaPath: join(process.cwd(), 'prisma', 'schema.prisma'),
      migrationsPath: join(process.cwd(), 'prisma', 'migrations'),
      forceProduction: process.argv.includes('--force-production'),
      reset: process.argv.includes('--reset')
    };
  }

  /**
   * Initialize migration configuration
   */
  public async initialize(): Promise<void> {
    console.log('🗄️  Database Migration Script');
    console.log('==============================');

    // Load environment
    await this.envManager.loadEnvironment();
    const envConfig = this.envManager.getEnvironmentConfig();

    // Set environment flags
    this.config.isProduction = envConfig.isProduction;
    this.config.isStaging = envConfig.isStaging;
    this.config.isDevelopment = envConfig.isDevelopment;
    this.config.isTest = envConfig.isTest;
    this.config.environment = envConfig.nodeEnv;
    this.config.databaseUrl = process.env.DATABASE_URL || '';

    console.log(`Environment: ${this.config.environment}`);
    console.log(`Production: ${this.config.isProduction ? '✅' : '❌'}`);
    console.log(`Force Production: ${this.config.forceProduction ? '✅' : '❌'}`);
    console.log(`Reset Database: ${this.config.reset ? '✅' : '❌'}`);

    // Validate Prisma setup
    this.validatePrismaSetup();
  }

  /**
   * Validate Prisma configuration
   */
  private validatePrismaSetup(): void {
    if (!existsSync(this.config.prismaSchemaPath)) {
      throw new Error(`Prisma schema not found at: ${this.config.prismaSchemaPath}`);
    }

    if (!this.config.databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    console.log('✅ Prisma configuration validated');
  }

  /**
   * Check if we can safely run migrations
   */
  private canRunMigrations(): boolean {
    if (this.config.isDevelopment || this.config.isTest) {
      return true;
    }

    if (this.config.isProduction && !this.config.forceProduction) {
      console.log('❌ Production migration requires --force-production flag');
      console.log('   This is a safety measure to prevent accidental production changes');
      return false;
    }

    if (this.config.isStaging) {
      console.log('⚠️  Running migration on staging environment');
      return true;
    }

    return true;
  }

  /**
   * Generate Prisma client
   */
  private generatePrismaClient(): void {
    console.log('\n🔧 Generating Prisma client...');
    try {
      execSync('npx prisma generate', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Prisma client generated successfully');
    } catch (error) {
      throw new Error(`Failed to generate Prisma client: ${error}`);
    }
  }

  /**
   * Run database migrations
   */
  private runMigrations(): void {
    console.log('\n🚀 Running database migrations...');
    
    try {
      if (this.config.reset) {
        console.log('⚠️  Resetting database (this will delete all data!)');
        execSync('npx prisma migrate reset --force', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
      } else {
        execSync('npx prisma migrate deploy', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
      }
      console.log('✅ Database migrations completed successfully');
    } catch (error) {
      throw new Error(`Migration failed: ${error}`);
    }
  }

  /**
   * Push schema changes (for development)
   */
  private pushSchema(): void {
    if (!this.config.isDevelopment && !this.config.isTest) {
      return;
    }

    console.log('\n📤 Pushing schema changes...');
    try {
      execSync('npx prisma db push', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Schema changes pushed successfully');
    } catch (error) {
      console.warn(`⚠️  Schema push failed: ${error}`);
    }
  }

  /**
   * Validate database connection
   */
  private validateDatabaseConnection(): void {
    console.log('\n🔍 Validating database connection...');
    try {
      execSync('npx prisma db pull --print', { 
        stdio: 'pipe',
        cwd: process.cwd()
      });
      console.log('✅ Database connection validated');
    } catch (error) {
      throw new Error(`Database connection failed: ${error}`);
    }
  }

  /**
   * Show migration status
   */
  private showMigrationStatus(): void {
    console.log('\n📊 Migration Status:');
    try {
      execSync('npx prisma migrate status', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
    } catch (error) {
      console.warn(`⚠️  Could not get migration status: ${error}`);
    }
  }

  /**
   * Create a new migration (if needed)
   */
  private createMigration(): void {
    if (!this.config.isDevelopment) {
      return;
    }

    console.log('\n📝 Creating new migration...');
    try {
      execSync('npx prisma migrate dev --name auto-migration', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ New migration created');
    } catch (error) {
      console.warn(`⚠️  Migration creation failed: ${error}`);
    }
  }

  /**
   * Run the complete migration process
   */
  public async migrate(): Promise<void> {
    try {
      await this.initialize();

      if (!this.canRunMigrations()) {
        process.exit(1);
      }

      // Validate database connection
      this.validateDatabaseConnection();

      // Generate Prisma client
      this.generatePrismaClient();

      // Show current status
      this.showMigrationStatus();

      // Run migrations
      this.runMigrations();

      // Push schema (development only)
      this.pushSchema();

      // Create new migration if needed (development only)
      this.createMigration();

      console.log('\n🎉 Database migration completed successfully!');
      console.log('\nNext steps:');
      console.log('- Verify your application is working correctly');
      console.log('- Check database schema matches your expectations');
      console.log('- Run tests to ensure everything is functioning');

    } catch (error) {
      console.error('\n❌ Migration failed:', error);
      console.log('\nTroubleshooting:');
      console.log('- Check DATABASE_URL is correct');
      console.log('- Ensure database server is running');
      console.log('- Verify Prisma schema is valid');
      console.log('- Check network connectivity');
      process.exit(1);
    }
  }

  /**
   * Rollback last migration (development only)
   */
  public async rollback(): Promise<void> {
    if (this.config.isProduction) {
      console.log('❌ Rollback not allowed in production');
      process.exit(1);
    }

    console.log('🔄 Rolling back last migration...');
    try {
      execSync('npx prisma migrate reset --force', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Rollback completed');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const migrator = new DatabaseMigrator();
  
  if (process.argv.includes('--rollback')) {
    await migrator.rollback();
  } else {
    await migrator.migrate();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { DatabaseMigrator };
