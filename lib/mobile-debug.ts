/**
 * Comprehensive Mobile Debugging Utility
 * Identifies and helps fix mobile-specific issues
 */

export interface MobileDebugInfo {
  device: {
    isMobile: boolean;
    userAgent: string;
    screenSize: string;
    viewport: string;
    devicePixelRatio: number;
    touchSupport: boolean;
    orientation: string;
  };
  browser: {
    name: string;
    version: string;
    isChrome: boolean;
    isSafari: boolean;
    isFirefox: boolean;
    isEdge: boolean;
    isAndroid: boolean;
    isIOS: boolean;
  };
  environment: {
    protocol: string;
    hostname: string;
    isHTTPS: boolean;
    isLocalhost: boolean;
    isProduction: boolean;
  };
  capabilities: {
    geolocation: boolean;
    permissions: boolean;
    serviceWorker: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    cookies: boolean;
    popupSupport: boolean;
  };
  issues: {
    httpsRequired: boolean;
    geolocationBlocked: boolean;
    oauthBlocked: boolean;
    touchIssues: boolean;
    responsiveIssues: boolean;
  };
  recommendations: string[];
}

/**
 * Enhanced mobile device detection
 */
export function detectMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Multiple detection methods for better accuracy
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'mobile', 'android', 'iphone', 'ipad', 'windows phone', 'blackberry',
    'webos', 'ipod', 'opera mini', 'iemobile', 'mobile safari'
  ];
  
  // Check user agent
  const hasMobileKeywords = mobileKeywords.some(keyword => userAgent.includes(keyword));
  
  // Check screen size
  const isSmallScreen = window.innerWidth <= 768;
  
  // Check touch capability
  const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check orientation
  const hasOrientation = 'orientation' in window;
  
  // Check if it's a mobile app (PWA)
  const isStandalone = (window.navigator as any).standalone === true;
  
  return hasMobileKeywords || (isSmallScreen && (hasTouchSupport || hasOrientation)) || isStandalone;
}

/**
 * Get detailed browser information
 */
export function getBrowserInfo(): { name: string; version: string; isChrome: boolean; isSafari: boolean; isFirefox: boolean; isEdge: boolean; isAndroid: boolean; isIOS: boolean } {
  if (typeof window === 'undefined') {
    return { name: 'unknown', version: 'unknown', isChrome: false, isSafari: false, isFirefox: false, isEdge: false, isAndroid: false, isIOS: false };
  }
  
  const userAgent = navigator.userAgent;
  let name = 'unknown';
  let version = 'unknown';
  
  // Detect browser
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    name = 'Chrome';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    name = 'Safari';
  } else if (userAgent.includes('Firefox')) {
    name = 'Firefox';
  } else if (userAgent.includes('Edg')) {
    name = 'Edge';
  }
  
  // Extract version
  const versionMatch = userAgent.match(/(Chrome|Safari|Firefox|Edge)\/(\d+\.\d+)/);
  if (versionMatch) {
    version = versionMatch[2];
  }
  
  // Detect platform
  const isAndroid = userAgent.includes('Android');
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  
  return {
    name,
    version,
    isChrome: name === 'Chrome',
    isSafari: name === 'Safari',
    isFirefox: name === 'Firefox',
    isEdge: name === 'Edge',
    isAndroid,
    isIOS
  };
}

/**
 * Check HTTPS requirements for mobile
 */
export function checkHTTPSRequirements(): { isRequired: boolean; reason: string } {
  if (typeof window === 'undefined') {
    return { isRequired: false, reason: 'Server-side rendering' };
  }
  
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const isMobile = detectMobileDevice();
  
  if (protocol === 'https:') {
    return { isRequired: false, reason: 'Already using HTTPS' };
  }
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return { isRequired: false, reason: 'Local development' };
  }
  
  if (isMobile) {
    return { 
      isRequired: true, 
      reason: 'Mobile browsers require HTTPS for geolocation and OAuth' 
    };
  }
  
  return { 
    isRequired: false, 
    reason: 'Desktop browsers allow HTTP for most features' 
  };
}

/**
 * Test OAuth popup support
 */
export function testOAuthPopupSupport(): { supported: boolean; reason: string } {
  if (typeof window === 'undefined') {
    return { supported: false, reason: 'Server-side rendering' };
  }
  
  if (detectMobileDevice()) {
    return { supported: false, reason: 'Mobile devices have limited popup support' };
  }
  
  try {
    const testPopup = window.open('', '_blank', 'width=1,height=1');
    if (testPopup) {
      testPopup.close();
      return { supported: true, reason: 'Popup test successful' };
    } else {
      return { supported: false, reason: 'Popup blocked by browser' };
    }
  } catch (error) {
    return { supported: false, reason: `Popup test failed: ${error}` };
  }
}

/**
 * Test geolocation functionality
 */
export async function testGeolocation(): Promise<{ supported: boolean; permission: string; reason: string }> {
  if (typeof window === 'undefined') {
    return { supported: false, permission: 'unknown', reason: 'Server-side rendering' };
  }
  
  if (!('geolocation' in navigator)) {
    return { supported: false, permission: 'unknown', reason: 'Geolocation API not supported' };
  }
  
  // Check permission status
  let permission = 'unknown';
  if ('permissions' in navigator) {
    try {
      const permissionResult = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      permission = permissionResult.state;
    } catch (error) {
      permission = 'unknown';
    }
  }
  
  // Test actual geolocation
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      const timeoutId = setTimeout(() => reject(new Error('Timeout')), 5000);
      
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeoutId);
          resolve(pos);
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    });
    
    return { 
      supported: true, 
      permission, 
      reason: `Location obtained: ${position.coords.latitude}, ${position.coords.longitude}` 
    };
  } catch (error: any) {
    let reason = 'Unknown error';
    
    if (error.code === 1) {
      reason = 'Permission denied';
    } else if (error.code === 2) {
      reason = 'Position unavailable';
    } else if (error.code === 3) {
      reason = 'Timeout';
    } else if (error.message === 'Timeout') {
      reason = 'Geolocation request timed out';
    } else {
      reason = error.message || 'Geolocation failed';
    }
    
    return { supported: false, permission, reason };
  }
}

/**
 * Comprehensive mobile environment analysis
 */
export async function analyzeMobileEnvironment(): Promise<MobileDebugInfo> {
  if (typeof window === 'undefined') {
    throw new Error('Cannot analyze environment on server-side');
  }
  
  const device = {
    isMobile: detectMobileDevice(),
    userAgent: navigator.userAgent,
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    viewport: `${window.screen.width}x${window.screen.height}`,
    devicePixelRatio: window.devicePixelRatio || 1,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    orientation: (window as any).orientation || 'unknown'
  };
  
  const browser = getBrowserInfo();
  
  const environment = {
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    isHTTPS: window.location.protocol === 'https:',
    isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    isProduction: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  };
  
  const capabilities = {
    geolocation: 'geolocation' in navigator,
    permissions: 'permissions' in navigator,
    serviceWorker: 'serviceWorker' in navigator,
    localStorage: (() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    })(),
    sessionStorage: (() => {
      try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    })(),
    cookies: navigator.cookieEnabled,
    popupSupport: testOAuthPopupSupport().supported
  };
  
  const httpsCheck = checkHTTPSRequirements();
  const geolocationTest = await testGeolocation();
  
  const issues = {
    httpsRequired: httpsCheck.isRequired,
    geolocationBlocked: !geolocationTest.supported,
    oauthBlocked: !capabilities.popupSupport && device.isMobile,
    touchIssues: device.isMobile && !device.touchSupport,
    responsiveIssues: device.isMobile && window.innerWidth > 768
  };
  
  const recommendations: string[] = [];
  
  if (issues.httpsRequired) {
    recommendations.push('Enable HTTPS for mobile geolocation and OAuth to work properly');
  }
  
  if (issues.geolocationBlocked) {
    recommendations.push(`Fix geolocation: ${geolocationTest.reason}`);
  }
  
  if (issues.oauthBlocked) {
    recommendations.push('Use redirect-based OAuth on mobile devices instead of popups');
  }
  
  if (issues.touchIssues) {
    recommendations.push('Mobile device detected but touch support is limited');
  }
  
  if (issues.responsiveIssues) {
    recommendations.push('Screen size suggests mobile but width is larger than expected');
  }
  
  if (device.isMobile && !environment.isHTTPS && environment.isProduction) {
    recommendations.push('CRITICAL: Mobile users cannot use geolocation or OAuth without HTTPS');
  }
  
  return {
    device,
    browser,
    environment,
    capabilities,
    issues,
    recommendations
  };
}

/**
 * Generate mobile debugging report
 */
export function generateDebugReport(info: MobileDebugInfo): string {
  let report = '🔍 MOBILE DEBUG REPORT\n';
  report += '='.repeat(50) + '\n\n';
  
  report += '📱 DEVICE INFO:\n';
  report += `Mobile: ${info.device.isMobile ? 'Yes' : 'No'}\n`;
  report += `Screen: ${info.device.screenSize}\n`;
  report += `Touch: ${info.device.touchSupport ? 'Yes' : 'No'}\n`;
  report += `Orientation: ${info.device.orientation}\n\n`;
  
  report += '🌐 BROWSER INFO:\n';
  report += `Browser: ${info.browser.name} ${info.browser.version}\n`;
  report += `Platform: ${info.browser.isAndroid ? 'Android' : info.browser.isIOS ? 'iOS' : 'Desktop'}\n\n`;
  
  report += '🔒 ENVIRONMENT:\n';
  report += `Protocol: ${info.environment.protocol}\n`;
  report += `HTTPS: ${info.environment.isHTTPS ? 'Yes' : 'No'}\n`;
  report += `Production: ${info.environment.isProduction ? 'Yes' : 'No'}\n\n`;
  
  report += '⚡ CAPABILITIES:\n';
  report += `Geolocation: ${info.capabilities.geolocation ? 'Yes' : 'No'}\n`;
  report += `OAuth Popup: ${info.capabilities.popupSupport ? 'Yes' : 'No'}\n`;
  report += `Permissions: ${info.capabilities.permissions ? 'Yes' : 'No'}\n\n`;
  
  report += '⚠️ ISSUES DETECTED:\n';
  Object.entries(info.issues).forEach(([key, value]) => {
    if (value) {
      report += `• ${key.replace(/([A-Z])/g, ' $1').trim()}: Yes\n`;
    }
  });
  
  if (info.recommendations.length > 0) {
    report += '\n💡 RECOMMENDATIONS:\n';
    info.recommendations.forEach((rec, index) => {
      report += `${index + 1}. ${rec}\n`;
    });
  }
  
  return report;
}
