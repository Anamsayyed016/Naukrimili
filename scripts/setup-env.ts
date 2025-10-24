#!/usr/bin/env ts-node

/**
 * Environment Setup Script
 * 
 * Loads environment variables from appropriate .env files based on NODE_ENV
 * Supports: .env.local, .env.staging, .env.production
 * 
 * Usage:
 *   npx ts-node scripts/setup-env.ts
 *   NODE_ENV=production npx ts-node scripts/setup-env.ts
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

interface EnvironmentConfig {
  nodeEnv: string;
  envFile: string;
  loaded: boolean;
  variables: Record<string, string>;
  maskedVariables: Record<string, string>;
}

class EnvironmentManager {
  private config: EnvironmentConfig;

  constructor() {
    this.config = {
      nodeEnv: process.env.NODE_ENV || 'development',
      envFile: '',
      loaded: false,
      variables: {},
      maskedVariables: {}
    };
  }

  /**
   * Detect environment and load appropriate .env file
   */
  public async loadEnvironment(): Promise<EnvironmentConfig> {
    console.log('🔧 Environment Setup Script');
    console.log('============================');

    // Determine which .env file to load
    const envFiles = [
      `.env.${this.config.nodeEnv}`,
      '.env.local',
      '.env'
    ];

    let loadedFile = '';
    for (const file of envFiles) {
      const filePath = join(process.cwd(), file);
      if (existsSync(filePath)) {
        loadedFile = file;
        break;
      }
    }

    if (!loadedFile) {
      console.warn('⚠️  No .env file found. Using system environment variables only.');
      this.config.loaded = false;
      return this.config;
    }

    // Load the environment file
    const result = config({ path: loadedFile });
    this.config.envFile = loadedFile;
    this.config.loaded = true;

    // Store loaded variables
    this.config.variables = { ...process.env };
    this.config.maskedVariables = this.maskSensitiveVariables(this.config.variables);

    console.log(`✅ Environment: ${this.config.nodeEnv}`);
    console.log(`📁 Loaded from: ${loadedFile}`);
    console.log(`🔑 Variables loaded: ${Object.keys(this.config.variables).length}`);

    return this.config;
  }

  /**
   * Mask sensitive environment variables for safe logging
   */
  private maskSensitiveVariables(vars: Record<string, string>): Record<string, string> {
    const sensitiveKeys = [
      'PASSWORD', 'SECRET', 'KEY', 'TOKEN', 'PRIVATE', 'CREDENTIAL',
      'API_KEY', 'CLIENT_SECRET', 'ACCESS_KEY', 'SECRET_KEY',
      'DATABASE_URL', 'MONGODB_URI', 'REDIS_URL'
    ];

    const masked: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(vars)) {
      const isSensitive = sensitiveKeys.some(sensitive => 
        key.toUpperCase().includes(sensitive)
      );

      if (isSensitive && value) {
        if (value.length <= 8) {
          masked[key] = '***';
        } else {
          masked[key] = `${value.substring(0, 4)}***${value.substring(value.length - 4)}`;
        }
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  /**
   * Display environment information
   */
  public displayEnvironmentInfo(): void {
    if (!this.config.loaded) {
      console.log('❌ No environment file loaded');
      return;
    }

    console.log('\n📋 Environment Variables:');
    console.log('========================');

    // Group variables by category
    const categories = {
      'App Config': ['NODE_ENV', 'PORT', 'NEXTAUTH_URL', 'NEXT_PUBLIC_APP_URL'],
      'Database': ['DATABASE_URL', 'MONGODB_URI'],
      'Authentication': ['NEXTAUTH_SECRET', 'JWT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
      'External APIs': ['ADZUNA_APP_ID', 'ADZUNA_APP_KEY', 'RAPIDAPI_KEY', 'JSEARCH_API_KEY', 'SERPAPI_KEY'],
      'Google APIs': ['GOOGLE_JOBS_API_KEY', 'GOOGLE_GEOLOCATION_API_KEY', 'GOOGLE_SEARCH_API_KEY'],
      'AI Services': ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY'],
      'AWS': ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET'],
      'Email': ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'],
      'Feature Flags': ['NEXT_PUBLIC_MOCK_DATA', 'NEXT_PUBLIC_DISABLE_AUTH', 'ENABLE_AI_FEATURES', 'ENABLE_ANALYTICS']
    };

    for (const [category, keys] of Object.entries(categories)) {
      const categoryVars = keys
        .filter(key => this.config.maskedVariables[key])
        .map(key => ({ key, value: this.config.maskedVariables[key] }));

      if (categoryVars.length > 0) {
        console.log(`\n🔹 ${category}:`);
        categoryVars.forEach(({ key, value }) => {
          console.log(`   ${key}: ${value}`);
        });
      }
    }

    // Show other variables not in categories
    const categorizedKeys = Object.values(categories).flat();
    const otherVars = Object.entries(this.config.maskedVariables)
      .filter(([key]) => !categorizedKeys.includes(key) && key.startsWith('NEXT_PUBLIC_'))
      .slice(0, 10); // Limit to first 10

    if (otherVars.length > 0) {
      console.log('\n🔹 Other Variables:');
      otherVars.forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }
  }

  /**
   * Validate required environment variables
   */
  public validateRequiredVariables(): boolean {
    const required = {
      development: ['DATABASE_URL', 'NEXTAUTH_SECRET'],
      production: ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'],
      test: ['DATABASE_URL']
    };

    const requiredForEnv = required[this.config.nodeEnv as keyof typeof required] || [];
    const missing = requiredForEnv.filter(key => !this.config.variables[key]);

    if (missing.length > 0) {
      console.log('\n❌ Missing required environment variables:');
      missing.forEach(key => console.log(`   - ${key}`));
      return false;
    }

    console.log('\n✅ All required environment variables are present');
    return true;
  }

  /**
   * Get environment-specific configuration
   */
  public getEnvironmentConfig() {
    return {
      isDevelopment: this.config.nodeEnv === 'development',
      isProduction: this.config.nodeEnv === 'production',
      isTest: this.config.nodeEnv === 'test',
      isStaging: this.config.nodeEnv === 'staging',
      nodeEnv: this.config.nodeEnv,
      envFile: this.config.envFile,
      loaded: this.config.loaded
    };
  }
}

// Main execution
async function main() {
  try {
    const envManager = new EnvironmentManager();
    await envManager.loadEnvironment();
    envManager.displayEnvironmentInfo();
    
    const isValid = envManager.validateRequiredVariables();
    const config = envManager.getEnvironmentConfig();

    console.log('\n🎯 Environment Summary:');
    console.log('======================');
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`File: ${config.envFile}`);
    console.log(`Loaded: ${config.loaded ? '✅' : '❌'}`);
    console.log(`Valid: ${isValid ? '✅' : '❌'}`);

    if (!isValid) {
      process.exit(1);
    }

    console.log('\n🚀 Environment setup complete!');
  } catch (error) {
    console.error('❌ Error loading environment:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { EnvironmentManager };
