'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  GALLERY_IFRAME_HEIGHT,
  GALLERY_IFRAME_WIDTH,
  computeGalleryThumbnailScale,
} from '@/components/resume-builder/preview-scale';

interface GalleryResumePreviewProps {
  previewHtml: string;
  loading: boolean;
  error: string | null;
  templateName: string;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  className?: string;
  /** Enables DOM-aware priority balancing (experience emphasis, sidebar compact). */
  formData?: Record<string, unknown>;
  /** When set, DOM refine uses the same template capacity path as Live Preview. */
  templateId?: string;
}

/**
 * Scaled iframe preview for template gallery cards only.
 * Uses ResizeObserver + proportional fit — not used by LivePreview/editor.
 */
export default function GalleryResumePreview({
  previewHtml,
  loading,
  error,
  templateName,
  iframeRef,
  className,
  formData,
  templateId,
}: GalleryResumePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [contentHeight, setContentHeight] = useState(GALLERY_IFRAME_HEIGHT);

  const measureIframeContent = useCallback(() => {
    const iframe = iframeRef.current;
    const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
    if (!iframe || !iframeDoc?.body) return GALLERY_IFRAME_HEIGHT;

    const resumeContainer = iframeDoc.querySelector('.resume-container') as HTMLElement | null;
    const measured = Math.ceil(
      resumeContainer?.scrollHeight ||
        resumeContainer?.offsetHeight ||
        iframeDoc.body.scrollHeight ||
        GALLERY_IFRAME_HEIGHT
    );
    const height = Math.max(measured, GALLERY_IFRAME_HEIGHT);
    setContentHeight(height);
    iframe.style.height = `${height}px`;
    iframeDoc.body.style.overflow = 'visible';
    iframeDoc.documentElement.style.overflow = 'visible';
    iframeDoc.body.style.height = `${height}px`;
    iframeDoc.documentElement.style.height = `${height}px`;
    return height;
  }, [iframeRef]);

  const updateScale = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setScale(
      computeGalleryThumbnailScale(
        el.clientWidth,
        el.clientHeight,
        6,
        contentHeight
      )
    );
  }, [contentHeight]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateScale();
    const ro = new ResizeObserver(() => updateScale());
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateScale]);

  useEffect(() => {
    if (!previewHtml || loading || error) return;
    const iframe = iframeRef.current;
    const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
    if (!iframeDoc) return;
    iframeDoc.open();
    iframeDoc.write(previewHtml);
    iframeDoc.close();
    requestAnimationFrame(() => {
      // No DOM-aware typography refinement: adaptive spacing is injected server-side.
      measureIframeContent();
      updateScale();
      window.setTimeout(() => {
        measureIframeContent();
        updateScale();
      }, 120);
    });
  }, [previewHtml, loading, error, iframeRef, updateScale, formData, measureIframeContent, templateId]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute inset-0 flex items-center justify-center overflow-hidden bg-white',
        className
      )}
    >
      {loading ? (
        <div className="flex h-full w-full items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
            <p className="text-xs text-gray-500">Loading preview...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex h-full w-full items-center justify-center bg-gray-50 p-4">
          <div className="text-center">
            <FileText className="mx-auto mb-2 h-10 w-10 text-gray-400" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        </div>
      ) : (
        <iframe
          ref={iframeRef}
          className="pointer-events-none border-0"
          title={`Preview: ${templateName}`}
          sandbox="allow-same-origin allow-scripts"
          scrolling="no"
          style={{
            width: `${GALLERY_IFRAME_WIDTH}px`,
            height: `${contentHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            border: 'none',
            overflow: 'hidden',
            display: 'block',
            flexShrink: 0,
            margin: 0,
            padding: 0,
            backgroundColor: 'white',
          }}
        />
      )}
    </div>
  );
}
