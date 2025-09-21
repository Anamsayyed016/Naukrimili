/**
 * Mobile Debugging Utilities
 * Comprehensive tools for debugging mobile-specific issues
 */

export interface MobileDebugInfo {
  timestamp: string;
  userAgent: string;
  screenSize: string;
  viewport: string;
  devicePixelRatio: number;
  touchSupport: boolean;
  orientation: string;
  protocol: string;
  hostname: string;
  isHTTPS: boolean;
  isLocalhost: boolean;
  isProduction: boolean;
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
  capabilities: {
    geolocation: boolean;
    permissions: boolean;
    serviceWorker: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    cookies: boolean;
    popupSupport: boolean;
  };
  errors: Array<{
    type: string;
    message: string;
    stack?: string;
    timestamp: string;
  }>;
  warnings: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export interface MobileErrorReport {
  errorId: string;
  message: string;
  stack?: string;
  componentStack?: string;
  isMobile: boolean;
  userAgent: string;
  timestamp: string;
  url: string;
  screenSize: string;
  viewport: string;
  devicePixelRatio: number;
  touchSupport: boolean;
  protocol: string;
  hostname: string;
}

class MobileDebugger {
  private static instance: MobileDebugger;
  private errors: Array<{ type: string; message: string; stack?: string; timestamp: string }> = [];
  private warnings: Array<{ type: string; message: string; timestamp: string }> = [];
  private originalConsoleError: typeof console.error;
  private originalConsoleWarn: typeof console.warn;
  private isInitialized = false;

  constructor() {
    if (MobileDebugger.instance) {
      return MobileDebugger.instance;
    }
    MobileDebugger.instance = this;
  }

  /**
   * Initialize the mobile debugger
   */
  public initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    // Store original console methods
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;

    // Override console.error to capture errors
    console.error = (...args) => {
      this.errors.push({
        type: 'console.error',
        message: args.join(' '),
        stack: new Error().stack,
        timestamp: new Date().toISOString()
      });
      this.originalConsoleError.apply(console, args);
    };

    // Override console.warn to capture warnings
    console.warn = (...args) => {
      this.warnings.push({
        type: 'console.warn',
        message: args.join(' '),
        timestamp: new Date().toISOString()
      });
      this.originalConsoleWarn.apply(console, args);
    };

    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.errors.push({
        type: 'unhandledError',
        message: event.message,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.errors.push({
        type: 'unhandledRejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
    });

    this.isInitialized = true;
    console.log('🔍 Mobile Debugger initialized');
  }

  /**
   * Detect if the current device is mobile
   */
  public isMobileDevice(): boolean {
    if (typeof window === 'undefined') return false;
    
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = [
      'mobile', 'android', 'iphone', 'ipad', 'windows phone', 'blackberry',
      'webos', 'ipod', 'opera mini', 'iemobile', 'mobile safari'
    ];
    
    const hasMobileKeywords = mobileKeywords.some(keyword => userAgent.includes(keyword));
    const isSmallScreen = window.innerWidth <= 768;
    const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasOrientation = 'orientation' in window;
    const isStandalone = (window.navigator as any).standalone === true;
    
    return hasMobileKeywords || (isSmallScreen && (hasTouchSupport || hasOrientation)) || isStandalone;
  }

  /**
   * Get browser information
   */
  public getBrowserInfo() {
    if (typeof window === 'undefined') {
      return { name: 'unknown', version: 'unknown', isChrome: false, isSafari: false, isFirefox: false, isEdge: false, isAndroid: false, isIOS: false };
    }
    
    const userAgent = navigator.userAgent;
    let name = 'unknown';
    let version = 'unknown';
    
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      name = 'Chrome';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      name = 'Safari';
    } else if (userAgent.includes('Firefox')) {
      name = 'Firefox';
    } else if (userAgent.includes('Edg')) {
      name = 'Edge';
    }
    
    const versionMatch = userAgent.match(/(Chrome|Safari|Firefox|Edge)\/(\d+\.\d+)/);
    if (versionMatch) {
      version = versionMatch[2];
    }
    
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
   * Check browser capabilities
   */
  public checkCapabilities() {
    if (typeof window === 'undefined') {
      return {
        geolocation: false,
        permissions: false,
        serviceWorker: false,
        localStorage: false,
        sessionStorage: false,
        cookies: false,
        popupSupport: false
      };
    }

    return {
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
      popupSupport: (() => {
        try {
          const testPopup = window.open('', '_blank', 'width=1,height=1');
          if (testPopup) {
            testPopup.close();
            return true;
          }
          return false;
        } catch {
          return false;
        }
      })()
    };
  }

  /**
   * Analyze mobile environment
   */
  public async analyzeEnvironment(): Promise<MobileDebugInfo> {
    if (typeof window === 'undefined') {
      throw new Error('Cannot analyze environment on server-side');
    }

    const userAgent = navigator.userAgent;
    const browser = this.getBrowserInfo();
    const capabilities = this.checkCapabilities();

    return {
      timestamp: new Date().toISOString(),
      userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      viewport: `${window.screen.width}x${window.screen.height}`,
      devicePixelRatio: window.devicePixelRatio || 1,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      orientation: (window as any).orientation || 'unknown',
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      isHTTPS: window.location.protocol === 'https:',
      isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
      isProduction: window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1',
      browser,
      capabilities,
      errors: [...this.errors],
      warnings: [...this.warnings]
    };
  }

  /**
   * Generate error report for mobile errors
   */
  public generateErrorReport(error: Error, componentStack?: string): MobileErrorReport {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack,
      isMobile: this.isMobileDevice(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server-side',
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'Server-side',
      screenSize: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Unknown',
      viewport: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'Unknown',
      devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      touchSupport: typeof window !== 'undefined' ? ('ontouchstart' in window || navigator.maxTouchPoints > 0) : false,
      protocol: typeof window !== 'undefined' ? window.location.protocol : 'Unknown',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'Unknown'
    };
  }

  /**
   * Send error report to server
   */
  public async sendErrorReport(error: Error, componentStack?: string): Promise<void> {
    try {
      const report = this.generateErrorReport(error, componentStack);
      
      await fetch('/api/errors/mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      });
      
      console.log('✅ Error report sent successfully:', report.errorId);
    } catch (reportError) {
      console.warn('❌ Failed to send error report:', reportError);
    }
  }

  /**
   * Get captured errors
   */
  public getErrors() {
    return [...this.errors];
  }

  /**
   * Get captured warnings
   */
  public getWarnings() {
    return [...this.warnings];
  }

  /**
   * Clear captured errors and warnings
   */
  public clearLogs() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Generate debug report
   */
  public generateDebugReport(info: MobileDebugInfo): string {
    let report = '🔍 MOBILE DEBUG REPORT\n';
    report += '='.repeat(50) + '\n\n';
    
    report += `📅 Timestamp: ${info.timestamp}\n`;
    report += `🌐 URL: ${info.protocol}//${info.hostname}\n\n`;
    
    report += '📱 DEVICE INFO:\n';
    report += `Screen: ${info.screenSize}\n`;
    report += `Viewport: ${info.viewport}\n`;
    report += `Touch: ${info.touchSupport ? 'Yes' : 'No'}\n`;
    report += `Orientation: ${info.orientation}\n`;
    report += `Pixel Ratio: ${info.devicePixelRatio}\n\n`;
    
    report += '🌐 BROWSER INFO:\n';
    report += `Browser: ${info.browser.name} ${info.browser.version}\n`;
    report += `Platform: ${info.browser.isAndroid ? 'Android' : info.browser.isIOS ? 'iOS' : 'Desktop'}\n\n`;
    
    report += '🔒 ENVIRONMENT:\n';
    report += `Protocol: ${info.protocol}\n`;
    report += `HTTPS: ${info.isHTTPS ? 'Yes' : 'No'}\n`;
    report += `Production: ${info.isProduction ? 'Yes' : 'No'}\n\n`;
    
    report += '⚡ CAPABILITIES:\n';
    report += `Geolocation: ${info.capabilities.geolocation ? 'Yes' : 'No'}\n`;
    report += `OAuth Popup: ${info.capabilities.popupSupport ? 'Yes' : 'No'}\n`;
    report += `Permissions: ${info.capabilities.permissions ? 'Yes' : 'No'}\n`;
    report += `Local Storage: ${info.capabilities.localStorage ? 'Yes' : 'No'}\n`;
    report += `Session Storage: ${info.capabilities.sessionStorage ? 'Yes' : 'No'}\n`;
    report += `Cookies: ${info.capabilities.cookies ? 'Yes' : 'No'}\n\n`;
    
    if (info.errors.length > 0) {
      report += '❌ ERRORS DETECTED:\n';
      info.errors.forEach((error, index) => {
        report += `${index + 1}. [${error.type}] ${error.message}\n`;
        if (error.stack) {
          report += `   Stack: ${error.stack.split('\n')[1]?.trim() || 'N/A'}\n`;
        }
        report += `   Time: ${error.timestamp}\n\n`;
      });
    }
    
    if (info.warnings.length > 0) {
      report += '⚠️ WARNINGS DETECTED:\n';
      info.warnings.forEach((warning, index) => {
        report += `${index + 1}. [${warning.type}] ${warning.message}\n`;
        report += `   Time: ${warning.timestamp}\n\n`;
      });
    }
    
    if (info.errors.length === 0 && info.warnings.length === 0) {
      report += '✅ NO ERRORS OR WARNINGS DETECTED\n\n';
    }
    
    return report;
  }

  /**
   * Check for common mobile issues
   */
  public checkMobileIssues(info: MobileDebugInfo): string[] {
    const issues: string[] = [];
    
    if (!info.isHTTPS && info.isProduction) {
      issues.push('HTTPS is required for mobile geolocation and OAuth');
    }
    
    if (!info.capabilities.popupSupport && info.browser.isAndroid) {
      issues.push('OAuth popups are blocked on this mobile browser');
    }
    
    if (!info.capabilities.geolocation && info.isMobileDevice()) {
      issues.push('Geolocation is not supported on this device');
    }
    
    if (!info.capabilities.localStorage) {
      issues.push('Local storage is not available');
    }
    
    if (info.errors.length > 0) {
      issues.push(`${info.errors.length} JavaScript errors detected`);
    }
    
    if (info.warnings.length > 0) {
      issues.push(`${info.warnings.length} console warnings detected`);
    }
    
    return issues;
  }
}

// Export singleton instance
export const mobileDebugger = new MobileDebugger();

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  mobileDebugger.initialize();
}

// Export utility functions
export const isMobileDevice = () => mobileDebugger.isMobileDevice();
export const getBrowserInfo = () => mobileDebugger.getBrowserInfo();
export const checkCapabilities = () => mobileDebugger.checkCapabilities();
export const analyzeEnvironment = () => mobileDebugger.analyzeEnvironment();
export const generateErrorReport = (error: Error, componentStack?: string) => 
  mobileDebugger.generateErrorReport(error, componentStack);
export const sendErrorReport = (error: Error, componentStack?: string) => 
  mobileDebugger.sendErrorReport(error, componentStack);
export const getErrors = () => mobileDebugger.getErrors();
export const getWarnings = () => mobileDebugger.getWarnings();
export const clearLogs = () => mobileDebugger.clearLogs();
export const generateDebugReport = (info: MobileDebugInfo) => 
  mobileDebugger.generateDebugReport(info);
export const checkMobileIssues = (info: MobileDebugInfo) => 
  mobileDebugger.checkMobileIssues(info);
