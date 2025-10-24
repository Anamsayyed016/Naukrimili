/**
 * Mobile OAuth Performance Fix
 * Addresses mobile browser performance issues and forced reflow problems
 */

export interface MobileOAuthPerformance {
  isMobile: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isEdge: boolean;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  performanceIssues: string[];
  recommendations: string[];
}

export function detectMobileOAuthPerformance(): MobileOAuthPerformance {
  const userAgent = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  const isChrome = /Chrome/i.test(userAgent) && !/Edg/i.test(userAgent);
  const isEdge = /Edg/i.test(userAgent);
  
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const devicePixelRatio = window.devicePixelRatio || 1;
  
  const performanceIssues: string[] = [];
  const recommendations: string[] = [];
  
  // Mobile-specific performance issues
  if (isMobile) {
    if (screenWidth < 768) {
      performanceIssues.push('Small screen size may cause OAuth popup issues');
      recommendations.push('Use redirect flow for small screens');
    }
    
    if (devicePixelRatio > 2) {
      performanceIssues.push('High DPI display may cause rendering issues');
      recommendations.push('Optimize for high DPI displays');
    }
    
    if (isSafari) {
      performanceIssues.push('Safari mobile has strict OAuth policies');
      recommendations.push('Use redirect flow for Safari mobile');
    }
    
    if (isChrome) {
      performanceIssues.push('Chrome mobile may have popup blocking');
      recommendations.push('Use redirect flow for Chrome mobile');
    }
  }
  
  // Performance optimizations
  recommendations.push('Disable animations during OAuth flow');
  recommendations.push('Use minimal DOM manipulation');
  recommendations.push('Prevent forced reflows');
  
  return {
    isMobile,
    isSafari,
    isChrome,
    isEdge,
    screenWidth,
    screenHeight,
    devicePixelRatio,
    performanceIssues,
    recommendations
  };
}

export function optimizeMobileOAuth(): void {
  // Disable animations during OAuth
  document.documentElement.style.setProperty('--animation-duration', '0ms');
  document.documentElement.style.setProperty('--transition-duration', '0ms');
  
  // Prevent forced reflows
  const style = document.createElement('style');
  style.textContent = `
    * {
      animation-duration: 0ms !important;
      transition-duration: 0ms !important;
    }
    
    .oauth-loading {
      will-change: auto !important;
      transform: none !important;
    }
  `;
  document.head.appendChild(style);
  
  // Clean up after OAuth
  setTimeout(() => {
    document.head.removeChild(style);
    document.documentElement.style.removeProperty('--animation-duration');
    document.documentElement.style.removeProperty('--transition-duration');
  }, 30000); // 30 seconds cleanup
}

export function getMobileOAuthFlow(): 'popup' | 'redirect' {
  const performance = detectMobileOAuthPerformance();
  
  // Force redirect for mobile devices
  if (performance.isMobile) {
    return 'redirect';
  }
  
  // Force redirect for Safari
  if (performance.isSafari) {
    return 'redirect';
  }
  
  // Force redirect for small screens
  if (performance.screenWidth < 768) {
    return 'redirect';
  }
  
  // Use popup for desktop Chrome/Firefox
  return 'popup';
}

export function logMobileOAuthPerformance(): void {
  const performance = detectMobileOAuthPerformance();
  
  console.log('📱 Mobile OAuth Performance:', {
    isMobile: performance.isMobile,
    isSafari: performance.isSafari,
    isChrome: performance.isChrome,
    screenSize: `${performance.screenWidth}x${performance.screenHeight}`,
    devicePixelRatio: performance.devicePixelRatio,
    issues: performance.performanceIssues,
    recommendations: performance.recommendations
  });
}
