'use client';

/**
 * Resume Preview Wrapper Component - Enhanced with Template System
 * 
 * Loads and renders the actual selected template with:
 * - Real template HTML and CSS from the gallery system
 * - Color variants applied properly
 * - Live resume data injection
 * - Independent vertical scrolling
 * - Professional template graphics and styling
 * 
 * Features:
 * - Uses the same template-loader system as the gallery
 * - Applies selected color variants
 * - Auto-updates when form data changes
 * - Sticky positioning for independent scrolling
 * - No conflicts with existing components
 */

import { useEffect, useRef, useState } from 'react';
import type { LoadedTemplate, ColorVariant } from '@/lib/resume-builder/types';

interface ResumePreviewWrapperProps {
  formData: Record<string, any>;
  templateId?: string;
  selectedColorId?: string;
  className?: string;
}

export default function ResumePreviewWrapper({
  formData,
  templateId,
  selectedColorId,
  className = '',
}: ResumePreviewWrapperProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const templateCacheRef = useRef<{ template: any; html: string; css: string } | null>(null);
  const previousFormDataRef = useRef<string>('');

  // Load template on mount or when templateId changes
  useEffect(() => {
    let mounted = true;

    async function loadTemplateData() {
      if (!templateId) {
        setError('No template selected');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Dynamically import to avoid module initialization issues
        const { loadTemplate } = await import('@/lib/resume-builder/template-loader');
        const loaded: LoadedTemplate | null = await loadTemplate(templateId);

        if (!mounted) return;

        if (!loaded) {
          throw new Error(`Template "${templateId}" not found`);
        }

        templateCacheRef.current = {
          template: loaded.template,
          html: loaded.html,
          css: loaded.css,
        };

        setLoading(false);
      } catch (err) {
        if (!mounted) return;
        console.error('Error loading template:', err);
        setError(err instanceof Error ? err.message : 'Failed to load template');
        setLoading(false);
      }
    }

    loadTemplateData();

    return () => {
      mounted = false;
    };
  }, [templateId]);

  // Update preview when formData or color changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !templateCacheRef.current || loading) return;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    const formDataString = JSON.stringify(formData);

    // Only update if form data actually changed
    if (previousFormDataRef.current === formDataString && !selectedColorId) return;

    previousFormDataRef.current = formDataString;

    (async () => {
      try {
        const { template, html, css } = templateCacheRef.current!;

        // Apply color variant if selected
        let finalCss = css;
        if (selectedColorId) {
          const { applyColorVariant } = await import('@/lib/resume-builder/template-loader');
          const colorVariant = template.colors.find((c: ColorVariant) => c.id === selectedColorId) || template.colors[0];
          finalCss = applyColorVariant(css, colorVariant);
        }

        // Inject form data into template
        const { injectResumeData } = await import('@/lib/resume-builder/template-loader');
        const injectedHtml = injectResumeData(html, formData);

        // Build complete HTML document
        const completeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resume Preview</title>
  <style>
    ${finalCss}
  </style>
</head>
<body>
  ${injectedHtml}
</body>
</html>`;

        iframeDoc.open();
        iframeDoc.write(completeHTML);
        iframeDoc.close();
      } catch (err) {
        console.error('Error updating preview:', err);
      }
    })();
  }, [formData, selectedColorId, loading]);

  return (
    <div 
      className={`resume-preview-wrapper ${className}`}
      style={{
        height: '100vh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#f3f4f6',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Preview Header */}
      <div 
        style={{
          padding: '12px 16px',
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          fontSize: '14px',
          fontWeight: 600,
          color: '#374151',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>Live Preview</span>
        {loading && (
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>Loading...</div>
        )}
        {error && (
          <div style={{ fontSize: '12px', color: '#ef4444' }}>Error loading template</div>
        )}
      </div>

      {/* Scrollable Preview Container */}
      <div 
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          background: '#f3f4f6',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {!error && (
          <iframe
            ref={iframeRef}
            title="Resume Preview"
            style={{
              width: '100%',
              minHeight: '100%',
              border: 'none',
              display: 'block',
              background: '#f3f4f6',
            }}
            sandbox="allow-same-origin"
          />
        )}
        {error && (
          <div style={{ padding: '20px', color: '#6b7280', textAlign: 'center' }}>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
