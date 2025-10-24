/**
 * Regional OAuth Debugging Tool
 * Identifies and logs regional OAuth issues
 */

export interface RegionalOAuthDebug {
  timestamp: string;
  userAgent: string;
  ip: string;
  country: string;
  region: string;
  city: string;
  timezone: string;
  isMobile: boolean;
  browser: string;
  oauthFlow: 'popup' | 'redirect';
  success: boolean;
  error?: string;
  recommendations: string[];
}

export interface OAuthRegionalIssue {
  type: 'DNS' | 'NETWORK' | 'BROWSER' | 'GEOGRAPHIC' | 'CONFIGURATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedRegions: string[];
  solution: string;
}

export function detectRegionalOAuthIssues(
  userAgent: string,
  ip: string,
  country?: string,
  region?: string
): OAuthRegionalIssue[] {
  const issues: OAuthRegionalIssue[] = [];
  
  // Check for mobile browser issues
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  const isEdge = /Edg/i.test(userAgent);
  const isOldBrowser = /MSIE|Trident/i.test(userAgent);
  
  // Mobile-specific issues
  if (isMobile) {
    if (isSafari) {
      issues.push({
        type: 'BROWSER',
        severity: 'HIGH',
        description: 'Safari mobile has strict OAuth policies and may block popup flows',
        affectedRegions: ['All'],
        solution: 'Use redirect flow for Safari mobile users'
      });
    }
    
    if (isOldBrowser) {
      issues.push({
        type: 'BROWSER',
        severity: 'CRITICAL',
        description: 'Old mobile browser detected - OAuth may not work at all',
        affectedRegions: ['All'],
        solution: 'Recommend users to update their browser or use a different device'
      });
    }
  }
  
  // Geographic restrictions
  if (country) {
    const restrictedCountries = ['CN', 'IR', 'CU', 'KP', 'SY']; // Countries with Google restrictions
    if (restrictedCountries.includes(country)) {
      issues.push({
        type: 'GEOGRAPHIC',
        severity: 'CRITICAL',
        description: `Google OAuth may be restricted in ${country}`,
        affectedRegions: [country],
        solution: 'Use alternative authentication methods or VPN'
      });
    }
  }
  
  // Network-related issues
  if (ip) {
    // Check for known problematic IP ranges
    const problematicIPs = [
      '10.0.0.0/8',     // Private networks
      '172.16.0.0/12',  // Private networks
      '192.168.0.0/16'  // Private networks
    ];
    
    // This is a simplified check - in production, use proper IP range checking
    if (ip.startsWith('10.') || ip.startsWith('172.') || ip.startsWith('192.168.')) {
      issues.push({
        type: 'NETWORK',
        severity: 'MEDIUM',
        description: 'Private network detected - OAuth may not work properly',
        affectedRegions: ['All'],
        solution: 'Ensure proper network configuration for OAuth callbacks'
      });
    }
  }
  
  return issues;
}

export function logRegionalOAuthAttempt(
  userAgent: string,
  ip: string,
  country?: string,
  region?: string,
  success: boolean = false,
  error?: string
): RegionalOAuthDebug {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  const browser = isSafari ? 'Safari' : isMobile ? 'Mobile' : 'Desktop';
  
  const issues = detectRegionalOAuthIssues(userAgent, ip, country, region);
  const recommendations = issues.map(issue => issue.solution);
  
  const debug: RegionalOAuthDebug = {
    timestamp: new Date().toISOString(),
    userAgent: userAgent.substring(0, 100),
    ip,
    country: country || 'unknown',
    region: region || 'unknown',
    city: 'unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isMobile,
    browser,
    oauthFlow: isMobile || isSafari ? 'redirect' : 'popup',
    success,
    error,
    recommendations
  };
  
  console.log('🌍 Regional OAuth Debug:', {
    country: debug.country,
    region: debug.region,
    isMobile: debug.isMobile,
    browser: debug.browser,
    oauthFlow: debug.oauthFlow,
    success: debug.success,
    issues: issues.length,
    recommendations: debug.recommendations
  });
  
  return debug;
}

export function getRegionalOAuthRecommendations(
  userAgent: string,
  country?: string
): string[] {
  const recommendations: string[] = [];
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  
  if (isMobile) {
    recommendations.push('Use redirect flow for mobile devices');
    recommendations.push('Ensure HTTPS is enabled for OAuth');
  }
  
  if (isSafari) {
    recommendations.push('Safari has strict OAuth policies - use redirect flow');
    recommendations.push('Consider using Chrome or Firefox for better OAuth support');
  }
  
  if (country) {
    const restrictedCountries = ['CN', 'IR', 'CU', 'KP', 'SY'];
    if (restrictedCountries.includes(country)) {
      recommendations.push('Google OAuth may be restricted in your region');
      recommendations.push('Consider using alternative authentication methods');
    }
  }
  
  return recommendations;
}
