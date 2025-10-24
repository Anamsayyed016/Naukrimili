/**
 * OAuth Scope Manager for Incremental Authorization
 * Implements Google Cloud's incremental authorization requirements
 */

export interface OAuthScope {
  name: string;
  description: string;
  required: boolean;
  category: 'basic' | 'profile' | 'email' | 'advanced';
}

export const OAUTH_SCOPES: Record<string, OAuthScope> = {
  // Basic scopes (always requested)
  openid: {
    name: 'openid',
    description: 'OpenID Connect authentication',
    required: true,
    category: 'basic'
  },
  email: {
    name: 'email',
    description: 'Access to user email address',
    required: true,
    category: 'email'
  },
  profile: {
    name: 'profile',
    description: 'Access to basic profile information',
    required: true,
    category: 'profile'
  },
  
  // Advanced scopes (requested incrementally)
  'https://www.googleapis.com/auth/userinfo.email': {
    name: 'https://www.googleapis.com/auth/userinfo.email',
    description: 'Detailed email access',
    required: false,
    category: 'email'
  },
  'https://www.googleapis.com/auth/userinfo.profile': {
    name: 'https://www.googleapis.com/auth/userinfo.profile',
    description: 'Detailed profile access',
    required: false,
    category: 'profile'
  }
};

export class OAuthScopeManager {
  private static instance: OAuthScopeManager;
  
  private constructor() {}
  
  static getInstance(): OAuthScopeManager {
    if (!OAuthScopeManager.instance) {
      OAuthScopeManager.instance = new OAuthScopeManager();
    }
    return OAuthScopeManager.instance;
  }

  /**
   * Get initial scopes for OAuth login
   * Returns minimal required scopes for basic authentication
   */
  getInitialScopes(): string {
    const initialScopes = Object.values(OAUTH_SCOPES)
      .filter(scope => scope.required)
      .map(scope => scope.name);
    
    return initialScopes.join(' ');
  }

  /**
   * Get additional scopes based on user action
   * @param action - The action requiring additional permissions
   */
  getAdditionalScopes(action: 'profile_edit' | 'email_send' | 'advanced_features'): string {
    const additionalScopes: string[] = [];
    
    switch (action) {
      case 'profile_edit':
        additionalScopes.push('https://www.googleapis.com/auth/userinfo.profile');
        break;
      case 'email_send':
        additionalScopes.push('https://www.googleapis.com/auth/userinfo.email');
        break;
      case 'advanced_features':
        additionalScopes.push(
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email'
        );
        break;
    }
    
    return additionalScopes.join(' ');
  }

  /**
   * Check if user has required scopes for an action
   * @param userScopes - Scopes currently granted to user
   * @param action - Action to check
   */
  hasRequiredScopes(userScopes: string[], action: string): boolean {
    const requiredScopes = this.getAdditionalScopes(action as any).split(' ');
    return requiredScopes.every(scope => userScopes.includes(scope));
  }

  /**
   * Get scope description for user consent
   * @param scopes - Array of scope names
   */
  getScopeDescriptions(scopes: string[]): string[] {
    return scopes.map(scope => {
      const scopeInfo = Object.values(OAUTH_SCOPES).find(s => s.name === scope);
      return scopeInfo ? scopeInfo.description : scope;
    });
  }
}

export default OAuthScopeManager;
