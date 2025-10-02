/**
 * Cache Busting Utilities
 * Ensures fresh content loads after deployments
 */

/**
 * Clear all possible browser caches
 */
export function clearBrowserCache(): void {
  try {
    // Clear service workers (if any)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
          console.log('🔧 Service Worker unregistered for cache busting');
        });
      });
    }

    // Clear IndexedDB (if used)
    if ('indexedDB' in window) {
      try {
        indexedDB.databases?.().then(databases => {
          databases.forEach(db => {
            if (db.name) {
              indexedDB.deleteDatabase(db.name);
            }
          });
        });
      } catch (error) {
        console.log('🔧 IndexedDB clearing not supported in this browser');
      }
    }

    // Clear localStorage (be careful with this)
    try {
      const keysToKeep = ['theme', 'language', 'user-preferences']; // Keep important user data
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      console.log('🔧 LocalStorage cleared (keeping user preferences)');
    } catch (error) {
      console.log('🔧 LocalStorage clearing failed:', error);
    }

    // Clear sessionStorage
    try {
      sessionStorage.clear();
      console.log('🔧 SessionStorage cleared');
    } catch (error) {
      console.log('🔧 SessionStorage clearing failed:', error);
    }

    console.log('✅ Browser cache clearing completed');
  } catch (error) {
    console.error('❌ Error clearing browser cache:', error);
  }
}

/**
 * Force reload with cache busting
 */
export function forceReloadWithCacheBust(): void {
  try {
    // Add cache busting parameter
    const url = new URL(window.location.href);
    url.searchParams.set('_cb', Date.now().toString());
    
    // Force reload
    window.location.href = url.toString();
  } catch (error) {
    console.error('❌ Error forcing reload:', error);
    // Fallback to simple reload
    window.location.reload();
  }
}

/**
 * Check if we're running an old version
 */
export function checkForOldVersion(): boolean {
  try {
    const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME;
    const currentTime = Date.now();
    
    if (buildTime) {
      const buildTimestamp = parseInt(buildTime);
      const hoursSinceBuild = (currentTime - buildTimestamp) / (1000 * 60 * 60);
      
      // If build is older than 24 hours, suggest cache clear
      if (hoursSinceBuild > 24) {
        console.warn('⚠️ Build is older than 24 hours, consider clearing cache');
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.log('🔧 Version check failed:', error);
    return false;
  }
}

/**
 * Initialize cache busting on app load
 */
export function initializeCacheBusting(): void {
  try {
    // Check if this is a hard refresh
    const isHardRefresh = performance.navigation.type === 1; // TYPE_RELOAD
    
    if (isHardRefresh) {
      console.log('🔄 Hard refresh detected - cache should be fresh');
    } else {
      console.log('📱 Normal navigation - checking for stale cache');
      
      // Check for old version
      if (checkForOldVersion()) {
        console.warn('⚠️ Old version detected - consider hard refresh');
      }
    }
    
    // Log current build info
    if (process.env.NEXT_PUBLIC_BUILD_TIME) {
      const buildDate = new Date(parseInt(process.env.NEXT_PUBLIC_BUILD_TIME));
      console.log(`📦 Build time: ${buildDate.toISOString()}`);
    }
    
  } catch (error) {
    console.error('❌ Error initializing cache busting:', error);
  }
}
