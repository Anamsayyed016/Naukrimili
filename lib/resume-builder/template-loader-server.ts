/**
 * Server-Side Template Loader Utility
 * Uses Node.js fs to load template files directly (for API routes)
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import templatesData from './templates.json';
import type { Template, LoadedTemplate, ColorVariant } from './template-loader';

/**
 * Load template metadata from JSON
 */
export async function loadTemplateMetadata(templateId: string): Promise<Template | null> {
  try {
    const template = templatesData.templates.find((t: Template) => t.id === templateId);
    if (!template) {
      console.error(`[loadTemplateMetadata] Template "${templateId}" not found in templates.json`);
      return null;
    }
    return template;
  } catch (error) {
    console.error('[loadTemplateMetadata] Error loading template metadata:', error);
    return null;
  }
}

/**
 * Process HTML content - extract body if needed
 */
function processHTMLContent(fileContent: string): string {
  // Extract body content from full HTML
  const bodyMatch = fileContent.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    return bodyMatch[1].trim();
  }
  
  // If no body tag found, check if it's already just body content
  if (!fileContent.includes('<!DOCTYPE') && !fileContent.includes('<html')) {
    return fileContent.trim();
  }
  
  // Fallback: return the full HTML
  return fileContent.trim();
}

/**
 * Load template HTML file using Node.js fs (server-side only)
 */
export async function loadTemplateHTMLServer(templatePath: string): Promise<string> {
  try {
    // Extract templateId from path
    const templateIdMatch = templatePath.match(/\/templates\/([^/]+)/);
    const templateId = templateIdMatch?.[1];
    
    if (!templateId) {
      throw new Error(`Could not extract templateId from path: ${templatePath}`);
    }

    // Construct file path - try multiple possible locations
    const fileName = 'index.html';
    const cwd = process.cwd();
    const possiblePaths = [
      join(cwd, 'public', 'templates', templateId, fileName),
      join(cwd, 'templates', templateId, fileName),
      join(cwd, '.next', 'static', 'templates', templateId, fileName),
      join(cwd, 'out', 'templates', templateId, fileName),
      // Production paths
      join(cwd, '..', 'public', 'templates', templateId, fileName),
      join(cwd, '..', 'templates', templateId, fileName),
      // Absolute path fallbacks
      `/var/www/html/public/templates/${templateId}/${fileName}`,
      `/home/public/templates/${templateId}/${fileName}`,
    ];

    let filePath: string | null = null;

    // Find the first existing path
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        filePath = path;
        break;
      }
    }

    if (!filePath) {
      console.error(`[loadTemplateHTMLServer] File not found at any path for: ${templateId}/${fileName}`);
      throw new Error(`Template HTML file not found: ${templateId}/${fileName}`);
    }

    console.log(`[loadTemplateHTMLServer] Loading HTML from: ${filePath}`);
    const fileContent = await readFile(filePath, 'utf-8');
    const processedContent = processHTMLContent(fileContent);
    
    console.log(`[loadTemplateHTMLServer] HTML loaded successfully (${processedContent.length} chars)`);
    return processedContent;
  } catch (error) {
    console.error('[loadTemplateHTMLServer] Error loading template HTML:', error);
    throw new Error(`Failed to load template HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load template CSS file using Node.js fs (server-side only)
 */
export async function loadTemplateCSSServer(templatePath: string): Promise<string> {
  try {
    // Extract templateId from path
    const templateIdMatch = templatePath.match(/\/templates\/([^/]+)/);
    const templateId = templateIdMatch?.[1];
    
    if (!templateId) {
      throw new Error(`Could not extract templateId from path: ${templatePath}`);
    }

    // Construct file path - try multiple possible locations
    const fileName = 'style.css';
    const cwd = process.cwd();
    const possiblePaths = [
      join(cwd, 'public', 'templates', templateId, fileName),
      join(cwd, 'templates', templateId, fileName),
      join(cwd, '.next', 'static', 'templates', templateId, fileName),
      join(cwd, 'out', 'templates', templateId, fileName),
      // Production paths
      join(cwd, '..', 'public', 'templates', templateId, fileName),
      join(cwd, '..', 'templates', templateId, fileName),
      // Absolute path fallbacks
      `/var/www/html/public/templates/${templateId}/${fileName}`,
      `/home/public/templates/${templateId}/${fileName}`,
    ];

    let filePath: string | null = null;

    // Find the first existing path
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        filePath = path;
        break;
      }
    }

    if (!filePath) {
      console.error(`[loadTemplateCSSServer] File not found at any path for: ${templateId}/${fileName}`);
      throw new Error(`Template CSS file not found: ${templateId}/${fileName}`);
    }

    console.log(`[loadTemplateCSSServer] Loading CSS from: ${filePath}`);
    const fileContent = await readFile(filePath, 'utf-8');
    
    console.log(`[loadTemplateCSSServer] CSS loaded successfully (${fileContent.length} chars)`);
    return fileContent.trim();
  } catch (error) {
    console.error('[loadTemplateCSSServer] Error loading template CSS:', error);
    throw new Error(`Failed to load template CSS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Load complete template using server-side file system (for API routes)
 */
export async function loadTemplateServer(templateId: string): Promise<LoadedTemplate | null> {
  try {
    console.log(`[loadTemplateServer] Starting to load template: ${templateId}`);
    
    const template = await loadTemplateMetadata(templateId);
    if (!template) {
      console.error(`[loadTemplateServer] Template metadata not found for: ${templateId}`);
      return null;
    }

    console.log(`[loadTemplateServer] Template metadata loaded. HTML path: ${template.html}, CSS path: ${template.css}`);

    let html: string;
    let css: string;

    try {
      html = await loadTemplateHTMLServer(template.html);
      console.log(`[loadTemplateServer] HTML loaded successfully (${html.length} chars)`);
    } catch (htmlError) {
      console.error(`[loadTemplateServer] Failed to load HTML from ${template.html}:`, htmlError);
      throw new Error(`Failed to load template HTML: ${htmlError instanceof Error ? htmlError.message : 'Unknown error'}`);
    }

    try {
      css = await loadTemplateCSSServer(template.css);
      console.log(`[loadTemplateServer] CSS loaded successfully (${css.length} chars)`);
    } catch (cssError) {
      console.error(`[loadTemplateServer] Failed to load CSS from ${template.css}:`, cssError);
      throw new Error(`Failed to load template CSS: ${cssError instanceof Error ? cssError.message : 'Unknown error'}`);
    }

    console.log(`[loadTemplateServer] Template "${templateId}" loaded successfully`);
    return {
      template,
      html,
      css,
    };
  } catch (error) {
    console.error(`[loadTemplateServer] Error loading template "${templateId}":`, error);
    throw error;
  }
}

/**
 * Apply color variant to CSS (re-export from original)
 */
export { applyColorVariant } from './template-loader';

/**
 * Inject resume data into HTML template (re-export from original)
 */
export { injectResumeData } from './template-loader';

