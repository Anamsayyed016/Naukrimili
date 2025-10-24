/**
 * Mobile OAuth Fixes
 * Addresses mobile browser-specific OAuth issues
 */

export interface MobileOAuthStatus {
  isMobile: boolean;
  supportsOAuth: boolean;
  requiresHTTPS: boolean;
  userAgent: string;
  recommendations: string[];
}

export function detectMobileOAuthIssues(userAgent: string): MobileOAuthStatus {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  const isEdge = /Edg/i.test(userAgent);
  const isOldBrowser = /MSIE|Trident/i.test(userAgent);
  
  const recommendations: string[] = [];
  let supportsOAuth = true;
  let requiresHTTPS = true;
  
  if (isMobile) {
    if (isSafari) {
      recommendations.push('Safari mobile has strict OAuth policies - ensure HTTPS');
      requiresHTTPS = true;
    }
    
    if (isOldBrowser) {
      recommendations.push('Old mobile browser detected - OAuth may not work');
      supportsOAuth = false;
    }
    
    recommendations.push('Mobile OAuth requires HTTPS and secure cookies');
  }
  
  if (isEdge) {
    recommendations.push('Edge browser has strict cookie policies');
  }
  
  return {
    isMobile,
    supportsOAuth,
    requiresHTTPS,
    userAgent,
    recommendations
  };
}

export function getMobileOAuthFallback(userAgent: string): string {
  const status = detectMobileOAuthIssues(userAgent);
  
  if (!status.supportsOAuth) {
    return 'redirect'; // Force redirect flow instead of popup
  }
  
  if (status.isMobile && status.requiresHTTPS) {
    return 'redirect'; // Use redirect flow for mobile
  }
  
  return 'popup'; // Default to popup for desktop
}

export function logMobileOAuthAttempt(userAgent: string, email?: string) {
  const status = detectMobileOAuthIssues(userAgent);
  
  console.log('📱 Mobile OAuth Analysis:', {
    email: email || 'unknown',
    isMobile: status.isMobile,
    supportsOAuth: status.supportsOAuth,
    requiresHTTPS: status.requiresHTTPS,
    recommendations: status.recommendations,
    timestamp: new Date().toISOString()
  });
}
