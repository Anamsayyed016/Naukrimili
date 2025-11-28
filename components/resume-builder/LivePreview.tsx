'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { LoadedTemplate, ColorVariant } from '@/lib/resume-builder/types';
import { cn } from '@/lib/utils';

interface LivePreviewProps {
  templateId: string;
  formData: Record<string, any>;
  selectedColorId?: string;
  className?: string;
}

export default function LivePreview({
  templateId,
  formData,
  selectedColorId,
  className,
}: LivePreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Create a stable reference for formData that changes when nested arrays change
  const formDataString = JSON.stringify(formData);
  
  useEffect(() => {
    let mounted = true;

    async function loadAndRender() {
      try {
        setLoading(true);
        setError(null);

        // Dynamically import template-loader to avoid module initialization issues
        const { loadTemplate } = await import('@/lib/resume-builder/template-loader');
        
        // Load template
        const loaded: LoadedTemplate | null = await loadTemplate(templateId);
        
        if (!mounted) return;

        if (!loaded) {
          throw new Error(`Template "${templateId}" not found`);
        }

        const { template, html, css } = loaded;

        // Get selected color variant
        const colorVariant = selectedColorId
          ? template.colors.find((c: ColorVariant) => c.id === selectedColorId) || template.colors[0]
          : template.colors.find((c: ColorVariant) => c.id === template.defaultColor) || template.colors[0];

        // Dynamically import applyColorVariant to avoid module initialization issues
        const { applyColorVariant } = await import('@/lib/resume-builder/template-loader');
        
        // Apply color variant to CSS
        const coloredCss = applyColorVariant(css, colorVariant);

        // Dynamically import injectResumeData to avoid module initialization issues
        const { injectResumeData } = await import('@/lib/resume-builder/template-loader');
        
        // Parse formData from string to ensure we have the latest data
        const currentFormData = JSON.parse(formDataString);
        
        // Debug: Log formData to check what sections have data (always enabled for troubleshooting)
        console.log('[LivePreview] formData check:', {
          hasLanguages: !!currentFormData.languages && Array.isArray(currentFormData.languages) && currentFormData.languages.length > 0,
          hasProjects: !!currentFormData.projects && Array.isArray(currentFormData.projects) && currentFormData.projects.length > 0,
          hasCertifications: !!currentFormData.certifications && Array.isArray(currentFormData.certifications) && currentFormData.certifications.length > 0,
          hasAchievements: !!currentFormData.achievements && Array.isArray(currentFormData.achievements) && currentFormData.achievements.length > 0,
          languages: currentFormData.languages,
          projects: currentFormData.projects,
          certifications: currentFormData.certifications,
          achievements: currentFormData.achievements,
          formDataKeys: Object.keys(currentFormData),
        });
        
        // Inject resume data into HTML
        const dataInjectedHtml = injectResumeData(html, currentFormData);

        // Combine into full HTML document with proper styling
        const fullHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              html {
                background-color: #ffffff !important;
                background: #ffffff !important;
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                overflow: hidden !important;
              }
              body {
                background-color: #ffffff !important;
                background: #ffffff !important;
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                color: #000000;
                overflow: hidden !important;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              
              .resume-container {
                width: 100% !important;
                max-width: 100% !important;
                height: 100% !important;
                display: block !important;
                margin: 0 auto !important;
                padding: 0 !important;
                overflow: hidden !important;
                transform-origin: top center;
              }
              
              /* Ensure all sections are visible */
              section, .section-content, .section-header {
                display: block !important;
                visibility: visible !important;
              }
              
              ${coloredCss}
            </style>
          </head>
          <body style="background-color: #ffffff; background: #ffffff; margin: 0; padding: 0; overflow-x: hidden; overflow-y: auto; width: 100%; min-height: 100%;">
            ${dataInjectedHtml}
          </body>
          </html>
        `;

        console.log('[LivePreview] Generated HTML length:', fullHtml.length);
        console.log('[LivePreview] HTML body preview:', dataInjectedHtml.substring(0, 500));

        setPreviewHtml(fullHtml);
        setLoading(false);
      } catch (err) {
        if (!mounted) return;
        console.error('Error loading preview:', err);
        setError(err instanceof Error ? err.message : 'Failed to load preview');
        setLoading(false);
      }
    }

    loadAndRender();

    return () => {
      mounted = false;
    };
  }, [templateId, formDataString, selectedColorId]);

  // Update iframe content when previewHtml changes
  useEffect(() => {
    if (iframeRef.current && previewHtml) {
      const iframe = iframeRef.current;
      
      // Function to load iframe content
      const loadIframe = () => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          
          if (!iframeDoc) {
            console.warn('[LivePreview] Iframe document not accessible');
            return;
          }
          
          iframeDoc.open();
          iframeDoc.write(previewHtml);
          iframeDoc.close();
          
          // Calculate scale to fit resume in container
          const calculateScale = () => {
            if (!containerRef.current) return 1;
            
            const containerWidth = containerRef.current.clientWidth;
            const containerHeight = containerRef.current.clientHeight;
            
            // Standard A4 resume dimensions (210mm x 297mm) in pixels at 96 DPI
            const resumeWidth = 794; // 210mm ≈ 794px
            const resumeHeight = 1123; // 297mm ≈ 1123px
            
            // Calculate scale to fit both width and height
            const scaleX = (containerWidth - 32) / resumeWidth; // 32px for padding
            const scaleY = (containerHeight - 32) / resumeHeight;
            const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
            
            return scale;
          };
          
          // Function to apply scale
          const applyScale = () => {
            const scale = calculateScale();
            
            // Ensure html element has white background and no overflow
            if (iframeDoc.documentElement) {
              iframeDoc.documentElement.style.backgroundColor = '#ffffff';
              iframeDoc.documentElement.style.background = '#ffffff';
              iframeDoc.documentElement.style.overflow = 'hidden';
              iframeDoc.documentElement.style.width = '100%';
              iframeDoc.documentElement.style.height = '100%';
            }
            
            // Ensure body has white background and no overflow
            if (iframeDoc.body) {
              iframeDoc.body.style.backgroundColor = '#ffffff';
              iframeDoc.body.style.background = '#ffffff';
              iframeDoc.body.style.margin = '0';
              iframeDoc.body.style.padding = '0';
              iframeDoc.body.style.overflow = 'hidden';
              iframeDoc.body.style.width = '100%';
              iframeDoc.body.style.height = '100%';
              iframeDoc.body.style.display = 'flex';
              iframeDoc.body.style.alignItems = 'center';
              iframeDoc.body.style.justifyContent = 'center';
            }
            
            // Ensure resume container is visible and scaled
            const resumeContainer = iframeDoc.querySelector('.resume-container');
            if (resumeContainer) {
              const container = resumeContainer as HTMLElement;
              container.style.width = '794px';
              container.style.height = '1123px';
              container.style.maxWidth = '794px';
              container.style.maxHeight = '1123px';
              container.style.display = 'block';
              container.style.margin = '0 auto';
              container.style.padding = '0';
              container.style.visibility = 'visible';
              container.style.overflow = 'hidden';
              container.style.transform = `scale(${scale})`;
              container.style.transformOrigin = 'top center';
            }
          };
          
          // Ensure all sections are visible
          const sections = iframeDoc.querySelectorAll('section, .section-content, .section-header');
          sections.forEach((section) => {
            (section as HTMLElement).style.display = 'block';
            (section as HTMLElement).style.visibility = 'visible';
          });
          
          // Wait for content to load, then calculate and apply scale
          setTimeout(() => {
            applyScale();
          }, 100);
          
          // Debug: Log iframe content after writing
          console.log('[LivePreview] Iframe content written, body length:', iframeDoc.body?.innerHTML?.length || 0);
          console.log('[LivePreview] Iframe body preview:', iframeDoc.body?.innerHTML?.substring(0, 200) || 'empty');
        } catch (error) {
          console.error('[LivePreview] Error writing to iframe:', error);
        }
      };
      
      // Try to access iframe document immediately, or wait for load
      if (iframe.contentDocument || iframe.contentWindow?.document) {
        loadIframe();
      } else {
        iframe.onload = loadIframe;
        // Fallback: try again after a short delay
        setTimeout(() => {
          if (!iframe.contentDocument && !iframe.contentWindow?.document) {
            console.warn('[LivePreview] Iframe document still not accessible after delay');
          } else {
            loadIframe();
          }
        }, 50);
      }
      
      // Add resize observer to recalculate scale on container resize
      let resizeObserver: ResizeObserver | null = null;
      
      if (containerRef.current) {
        const applyScaleOnResize = () => {
          if (iframeRef.current && previewHtml) {
            const iframe = iframeRef.current;
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            
            if (iframeDoc && containerRef.current) {
              const containerWidth = containerRef.current.clientWidth;
              const containerHeight = containerRef.current.clientHeight;
              const resumeWidth = 794;
              const resumeHeight = 1123;
              const scaleX = (containerWidth - 32) / resumeWidth;
              const scaleY = (containerHeight - 32) / resumeHeight;
              const scale = Math.min(scaleX, scaleY, 1);
              
              const resumeContainer = iframeDoc.querySelector('.resume-container');
              if (resumeContainer) {
                (resumeContainer as HTMLElement).style.transform = `scale(${scale})`;
              }
            }
          }
        };
        
        resizeObserver = new ResizeObserver(applyScaleOnResize);
        resizeObserver.observe(containerRef.current);
      }
      
      return () => {
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
    }
  }, [previewHtml]);

  if (loading) {
    return (
      <div className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-8 flex items-center justify-center min-h-[600px]', className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('bg-white rounded-lg shadow-sm border border-red-200 p-8', className)}>
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading preview</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden flex flex-col h-full', className)}>
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-purple-50/50 border-b border-gray-200/50 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50"
          />
          <p className="text-sm font-semibold text-gray-800">Live Preview</p>
        </div>
        <p className="text-xs text-gray-600 font-medium">Updates automatically</p>
      </div>
      <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-50/50 p-4 lg:p-6 flex-1 overflow-hidden flex flex-col">
        <div 
          ref={containerRef}
          className="bg-white shadow-2xl rounded-xl overflow-hidden mx-auto border-2 border-gray-200/80 flex-1 flex flex-col" 
          style={{ 
            width: '100%',
            maxWidth: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div 
            className="w-full bg-white flex-1 relative flex items-center justify-center"
            style={{ 
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}
          >
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0 bg-white"
              title="Resume Preview"
              sandbox="allow-same-origin"
              style={{ 
                width: '100%',
                height: '100%',
                display: 'block',
                border: 'none',
                backgroundColor: '#ffffff',
                background: '#ffffff',
                overflow: 'hidden'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

