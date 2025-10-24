/**
 * Mobile-Compatible Notification Utilities
 * Handles browser notifications with proper mobile device detection and fallbacks
 */

export interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface NotificationCapabilities {
  supported: boolean;
  permission: 'default' | 'granted' | 'denied';
  canRequest: boolean;
  isMobile: boolean;
  fallbackAvailable: boolean;
}

/**
 * Check if notifications are supported and get capabilities
 */
export function checkNotificationCapabilities(): NotificationCapabilities {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      permission: 'denied',
      canRequest: false,
      isMobile: false,
      fallbackAvailable: false
    };
  }

  const isMobile = window.innerWidth <= 768 || 
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const supported = 'Notification' in window;
  let permission: 'default' | 'granted' | 'denied' = 'denied';
  let canRequest = false;

  if (supported) {
    try {
      permission = Notification.permission as 'default' | 'granted' | 'denied';
      canRequest = permission === 'default';
    } catch (error) {
      console.warn('Failed to check notification permission:', error);
    }
  }

  return {
    supported,
    permission,
    canRequest,
    isMobile,
    fallbackAvailable: true // We can always fall back to in-app notifications
  };
}

/**
 * Request notification permission with mobile compatibility
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const capabilities = checkNotificationCapabilities();
  
  if (!capabilities.supported) {
    console.warn('Notifications not supported on this device');
    return false;
  }

  if (!capabilities.canRequest) {
    console.log('Notification permission already set:', capabilities.permission);
    return capabilities.permission === 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('Notification permission result:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
}

/**
 * Show a browser notification with mobile compatibility checks
 */
export function showBrowserNotification(options: NotificationOptions): boolean {
  const capabilities = checkNotificationCapabilities();
  
  if (!capabilities.supported || capabilities.permission !== 'granted') {
    console.warn('Cannot show browser notification:', {
      supported: capabilities.supported,
      permission: capabilities.permission
    });
    return false;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false
    });

    // Auto-close notification after 5 seconds on mobile
    if (capabilities.isMobile) {
      setTimeout(() => {
        notification.close();
      }, 5000);
    }

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    console.log('✅ Browser notification shown:', options.title);
    return true;
  } catch (error) {
    console.error('Failed to show browser notification:', error);
    return false;
  }
}

/**
 * Show a notification with automatic fallback to in-app notification
 */
export function showNotification(options: NotificationOptions): boolean {
  const capabilities = checkNotificationCapabilities();
  
  // Try browser notification first
  if (showBrowserNotification(options)) {
    return true;
  }

  // Fallback to in-app notification
  console.log('📱 Using in-app notification fallback for mobile device');
  return showInAppNotification(options);
}

/**
 * Show an in-app notification (fallback for mobile)
 */
export function showInAppNotification(options: NotificationOptions): boolean {
  try {
    // Detect mobile device for better positioning
    const isMobile = window.innerWidth <= 768 || 
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Create a temporary notification element
    const notification = document.createElement('div');
    
    // Mobile-optimized positioning and styling
    if (isMobile) {
      notification.className = 'fixed top-4 left-4 right-4 z-50 max-w-full bg-white border border-gray-200 rounded-xl shadow-2xl p-4 transform transition-all duration-300 translate-y-[-100%]';
      notification.style.zIndex = '9999';
      notification.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
      (notification.style as any).webkitFontSmoothing = 'antialiased';
      (notification.style as any).mozOsxFontSmoothing = 'grayscale';
    } else {
      notification.className = 'fixed top-4 right-4 z-50 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4 transform transition-all duration-300 translate-x-full';
      notification.style.zIndex = '9999';
    }
    
    notification.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zM13 12l-3 3-3-3"></path>
            </svg>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-medium text-gray-900 leading-tight">${options.title}</h4>
          ${options.body ? `<p class="text-sm text-gray-600 mt-1 leading-relaxed">${options.body}</p>` : ''}
        </div>
        <button class="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 touch-manipulation" onclick="this.parentElement.parentElement.remove()">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Animate in with mobile-optimized animation
    setTimeout(() => {
      if (isMobile) {
        notification.style.transform = 'translateY(0)';
      } else {
        notification.style.transform = 'translateX(0)';
      }
    }, 100);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (isMobile) {
        notification.style.transform = 'translateY(-100%)';
      } else {
        notification.style.transform = 'translateX(100%)';
      }
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }, 5000);

    console.log('✅ In-app notification shown:', options.title);
    return true;
  } catch (error) {
    console.error('Failed to show in-app notification:', error);
    return false;
  }
}

/**
 * Test notification functionality
 */
export async function testNotifications(): Promise<{
  success: boolean;
  method: 'browser' | 'in-app' | 'none';
  error?: string;
}> {
  try {
    const capabilities = checkNotificationCapabilities();
    
    if (!capabilities.supported) {
      return {
        success: false,
        method: 'none',
        error: 'Notifications not supported on this device'
      };
    }

    if (capabilities.permission === 'default') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        return {
          success: false,
          method: 'in-app',
          error: 'Notification permission denied'
        };
      }
    }

    if (capabilities.permission === 'granted') {
      const success = showBrowserNotification({
        title: 'Test Notification',
        body: 'This is a test notification to verify functionality',
        tag: 'test-notification'
      });
      
      return {
        success,
        method: 'browser'
      };
    }

    // Fallback to in-app notification
    const success = showInAppNotification({
      title: 'Test Notification',
      body: 'This is a test notification (in-app fallback)',
      tag: 'test-notification'
    });

    return {
      success,
      method: 'in-app'
    };
  } catch (error: any) {
    return {
      success: false,
      method: 'none',
      error: error.message
    };
  }
}

/**
 * Initialize notifications with mobile compatibility
 */
export async function initializeNotifications(): Promise<NotificationCapabilities> {
  const capabilities = checkNotificationCapabilities();
  
  console.log('🔔 Notification capabilities:', capabilities);
  
  if (capabilities.supported && capabilities.canRequest) {
    try {
      await requestNotificationPermission();
      // Re-check capabilities after permission request
      return checkNotificationCapabilities();
    } catch (error) {
      console.warn('Failed to initialize notifications:', error);
    }
  }
  
  return capabilities;
}
