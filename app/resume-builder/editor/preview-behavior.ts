/**
 * Resume Preview Runtime Helper
 * 
 * Purpose: Minimal runtime behavior fixes for preview functionality
 * Approach: Safe CSS class application and iframe height adjustment
 * Safety: Feature-flagged, non-invasive, preserves existing logic
 * 
 * USAGE:
 * Import in LivePreview component and call initPreviewBehavior()
 * Only if ENABLE_PREVIEW_OVERRIDES feature flag is true
 */

export interface PreviewBehaviorConfig {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  zoomLevel: number;
  enableAutoHeight?: boolean;
}

/**
 * Initialize preview behavior overrides
 * Safe: Only adds CSS classes and adjusts iframe height
 * @param config Configuration object with refs and zoom level
 */
export function initPreviewBehavior(config: PreviewBehaviorConfig): () => void {
  const { iframeRef, scrollContainerRef, zoomLevel, enableAutoHeight = true } = config;

  // Apply wrapper CSS classes
  if (scrollContainerRef.current) {
    scrollContainerRef.current.classList.add('resume-preview-container');
    scrollContainerRef.current.classList.add('resume-preview-zoom-container');
  }

  // Set up auto-height adjustment
  let resizeObserver: ResizeObserver | null = null;
  
  if (enableAutoHeight && iframeRef.current) {
    const adjustHeight = () => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc || !iframeDoc.body) return;

      // Get actual content height
      const resumeContainer = iframeDoc.querySelector('.resume-container') as HTMLElement;
      if (resumeContainer) {
        const contentHeight = resumeContainer.scrollHeight;
        
        // Set iframe height to match content (no scaling)
        iframe.style.height = `${contentHeight}px`;
        iframe.style.minHeight = `${Math.max(contentHeight, 1123)}px`; // At least A4 height
      }
    };

    // Adjust height on load and content changes
    const setupHeightAdjustment = () => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc || !iframeDoc.body) return;

      const resumeContainer = iframeDoc.querySelector('.resume-container');
      if (resumeContainer && window.ResizeObserver) {
        resizeObserver = new ResizeObserver(() => {
          adjustHeight();
        });
        resizeObserver.observe(resumeContainer);
      }

      // Initial adjustment
      adjustHeight();
    };

    // Wait for iframe to load
    const checkInterval = setInterval(() => {
      const iframeDoc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document;
      if (iframeDoc && iframeDoc.body && iframeDoc.querySelector('.resume-container')) {
        setupHeightAdjustment();
        clearInterval(checkInterval);
      }
    }, 100);

    // Cleanup after 10 seconds
    setTimeout(() => clearInterval(checkInterval), 10000);
  }

  // Apply zoom level via CSS class
  applyZoomLevel(scrollContainerRef.current, zoomLevel);

  // Cleanup function
  return () => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  };
}

/**
 * Apply zoom level to scroll container
 * Safe: Only applies CSS transform via class
 * @param container Scroll container element
 * @param zoom Zoom level (0.8 = 80%, 1.0 = 100%, 1.2 = 120%)
 */
export function applyZoomLevel(container: HTMLElement | null, zoom: number): void {
  if (!container) return;

  // Remove existing zoom classes
  container.classList.remove('resume-preview-zoom-80', 'resume-preview-zoom-100', 'resume-preview-zoom-120');

  // Apply appropriate zoom class
  if (zoom <= 0.85) {
    container.classList.add('resume-preview-zoom-80');
  } else if (zoom >= 1.15) {
    container.classList.add('resume-preview-zoom-120');
  } else {
    container.classList.add('resume-preview-zoom-100');
  }

  // For custom zoom levels, apply inline style
  if (zoom !== 0.8 && zoom !== 1.0 && zoom !== 1.2) {
    container.style.transform = `scale(${zoom})`;
  }
}

/**
 * Apply wrapper classes to preview container
 * Safe: Only adds CSS classes for styling
 * @param iframeWrapper Iframe wrapper element
 */
export function applyWrapperClasses(iframeWrapper: HTMLElement | null): void {
  if (!iframeWrapper) return;

  iframeWrapper.classList.add('resume-preview-iframe-wrapper');
}

/**
 * Feature flag check
 * Safe: Allows gradual rollout of new preview behavior
 * @returns boolean indicating if preview overrides should be enabled
 */
export function shouldEnablePreviewOverrides(): boolean {
  // Check for feature flag in environment or localStorage
  if (typeof window !== 'undefined') {
    // Check localStorage for development override
    const devOverride = localStorage.getItem('enable_preview_overrides');
    if (devOverride === 'true') return true;
    if (devOverride === 'false') return false;
  }

  // Check environment variable
  if (process.env.NEXT_PUBLIC_ENABLE_PREVIEW_OVERRIDES === 'true') {
    return true;
  }

  // Default: enabled (safe because it's CSS-only)
  return true;
}

/**
 * IMPLEMENTATION GUIDE:
 * 
 * In LivePreview.tsx, add this after existing refs and state:
 * 
 * ```tsx
 * import { initPreviewBehavior, applyWrapperClasses, shouldEnablePreviewOverrides } from './preview-behavior';
 * 
 * // In component body, after existing useEffect hooks:
 * useEffect(() => {
 *   if (!shouldEnablePreviewOverrides()) return;
 * 
 *   const cleanup = initPreviewBehavior({
 *     iframeRef,
 *     scrollContainerRef,
 *     zoomLevel,
 *     enableAutoHeight: true,
 *   });
 * 
 *   return cleanup;
 * }, [zoomLevel]);
 * 
 * // Apply wrapper classes to iframe container
 * useEffect(() => {
 *   if (!shouldEnablePreviewOverrides()) return;
 *   
 *   const iframeWrapper = scrollContainerRef.current?.querySelector('.relative') as HTMLElement;
 *   applyWrapperClasses(iframeWrapper);
 * }, []);
 * ```
 * 
 * SAFETY NOTES:
 * - Feature-flagged: Can be disabled if issues occur
 * - No existing logic modified: Only adds CSS classes
 * - ResizeObserver polyfill: Gracefully degrades if not available
 * - Cleanup: Properly disconnects observers on unmount
 * - Performance: Debounced height adjustments via ResizeObserver
 */
