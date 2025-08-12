/**
 * Dynamic OAuth Configuration Manager
 * Handles environment-based OAuth client IDs, secrets, and redirect URIs
 */

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface OAuthProviders {
  google: OAuthConfig;
  linkedin: OAuthConfig;
}

export class OAuthConfigManager {
  private static instance: OAuthConfigManager;
  private environment: string;

  private constructor() {
    this.environment = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development';
  }

  public static getInstance(): OAuthConfigManager {
    if (!OAuthConfigManager.instance) {
      OAuthConfigManager.instance = new OAuthConfigManager();
    }
    return OAuthConfigManager.instance;
  }

  /**
   * Get environment-specific OAuth configuration
   */
  public getOAuthConfig(): OAuthProviders {
    const suffix = this.getEnvironmentSuffix();
    
    return {
      google: {
        clientId: this.getEnvVar(`GOOGLE_CLIENT_ID${suffix}`),
        clientSecret: this.getEnvVar(`GOOGLE_CLIENT_SECRET${suffix}`),
        redirectUri: this.getRedirectUri(),
      },
      linkedin: {
        clientId: this.getEnvVar(`LINKEDIN_CLIENT_ID${suffix}`),
        clientSecret: this.getEnvVar(`LINKEDIN_CLIENT_SECRET${suffix}`),
        redirectUri: this.getRedirectUri(),
      },
    };
  }

  /**
   * Get Google OAuth scopes
   */
  public getGoogleScopes(): string[] {
    return [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid',
    ];
  }

  /**
   * Get LinkedIn OAuth scopes
   */
  public getLinkedInScopes(): string[] {
    return [
      'r_liteprofile',
      'r_emailaddress',
    ];
  }

  /**
   * Get environment-specific redirect URI
   */
  private getRedirectUri(): string {
    const suffix = this.getEnvironmentSuffix();
    return this.getEnvVar(`OAUTH_REDIRECT_URI${suffix}`);
  }

  /**
   * Get environment suffix for variable names
   */
  private getEnvironmentSuffix(): string {
    switch (this.environment.toLowerCase()) {
      case 'production':
      case 'prod':
        return '_PROD';
      case 'staging':
      case 'stage':
        return '_STAGING';
      case 'development':
      case 'dev':
      default:
        return '_DEV';
    }
  }

  /**
   * Get environment variable with validation
   */
  private getEnvVar(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(
        `Missing required environment variable: ${key} for environment: ${this.environment}`
      );
    }
    return value;
  }

  /**
   * Validate OAuth configuration
   */
  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      const config = this.getOAuthConfig();
      
      // Validate Google config
      if (!config.google.clientId) {
        errors.push('Google Client ID is missing');
      }
      if (!config.google.clientSecret) {
        errors.push('Google Client Secret is missing');
      }
      
      // Validate LinkedIn config
      if (!config.linkedin.clientId) {
        errors.push('LinkedIn Client ID is missing');
      }
      if (!config.linkedin.clientSecret) {
        errors.push('LinkedIn Client Secret is missing');
      }
      
      // Validate redirect URI
      if (!config.google.redirectUri || !config.linkedin.redirectUri) {
        errors.push('OAuth Redirect URI is missing');
      }
      
      // Validate NextAuth secret
      if (!process.env.NEXTAUTH_SECRET) {
        errors.push('NEXTAUTH_SECRET is missing');
      }
      
      if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
        errors.push('NEXTAUTH_SECRET must be at least 32 characters');
      }
      
    } catch (error) {
      errors.push(`Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get current environment info
   */
  public getEnvironmentInfo() {
    return {
      environment: this.environment,
      nodeEnv: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      suffix: this.getEnvironmentSuffix(),
    };
  }
}

// Export singleton instance
export const oauthConfig = OAuthConfigManager.getInstance();

// Export types
export type { OAuthConfig, OAuthProviders };
