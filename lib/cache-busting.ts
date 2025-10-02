/**
 * Cache Busting Utilities
 * Forces browser cache invalidation for JavaScript chunks and static assets
 */

// Force new build timestamp for cache busting
export const BUILD_TIMESTAMP = Date.now();
export const BUILD_VERSION = process.env.NEXT_PUBLIC_BUILD_TIME || BUILD_TIMESTAMP.toString();

/**
 * Add cache-busting parameters to URLs
 */
export function addCacheBusting(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${BUILD_VERSION}&t=${BUILD_TIMESTAMP}`;
}

/**
 * Check if current build is outdated
 */
export function isBuildOutdated(): boolean {
  const currentBuild = localStorage.getItem('app_build_version');
  return currentBuild !== BUILD_VERSION;
}

/**
 * Force cache invalidation
 */
export function invalidateCache(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear localStorage cache markers
    localStorage.removeItem('app_build_version');
    localStorage.removeItem('app_cache_timestamp');
    
    // Clear service worker cache if available
    if ('serviceWorker' in navigator && 'caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }
    
    // Force reload with cache busting
    window.location.reload();
  } catch (error) {
    console.warn('Failed to invalidate cache:', error);
  }
}

/**
 * Initialize cache busting on app load
 */
export function initializeCacheBusting(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const currentBuild = localStorage.getItem('app_build_version');
    const currentTimestamp = localStorage.getItem('app_cache_timestamp');
    
    // Check if build is outdated
    if (currentBuild !== BUILD_VERSION || !currentTimestamp) {
      console.log('🔄 New build detected, updating cache markers');
      localStorage.setItem('app_build_version', BUILD_VERSION);
      localStorage.setItem('app_cache_timestamp', Date.now().toString());
      
      // Optional: Force cache invalidation for major version changes
      if (currentBuild && currentBuild !== BUILD_VERSION) {
        console.log('🔄 Build version changed, invalidating cache');
        setTimeout(() => {
          if (isBuildOutdated()) {
            invalidateCache();
          }
        }, 1000);
      }
    }
  } catch (error) {
    console.warn('Failed to initialize cache busting:', error);
  }
}

/**
 * Create cache-busting script tag
 */
export function createCacheBustingScript(): string {
  return `
    <script>
      (function() {
        var BUILD_VERSION = '${BUILD_VERSION}';
        var BUILD_TIMESTAMP = ${BUILD_TIMESTAMP};
        
        function checkBuildVersion() {
          var currentBuild = localStorage.getItem('app_build_version');
          if (currentBuild !== BUILD_VERSION) {
            console.log('🔄 New build detected, clearing cache');
            localStorage.removeItem('app_build_version');
            localStorage.removeItem('app_cache_timestamp');
            
            // Clear all caches
            if ('caches' in window) {
              caches.keys().then(function(cacheNames) {
                cacheNames.forEach(function(cacheName) {
                  caches.delete(cacheName);
                });
              });
            }
          }
          
          localStorage.setItem('app_build_version', BUILD_VERSION);
          localStorage.setItem('app_cache_timestamp', Date.now());
        }
        
        // Run on load
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', checkBuildVersion);
        } else {
          checkBuildVersion();
        }
      })();
    </script>
  `;
}

/**
 * Generate unique chunk names with timestamp
 */
export function generateChunkName(baseName: string): string {
  return `${baseName}-${BUILD_TIMESTAMP}`;
}

/**
 * Webpack cache busting configuration
 */
export const webpackCacheBusting = {
  output: {
    chunkFilename: `static/chunks/[name]-${BUILD_TIMESTAMP}.[contenthash].js`,
    filename: `static/chunks/[name]-${BUILD_TIMESTAMP}.[contenthash].js`,
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        default: {
          name: `chunk-${BUILD_TIMESTAMP}`,
        },
      },
    },
  },
};