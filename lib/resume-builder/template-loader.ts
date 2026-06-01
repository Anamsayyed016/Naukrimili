/**
 * Template Loader Utility
 * Dynamically loads template HTML and CSS files
 */

// Lazy load templates data to avoid module initialization issues
let templatesDataCache: Record<string, unknown> | null = null;
async function getTemplatesData(): Promise<Record<string, unknown>> {
  if (!templatesDataCache) {
    const templatesModule = await import('./templates.json');
    templatesDataCache = templatesModule.default;
  }
  return templatesDataCache;
}

// Re-export types from types.ts to maintain backwards compatibility
// This ensures existing code continues to work while avoiding TDZ issues
export type { Template, ColorVariant, LoadedTemplate } from './types';

// Import types for use in function signatures
import type { Template, ColorVariant, LoadedTemplate } from './types';
import {
  filterMeaningfulExperiences,
  filterMeaningfulEducation,
  filterMeaningfulSkills,
  filterMeaningfulProjects,
  filterMeaningfulCertifications,
  filterMeaningfulAchievements,
  normalizeSkillsForRender,
  isFresherProfile,
  estimateExperienceYears,
  isSectionForcedHidden,
  processHandlebarsConditionals,
  renderContactListHtml,
  resolveProfileImageForRender,
  coalesceFormDataForTemplateRender,
} from './section-visibility';
import { resolveGalleryProfileImage } from './gallery-demo';

/**
 * Load template metadata from JSON
 */
export async function loadTemplateMetadata(templateId: string): Promise<Template | null> {
  try {
    const templatesData = await getTemplatesData();
    if (!templatesData?.templates || !Array.isArray(templatesData.templates)) {
      console.error('[loadTemplateMetadata] templatesData is invalid:', templatesData);
      return null;
    }
    
    const template = templatesData.templates.find((t: Template) => t.id === templateId);
    
    if (!template) {
      console.error(`[loadTemplateMetadata] Template "${templateId}" not found in templates.json`);
      console.error('[loadTemplateMetadata] Available templates:', templatesData.templates.map((t: Template) => t.id));
      return null;
    }
    
    console.log(`[loadTemplateMetadata] Found template: ${template.name} (${template.id})`);
    return template;
  } catch (error) {
    console.error('[loadTemplateMetadata] Error loading template metadata:', error);
    return null;
  }
}

/**
 * Load template HTML file and extract body content
 */
export async function loadTemplateHTML(templatePath: string): Promise<string> {
  try {
    // Extract templateId from path - handle both /templates/id/ and /templates/id/file.html formats
    const templateIdMatch = templatePath.match(/\/templates\/([^/]+)/);
    const templateId = templateIdMatch?.[1];
    
    if (!templateId) {
      console.warn(`[loadTemplateHTML] Could not extract templateId from: ${templatePath}, using direct path`);
      // Fallback to direct path
      const response = await fetch(templatePath);
      if (!response.ok) {
        throw new Error(`Failed to load HTML: ${response.status} ${response.statusText}`);
      }
      const fullHTML = await response.text();
      const bodyMatch = fullHTML.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch) {
        return bodyMatch[1].trim();
      }
      return fullHTML.trim();
    }
    
    // Try new query parameter route first (more reliable in Next.js 15)
    // Use canonical base URL
    const { getBaseUrl } = await import('@/lib/url-utils');
    const baseUrl = getBaseUrl();
    const queryRoute = `${baseUrl}/api/resume-builder/templates?templateId=${encodeURIComponent(templateId)}&fileType=html`;
    console.log(`[loadTemplateHTML] Trying query parameter route: ${queryRoute}`);
    
    try {
      const response = await fetch(queryRoute, {
        cache: 'no-store',
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          // API returned JSON error
          const errorData = await response.json();
          console.warn(`[loadTemplateHTML] Query route returned JSON error:`, errorData);
        } else {
          const html = await response.text();
          if (html && html.length > 0) {
            console.log(`[loadTemplateHTML] Successfully loaded via query route (${html.length} chars)`);
            return html.trim();
          }
        }
      } else {
        const errorText = await response.text().catch(() => '');
        console.warn(`[loadTemplateHTML] Query route returned ${response.status}: ${errorText.substring(0, 100)}`);
      }
    } catch (queryError) {
      console.warn(`[loadTemplateHTML] Query route failed:`, queryError instanceof Error ? queryError.message : queryError);
    }
    
    // Fallback 1: Try nested dynamic route (old route, kept for backward compatibility)
    const nestedRoute = `${baseUrl}/api/resume-builder/templates/${encodeURIComponent(templateId)}/html`;
    console.log(`[loadTemplateHTML] Trying nested dynamic route: ${nestedRoute}`);
    
    try {
      const response = await fetch(nestedRoute, {
        cache: 'no-store',
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          // API returned JSON error
          const errorData = await response.json();
          console.warn(`[loadTemplateHTML] Nested route returned JSON error:`, errorData);
        } else {
          const html = await response.text();
          if (html && html.length > 0) {
            console.log(`[loadTemplateHTML] Successfully loaded via nested route (${html.length} chars)`);
            return html.trim();
          }
        }
      } else {
        const errorText = await response.text().catch(() => '');
        console.warn(`[loadTemplateHTML] Nested route returned ${response.status}: ${errorText.substring(0, 100)}`);
      }
    } catch (nestedError) {
      console.warn(`[loadTemplateHTML] Nested route failed:`, nestedError instanceof Error ? nestedError.message : nestedError);
    }
    
    // Fallback 2: Direct path (last resort) - only works if file is in public directory
    const directPath = templatePath.startsWith('/') ? `${baseUrl}${templatePath}` : `${baseUrl}/${templatePath}`;
    console.log(`[loadTemplateHTML] Trying direct path: ${directPath}`);
    try {
      const directResponse = await fetch(directPath, {
        cache: 'no-store',
        method: 'GET',
        credentials: 'include',
      });
      
      if (!directResponse.ok) {
        throw new Error(`Failed to load HTML: ${directResponse.status} ${directResponse.statusText}`);
      }
      
      const fullHTML = await directResponse.text();
    
      // Extract body content from full HTML
      const bodyMatch = fullHTML.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch) {
        return bodyMatch[1].trim();
      }
      
      // If no body tag found, check if it's already just body content
      if (!fullHTML.includes('<!DOCTYPE') && !fullHTML.includes('<html')) {
        return fullHTML.trim();
      }
      
      // Fallback: return the full HTML (will be handled in renderer)
      console.warn('Could not extract body content from template HTML, using full HTML');
      return fullHTML.trim();
    } catch (directError) {
      console.warn(`[loadTemplateHTML] Direct path failed:`, directError instanceof Error ? directError.message : directError);
      
      // Provide more detailed error information
      const errorDetails = directError instanceof Error ? directError.message : 'Unknown error';
      const fullError = `Failed to load template HTML from all paths. Template: ${templateId}, Path: ${templatePath}, Error: ${errorDetails}`;
      
      console.error(`[loadTemplateHTML] Full error details:`, {
        templateId,
        templatePath,
        error: errorDetails,
        attemptedRoutes: [
          `${baseUrl}/api/resume-builder/templates?templateId=${encodeURIComponent(templateId)}&fileType=html`,
          `${baseUrl}/api/resume-builder/templates/${encodeURIComponent(templateId)}/html`,
          directPath
        ]
      });
      
      throw new Error(fullError);
    }
  } catch (error) {
    console.error('[loadTemplateHTML] Error loading template HTML:', error);
    console.error('[loadTemplateHTML] Template path:', templatePath);
    const extractedTemplateId = templatePath.match(/\/templates\/([^/]+)/)?.[1] || 'unknown';
    console.error('[loadTemplateHTML] Template ID:', extractedTemplateId);
    throw error;
  }
}

/**
 * Load template CSS file
 */
export async function loadTemplateCSS(templatePath: string): Promise<string> {
  try {
    // Extract templateId from path - handle both /templates/id/ and /templates/id/file.css formats
    const templateIdMatch = templatePath.match(/\/templates\/([^/]+)/);
    const templateId = templateIdMatch?.[1];
    
    if (!templateId) {
      console.warn(`[loadTemplateCSS] Could not extract templateId from: ${templatePath}, using direct path`);
      // Fallback to direct path
      const response = await fetch(templatePath);
      if (!response.ok) {
        throw new Error(`Failed to load CSS: ${response.status} ${response.statusText}`);
      }
      const css = await response.text();
      return css.replace(/@import[^;]+;/gi, '').trim();
    }
    
    // Try new query parameter route first (more reliable in Next.js 15)
    // Use canonical base URL
    const { getBaseUrl } = await import('@/lib/url-utils');
    const baseUrl = getBaseUrl();
    const queryRoute = `${baseUrl}/api/resume-builder/templates?templateId=${encodeURIComponent(templateId)}&fileType=css`;
    console.log(`[loadTemplateCSS] Trying query parameter route: ${queryRoute}`);
    
    try {
      const response = await fetch(queryRoute, {
        cache: 'no-store',
        method: 'GET',
        headers: {
          'Accept': 'text/css,application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          // API returned JSON error
          const errorData = await response.json();
          console.warn(`[loadTemplateCSS] Query route returned JSON error:`, errorData);
        } else {
          const css = await response.text();
          if (css && css.length > 0) {
            console.log(`[loadTemplateCSS] Successfully loaded via query route (${css.length} chars)`);
            // Remove any @import statements that might cause issues
            return css.replace(/@import[^;]+;/gi, '').trim();
          }
        }
      } else {
        const errorText = await response.text().catch(() => '');
        console.warn(`[loadTemplateCSS] Query route returned ${response.status}: ${errorText.substring(0, 100)}`);
      }
    } catch (queryError) {
      console.warn(`[loadTemplateCSS] Query route failed:`, queryError instanceof Error ? queryError.message : queryError);
    }
    
    // Fallback 1: Try nested dynamic route (old route, kept for backward compatibility)
    const nestedRoute = `${baseUrl}/api/resume-builder/templates/${encodeURIComponent(templateId)}/css`;
    console.log(`[loadTemplateCSS] Trying nested dynamic route: ${nestedRoute}`);
    
    try {
      const response = await fetch(nestedRoute, {
        cache: 'no-store',
        method: 'GET',
        headers: {
          'Accept': 'text/css,application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          // API returned JSON error
          const errorData = await response.json();
          console.warn(`[loadTemplateCSS] Nested route returned JSON error:`, errorData);
        } else {
          const css = await response.text();
          if (css && css.length > 0) {
            console.log(`[loadTemplateCSS] Successfully loaded via nested route (${css.length} chars)`);
            // Remove any @import statements that might cause issues
            return css.replace(/@import[^;]+;/gi, '').trim();
          }
        }
      } else {
        const errorText = await response.text().catch(() => '');
        console.warn(`[loadTemplateCSS] Nested route returned ${response.status}: ${errorText.substring(0, 100)}`);
      }
    } catch (nestedError) {
      console.warn(`[loadTemplateCSS] Nested route failed:`, nestedError instanceof Error ? nestedError.message : nestedError);
    }
    
    // Fallback 2: Direct path (last resort) - only works if file is in public directory
    const directPath = templatePath.startsWith('/') ? `${baseUrl}${templatePath}` : `${baseUrl}/${templatePath}`;
    console.log(`[loadTemplateCSS] Trying direct path: ${directPath}`);
    try {
      const directResponse = await fetch(directPath, {
        cache: 'no-store',
        method: 'GET',
        credentials: 'include',
      });
      
      if (!directResponse.ok) {
        throw new Error(`Failed to load CSS: ${directResponse.status} ${directResponse.statusText}`);
      }
      
      const css = await directResponse.text();
      
      // Remove any @import statements that might cause issues
      return css.replace(/@import[^;]+;/gi, '').trim();
    } catch (directError) {
      console.warn(`[loadTemplateCSS] Direct path failed:`, directError instanceof Error ? directError.message : directError);
      // Re-throw with more context
      throw new Error(`Failed to load template CSS from all paths. Template: ${templateId}, Path: ${templatePath}, Error: ${directError instanceof Error ? directError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error loading template CSS:', error);
    console.error('Template path:', templatePath);
    throw error;
  }
}

/**
 * Load complete template (metadata + HTML + CSS)
 */
export async function loadTemplate(templateId: string): Promise<LoadedTemplate | null> {
  try {
    console.log(`[loadTemplate] Starting to load template: ${templateId}`);
    
    const template = await loadTemplateMetadata(templateId);
    if (!template) {
      console.error(`[loadTemplate] Template metadata not found for: ${templateId}`);
      return null;
    }

    console.log(`[loadTemplate] Template metadata loaded. HTML path: ${template.html}, CSS path: ${template.css}`);

    let html: string;
    let css: string;

    try {
      html = await loadTemplateHTML(template.html);
      console.log(`[loadTemplate] HTML loaded successfully (${html.length} chars)`);
    } catch (htmlError) {
      console.error(`[loadTemplate] Failed to load HTML from ${template.html}:`, htmlError);
      throw new Error(`Failed to load template HTML: ${htmlError instanceof Error ? htmlError.message : 'Unknown error'}`);
    }

    try {
      css = await loadTemplateCSS(template.css);
      console.log(`[loadTemplate] CSS loaded successfully (${css.length} chars)`);
    } catch (cssError) {
      console.error(`[loadTemplate] Failed to load CSS from ${template.css}:`, cssError);
      throw new Error(`Failed to load template CSS: ${cssError instanceof Error ? cssError.message : 'Unknown error'}`);
    }

    console.log(`[loadTemplate] Template "${templateId}" loaded successfully`);
    return {
      template,
      html,
      css,
    };
  } catch (error) {
    console.error(`[loadTemplate] Error loading template "${templateId}":`, error);
    throw error; // Re-throw to provide better error message
  }
}

/**
 * Apply color variant to CSS
 */
export { applyColorVariant } from './color-theme';

export interface InjectResumeDataOptions {
  /** Template gallery / change-template modal only — uses demo profile when no user upload */
  galleryPreview?: boolean;
  /** Picks template-specific demo portrait in gallery mode */
  galleryTemplateId?: string;
}

/**
 * Inject resume data into HTML template
 */
export function injectResumeData(
  htmlTemplate: string,
  formData: Record<string, unknown>,
  options?: InjectResumeDataOptions
): string {
  const data = coalesceFormDataForTemplateRender(formData);

  // Helper function to safely extract string values
  const getString = (key: string | string[]): string => {
    if (Array.isArray(key)) {
      for (const k of key) {
        const value = data[k];
        if (typeof value === 'string' && value) return value;
      }
      return '';
    }
    const value = data[key];
    return typeof value === 'string' ? value : '';
  };

  // Helper function to safely extract array values
  const getArray = <T>(key: string | string[], defaultValue: T[] = []): T[] => {
    if (Array.isArray(key)) {
      for (const k of key) {
        const value = data[k];
        if (Array.isArray(value)) return value as T[];
      }
      return defaultValue;
    }
    const value = data[key];
    return Array.isArray(value) ? (value as T[]) : defaultValue;
  };

  const firstName = getString(['firstName', 'First Name']).trim();
  const lastName = getString(['lastName', 'Last Name']).trim();
  const legacyFullName = getString(['Full Name', 'name']).trim();

  // Prefer live first/last name over stale imported `name` (fixes preview not clearing)
  let fullName = '';
  if (firstName || lastName) {
    fullName = `${firstName} ${lastName}`.trim();
  } else if (legacyFullName) {
    fullName = legacyFullName;
  }
  
  const email = getString(['Email', 'email']);
  const phone = getString(['Phone', 'phone']);
  const jobTitle = getString(['Job Title', 'jobTitle', 'desiredJobTitle']);
  const location = getString(['Location', 'location']);
  const linkedin = getString(['LinkedIn', 'linkedin']);
  const portfolio = getString(['Portfolio', 'website', 'portfolio']);
  
  const summary = getString(['Professional Summary', 'Career Objective', 'Objective', 'Executive Summary', 'summary', 'professionalSummary']);
  
  const profileImage = options?.galleryPreview
    ? resolveGalleryProfileImage(data, getString, options.galleryTemplateId)
    : resolveProfileImageForRender(data, getString);

  // Check if template needs progress bars (detected by CSS class names)
  const isPremiumSideProfile = htmlTemplate.includes('psp-skills-progress') || htmlTemplate.includes('psp-languages-progress');

  // Render all sections first
  const experienceData = filterMeaningfulExperiences(
    getArray<Record<string, unknown>>(['Work Experience', 'Experience', 'experience'], [])
  );
  const educationData = filterMeaningfulEducation(
    getArray<Record<string, unknown>>(['Education', 'education'], [])
  );
  const skillsData = normalizeSkillsForRender(data);
  const projectsData = filterMeaningfulProjects(
    getArray<Record<string, unknown>>(['Projects', 'Projects(optional)', 'Academic Projects', 'projects'], [])
  ) as Array<Record<string, string>>;
  const certificationsData = filterMeaningfulCertifications(
    getArray<Record<string, unknown>>(['Certifications', 'certifications'], [])
  ) as Array<Record<string, string>>;
  const achievementsData = filterMeaningfulAchievements(
    getArray<unknown>(['Achievements', 'Key Achievements', 'achievements'], [])
  ) as Array<string | Record<string, string>>;
  const languagesDataRaw = getArray<unknown>(['Languages', 'languages'], []);
  const languagesData = languagesDataRaw as Array<string | Record<string, unknown>>;
  const hobbiesDataRaw = getArray<unknown>(['Hobbies', 'Hobbies & Interests', 'hobbies'], []);
  const hobbiesData = hobbiesDataRaw as Array<string | Record<string, unknown>>;

  // Debug logging (always enabled for troubleshooting)
  console.log('[TemplateLoader] FormData Keys:', Object.keys(formData));
  console.log('[TemplateLoader] Hobbies extraction:', {
    'formData.Hobbies': formData['Hobbies'],
    'formData["Hobbies & Interests"]': formData['Hobbies & Interests'],
    'formData.hobbies': formData.hobbies,
    finalHobbiesData: hobbiesData,
  });
  const isFresher = isFresherProfile(data);
  const experienceYears = estimateExperienceYears(experienceData);
  const sparseExperience = experienceData.length === 0;

  console.log('[TemplateLoader] Data check:', {
    skillsCount: skillsData.length,
    skillsPreview: skillsData.slice(0, 12),
    isFresher,
    experienceYears,
    sparseExperience,
    languagesData,
    languagesLength: Array.isArray(languagesData) ? languagesData.length : 'not array',
    languagesType: typeof languagesData,
    projectsData,
    projectsLength: Array.isArray(projectsData) ? projectsData.length : 'not array',
    certificationsData,
    certificationsLength: Array.isArray(certificationsData) ? certificationsData.length : 'not array',
    achievementsData,
    achievementsLength: Array.isArray(achievementsData) ? achievementsData.length : 'not array',
    hobbiesData,
    hobbiesLength: Array.isArray(hobbiesData) ? hobbiesData.length : 'not array',
  });

  const useCompactSkills = isPremiumSideProfile && skillsData.length > 3;

  const placeholders: Record<string, string> = {
    '{{FULL_NAME}}': fullName || '',
    '{{FIRST_NAME}}': firstName || '',
    '{{LAST_NAME}}': lastName || '',
    '{{EMAIL}}': email || '',
    '{{PHONE}}': phone || '',
    '{{JOB_TITLE}}': jobTitle || '',
    '{{LOCATION}}': location || '',
    '{{LINKEDIN}}': linkedin || '',
    '{{PORTFOLIO}}': portfolio || '',
    '{{SUMMARY}}': summary || '',
    '{{PROFILE_IMAGE}}': profileImage || '',
    '{{CONTACT}}': renderContactListHtml(data, escapeHtml),
    '{{EXPERIENCE}}': renderExperience(experienceData),
    '{{EDUCATION}}': renderEducation(educationData),
    '{{SKILLS}}': renderSkills(skillsData, isPremiumSideProfile, useCompactSkills),
    '{{PROJECTS}}': renderProjects(projectsData),
    '{{CERTIFICATIONS}}': renderCertifications(certificationsData),
    '{{ACHIEVEMENTS}}': renderAchievements(achievementsData),
    '{{LANGUAGES}}': renderLanguages(languagesData, isPremiumSideProfile),
    '{{HOBBIES}}': renderHobbies(hobbiesData as Array<string | Record<string, unknown>>),
  };

  // Debug: Log rendered content lengths (always enabled for troubleshooting)
  console.log('[TemplateLoader] Rendered content lengths:', {
    EXPERIENCE: placeholders['{{EXPERIENCE}}'].length,
    EDUCATION: placeholders['{{EDUCATION}}'].length,
    PROJECTS: placeholders['{{PROJECTS}}'].length,
    CERTIFICATIONS: placeholders['{{CERTIFICATIONS}}'].length,
    ACHIEVEMENTS: placeholders['{{ACHIEVEMENTS}}'].length,
    LANGUAGES: placeholders['{{LANGUAGES}}'].length,
    HOBBIES: placeholders['{{HOBBIES}}'].length,
    EXPERIENCE_preview: placeholders['{{EXPERIENCE}}'].substring(0, 150),
    EDUCATION_preview: placeholders['{{EDUCATION}}'].substring(0, 150),
    PROJECTS_preview: placeholders['{{PROJECTS}}'].substring(0, 150),
    CERTIFICATIONS_preview: placeholders['{{CERTIFICATIONS}}'].substring(0, 150),
    ACHIEVEMENTS_preview: placeholders['{{ACHIEVEMENTS}}'].substring(0, 150),
    LANGUAGES_preview: placeholders['{{LANGUAGES}}'].substring(0, 150),
    HOBBIES_preview: placeholders['{{HOBBIES}}'].substring(0, 150),
  });

  let result = processHandlebarsConditionals(htmlTemplate, placeholders, data);
  
  // Replace placeholders AFTER conditionals are processed
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    const beforeReplace = result;
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value || '');
    
    // Debug: Log placeholder replacements for key sections
    if (['{{LANGUAGES}}', '{{PROJECTS}}', '{{CERTIFICATIONS}}', '{{ACHIEVEMENTS}}', '{{HOBBIES}}'].includes(placeholder)) {
      const replaced = beforeReplace !== result;
      console.log(`[TemplateLoader] Placeholder ${placeholder}:`, {
        valueLength: value ? value.length : 0,
        valuePreview: value ? value.substring(0, 100) : 'empty',
        wasReplaced: replaced,
        occurrencesBefore: (beforeReplace.match(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length,
        occurrencesAfter: (result.match(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length,
      });
    }
  });
  
  // Clean up any remaining placeholder-like syntax (only simple placeholders, not conditional syntax)
  // Only remove placeholders that look like {{PLACEHOLDER_NAME}} (single word, uppercase)
  // This prevents removing conditional syntax like {{#if}} or {{/if}} if they somehow remain
  const beforeCleanup = result;
  result = result.replace(/\{\{([A-Z_][A-Z0-9_]*)\}\}/g, '');
  
  // Debug: Log remaining placeholders
  const remainingPlaceholders = beforeCleanup.match(/\{\{[A-Z_][A-Z0-9_]*\}\}/g);
  if (remainingPlaceholders && remainingPlaceholders.length > 0) {
    console.log('[TemplateLoader] Remaining placeholders after cleanup:', remainingPlaceholders);
  }

  // ────────────────────────────────────────────────────────────────────
  // AUTO-DENSITY LAYER
  // ────────────────────────────────────────────────────────────────────
  // Inject a small density classifier and accompanying CSS so the resume
  // visually FILLS the page even when the parsed content is thin. We never
  // shrink rich content — only stretch typography/spacing when there are
  // few sections / few entries / short summary. This keeps every existing
  // template's design intact (it's purely additive CSS at the end of the
  // document) and never modifies the parsed data.
  const contentDensity = (() => {
    const expCount = experienceData.length;
    const eduCount = educationData.length;
    const projCount = projectsData.length;
    const certCount = certificationsData.length;
    const skillCount = skillsData.length;
    const langCount = languagesData.length;
    const summaryLen = (summary || '').length;

    let score = 0;
    score += expCount * 12;
    score += eduCount * 8;
    score += projCount * (sparseExperience ? 14 : 8);
    score += certCount * (sparseExperience ? 10 : 4);
    score += Math.min(skillCount, 24) * (sparseExperience ? 2.2 : 1.5);
    score += langCount * 2;
    score += Math.min(summaryLen, 600) / 30;

    if (isFresher && skillCount >= 4) score += 12;
    if (sparseExperience && (projCount > 0 || certCount > 0 || skillCount >= 6)) score += 15;

    if (score < 30) return 'sparse';
    if (score < 60) return 'light';
    if (score < 110) return 'balanced';
    return 'dense';
  })();

  const layoutProfileCSS = `
<style data-injected="layout-profile">
html, body {
  --content-density: ${contentDensity};
}
body[data-profile="${isFresher ? 'fresher' : 'experienced'}"] {
  --content-density: ${contentDensity};
}
body[data-compact-skills="true"] .psp-skills-progress .skills-list,
body[data-compact-skills="true"] .skills-list {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 8px 10px !important;
}
body[data-compact-skills="true"] .psp-skill-item::before,
body[data-compact-skills="true"] .psp-skill-item::after {
  display: none !important;
}
body[data-compact-skills="true"] .psp-skill-item {
  padding-left: 0 !important;
  min-height: 0 !important;
  width: auto !important;
}
body[data-compact-skills="true"] .psp-skill-name,
body[data-compact-skills="true"] .skill-tag {
  display: inline-block !important;
  font-size: 11px !important;
  line-height: 1.35 !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
}
body[data-sparse-experience="true"] .content-section,
body[data-sparse-experience="true"] .flow-section,
body[data-sparse-experience="true"] section.content-section {
  margin-bottom: clamp(18px, 2.5vh, 28px) !important;
}
body[data-profile="fresher"][data-sparse-experience="true"] .sidebar-section,
body[data-profile="fresher"][data-sparse-experience="true"] .psp-skills-progress {
  margin-bottom: 18px !important;
}
body[data-profile="fresher"] .summary-text,
body[data-profile="fresher"] .summary-content,
body[data-profile="fresher"] .professional-summary {
  line-height: 1.65 !important;
}
</style>
<script data-injected="layout-profile">
(function(){
  try {
    function apply(){
      if (!document.body) return;
      document.body.setAttribute('data-profile', '${isFresher ? 'fresher' : 'experienced'}');
      document.body.setAttribute('data-sparse-experience', '${sparseExperience ? 'true' : 'false'}');
      document.body.setAttribute('data-compact-skills', '${useCompactSkills ? 'true' : 'false'}');
      document.documentElement.setAttribute('data-density', '${contentDensity}');
      document.body.setAttribute('data-density', '${contentDensity}');
    }
    if (document.body) apply();
    else document.addEventListener('DOMContentLoaded', apply);
  } catch (e) { /* no-op */ }
})();
</script>
`;

  const autoDensityCSS = `
<style data-injected="auto-density">
/* Auto-density layer — non-destructive, purely additive.
   Applies a CSS data attribute to the document root so any template that
   wants to opt-out can do so by overriding [data-density="..."] selectors. */
html, body { --content-density: ${contentDensity}; }
[data-density="sparse"] body,
body[data-density="sparse"] {
  font-size: clamp(15px, 1.05rem, 17px);
  line-height: 1.65;
}
[data-density="sparse"] .resume-container,
body[data-density="sparse"] .resume-container {
  padding-top: clamp(48px, 6vh, 80px);
  padding-bottom: clamp(48px, 6vh, 80px);
}
body[data-sparse-experience="true"][data-density="sparse"] .resume-container,
body[data-sparse-experience="true"][data-density="sparse"] .page,
body[data-sparse-experience="true"][data-density="sparse"] main {
  padding-top: clamp(24px, 3vh, 40px) !important;
  padding-bottom: clamp(24px, 3vh, 40px) !important;
}
body[data-sparse-experience="true"][data-density="sparse"] .section,
body[data-sparse-experience="true"][data-density="sparse"] .flow-section,
body[data-sparse-experience="true"][data-density="sparse"] section {
  margin-bottom: clamp(16px, 2.2vh, 26px) !important;
}
body[data-profile="fresher"] .projects-section,
body[data-profile="fresher"] .project-item,
body[data-profile="fresher"] .certification-item,
body[data-profile="fresher"] .psp-projects,
body[data-profile="fresher"] .psp-certifications {
  margin-bottom: 14px !important;
}
body[data-profile="fresher"] .skills-list,
body[data-profile="fresher"] .psp-skills-progress {
  margin-bottom: 12px !important;
}
[data-density="sparse"] h1, body[data-density="sparse"] h1 { font-size: clamp(2.4rem, 5vw, 3rem) !important; }
[data-density="sparse"] h2, body[data-density="sparse"] h2 { font-size: clamp(1.4rem, 3vw, 1.7rem) !important; letter-spacing: 0.02em; }
[data-density="sparse"] h3, body[data-density="sparse"] h3 { font-size: clamp(1.15rem, 2.2vw, 1.3rem) !important; }
[data-density="sparse"] .section, body[data-density="sparse"] .section,
[data-density="sparse"] .flow-section, body[data-density="sparse"] .flow-section,
[data-density="sparse"] section, body[data-density="sparse"] section {
  margin-bottom: clamp(28px, 4vh, 44px);
}
[data-density="sparse"] li, body[data-density="sparse"] li { margin-bottom: 0.45em; line-height: 1.7; }
[data-density="sparse"] p, body[data-density="sparse"] p { line-height: 1.7; }
[data-density="sparse"] .summary, body[data-density="sparse"] .summary,
[data-density="sparse"] .professional-summary, body[data-density="sparse"] .professional-summary {
  font-size: 1.05em;
  line-height: 1.75;
}

[data-density="light"] body,
body[data-density="light"] {
  font-size: clamp(14.5px, 1rem, 16px);
  line-height: 1.6;
}
[data-density="light"] .section, body[data-density="light"] .section,
[data-density="light"] .flow-section, body[data-density="light"] .flow-section,
[data-density="light"] section, body[data-density="light"] section {
  margin-bottom: clamp(22px, 3vh, 32px);
}
[data-density="light"] li, body[data-density="light"] li { margin-bottom: 0.35em; line-height: 1.65; }

/* Dense / balanced resumes use the template's own defaults — no overrides. */
</style>
<script data-injected="auto-density">
(function(){
  try {
    var d = '${contentDensity}';
    if (document && document.body) {
      document.body.setAttribute('data-density', d);
      document.documentElement.setAttribute('data-density', d);
    } else if (document) {
      document.addEventListener('DOMContentLoaded', function(){
        document.body.setAttribute('data-density', d);
        document.documentElement.setAttribute('data-density', d);
      });
    }
  } catch (e) { /* no-op */ }
})();
</script>
`;

  // Inject before </body> (or </html> as a fallback) so it overrides any
  // earlier <style> from the template itself.
  const injectedLayout = layoutProfileCSS + autoDensityCSS;
  if (/<\/body>/i.test(result)) {
    result = result.replace(/<\/body>/i, injectedLayout + '</body>');
  } else if (/<\/html>/i.test(result)) {
    result = result.replace(/<\/html>/i, injectedLayout + '</html>');
  } else {
    result = result + injectedLayout;
  }
  console.log('[TemplateLoader] Auto-density:', contentDensity);

  return result;
}

/**
 * Render experience section
 */
function renderExperience(experiences: Array<Record<string, unknown>>): string {
  if (!Array.isArray(experiences) || experiences.length === 0) {
    return '';
  }

  const meaningful = experiences.filter((exp) => {
    const textFields = [
      'Company', 'company', 'Position', 'position', 'title', 'Title',
      'Description', 'description', 'Duration', 'duration',
      'startDate', 'StartDate', 'Start Date', 'endDate', 'EndDate', 'End Date',
      'location', 'Location',
    ];
    if (textFields.some((key) => typeof exp[key] === 'string' && exp[key].trim())) return true;
    return exp.current === true || exp.Current === true;
  });

  if (meaningful.length === 0) {
    return '';
  }

  return meaningful
    .map((exp) => {
      // Helper to safely get string values
      const getExpString = (keys: string[]): string => {
        for (const key of keys) {
          const value = exp[key];
          if (typeof value === 'string' && value) return value;
        }
        return '';
      };

      // Support multiple field name formats
      const company = getExpString(['Company', 'company']);
      const position = getExpString(['Position', 'position', 'title', 'Title']);
      const duration = getExpString(['Duration', 'duration']);
      const description = getExpString(['Description', 'description']);
      
      // Build duration from start/end dates if not provided directly
      let finalDuration = duration;
      if (!finalDuration) {
        const startDate = getExpString(['startDate', 'StartDate', 'Start Date']);
        // Check current flag first, then endDate
        const isCurrent = exp.current === true || exp.Current === true;
        const endDateValue = getExpString(['endDate', 'EndDate', 'End Date']);
        const endDate = isCurrent ? 'Present' : (endDateValue || '');
        if (startDate && endDate) {
          finalDuration = `${startDate} - ${endDate}`;
        } else if (startDate) {
          finalDuration = isCurrent ? `${startDate} - Present` : startDate;
        } else if (endDate) {
          finalDuration = endDate;
        }
      }
      
      // Include location if available
      const location = exp.location || exp.Location || '';
      const companyWithLocation = location ? `${company}${company ? ' / ' : ''}${location}` : company;

      // Render bullets when achievements/bullets array is present. Falls back to
      // splitting the description on \n / bullet chars if no array was provided.
      // Existing template CSS (.experience-item .description ul / li) styles this
      // natively — no template change required.
      const bulletsRaw = Array.isArray(exp.achievements)
        ? (exp.achievements as unknown[])
        : Array.isArray((exp as Record<string, unknown>).bullets)
        ? ((exp as Record<string, unknown>).bullets as unknown[])
        : [];
      const bullets: string[] = bulletsRaw
        .map((b) => {
          if (typeof b === 'string') return b;
          const rec = b as Record<string, unknown>;
          return String(rec?.title ?? rec?.description ?? rec?.text ?? '');
        })
        .map((s) => s.replace(/^[\s\-–—*•·]+/, '').trim())
        .filter((s) => s.length > 0);

      // If no explicit bullets, split the description on newlines / bullet chars
      const fallbackBullets: string[] = bullets.length
        ? []
        : String(description)
            .split(/\n|•|·|▪|‣|\u2023|\u25aa/)
            .map((s) => s.replace(/^[\s\-–—*•·]+/, '').trim())
            // Keep short but meaningful bullets ("Led team", "ATS scoring").
            .filter((s) => s.length >= 3);

      const allBullets = bullets.length ? bullets : fallbackBullets;
      const renderedBullets = allBullets.length > 1
        ? `<ul>${allBullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
        : '';

      // Description paragraph: only the single-line / lead text. If we DID emit
      // bullets, suppress the paragraph to avoid rendering the same content
      // twice (once flat, once as a list).
      const leadDescription = allBullets.length > 1
        ? ''
        : String(description).replace(/\s+/g, ' ').trim();

      return `
        <div class="experience-item">
          <div class="experience-header">
            <h3>${escapeHtml(String(position))}</h3>
            <span class="company">${escapeHtml(String(companyWithLocation))}</span>
            ${finalDuration ? `<span class="duration">${escapeHtml(String(finalDuration))}</span>` : ''}
          </div>
          ${leadDescription || renderedBullets
            ? `<div class="description">${leadDescription ? escapeHtml(leadDescription) : ''}${renderedBullets}</div>`
            : ''}
        </div>
      `;
    })
    .join('');
}

/**
 * Render education section
 */
function renderEducation(education: Array<Record<string, unknown>>): string {
  if (!Array.isArray(education) || education.length === 0) {
    return '';
  }

  const meaningful = education.filter((edu) => {
    const textFields = [
      'Institution', 'institution', 'school', 'School',
      'Degree', 'degree', 'Year', 'year', 'graduationDate', 'GraduationDate',
      'Field', 'field', 'CGPA', 'cgpa',
    ];
    return textFields.some((key) => typeof edu[key] === 'string' && edu[key].trim());
  });

  if (meaningful.length === 0) {
    return '';
  }

  return meaningful
    .map((edu) => {
      // Helper to safely get string values
      const getEduString = (keys: string[]): string => {
        for (const key of keys) {
          const value = edu[key];
          if (typeof value === 'string' && value) return value;
        }
        return '';
      };

      // Support multiple field name formats
      const institution = getEduString(['Institution', 'institution', 'school', 'School']);
      const degree = getEduString(['Degree', 'degree']);
      const year = getEduString(['Year', 'year', 'graduationDate', 'GraduationDate']);
      const field = getEduString(['Field', 'field']);
      const cgpa = getEduString(['CGPA', 'cgpa']);

      // Build degree with field if available
      const degreeWithField = field ? `${degree}${degree ? ' - ' : ''}${field}` : degree;

      return `
        <div class="education-item">
        <h3>${escapeHtml(String(degreeWithField))}</h3>
        <span class="institution">${escapeHtml(String(institution))}</span>
        ${year ? `<span class="year">${escapeHtml(String(year))}</span>` : ''}
        ${cgpa ? `<span class="cgpa">CGPA: ${escapeHtml(String(cgpa))}</span>` : ''}
        </div>
      `;
    })
    .join('');
}

/**
 * Render skills section
 * Supports both simple tags and progress bars (for templates that use progress bar classes)
 */
function renderSkills(
  skills: string[],
  useProgressBars: boolean = false,
  useCompactList: boolean = false
): string {
  if (!Array.isArray(skills) || skills.length === 0) {
    return '';
  }

  const validSkills = filterMeaningfulSkills(
    skills.map((skill) => {
      if (typeof skill === 'string') return skill;
      if (skill && typeof skill === 'object') {
        const record = skill as Record<string, unknown>;
        return String(record.name ?? record.Name ?? record.skill ?? record.Skill ?? '');
      }
      return '';
    })
  ) as string[];

  if (validSkills.length === 0) {
    return '';
  }

  // Compact list shows every skill (sidebar progress circles hide overflow on long lists)
  if (!useProgressBars || useCompactList) {
    return validSkills
      .map((skill) => `<span class="skill-tag">${escapeHtml(skill)}</span>`)
      .join('');
  }

  // Progress-bar templates: show skill names only (no fake parser/confidence percentages)
  return validSkills
    .map((skill) => {
      const raw =
        typeof skill === 'string'
          ? skill
          : String(
              (skill as Record<string, unknown>).name ||
                (skill as Record<string, unknown>).Name ||
                skill
            );
      const skillName = raw.replace(/\s+\d{1,3}%?\s*$/i, '').trim();
      if (!skillName) return '';

      return `
        <div class="psp-skill-item">
          <div class="psp-skill-name">${escapeHtml(skillName)}</div>
        </div>
      `;
    })
    .filter(Boolean)
    .join('');
}

/**
 * Render projects section
 */
function renderProjects(projects: Array<Record<string, string>>): string {
  if (!Array.isArray(projects) || projects.length === 0) {
    return '';
  }

  // Filter out empty entries (entries with no Name)
  const validProjects = projects.filter(project => {
    const name = project.Name || project.name || '';
    return name.trim().length > 0;
  });

  if (validProjects.length === 0) {
    return '';
  }

  return validProjects
    .map((project) => {
      const name = project.Name || project.name || '';
      const description = project.Description || project.description || '';
      const technologies = project.Technologies || project.technologies || '';
      const link = project.Link || project.link || '';

      return `
        <div class="project-item">
          <h3>${escapeHtml(name)}</h3>
          ${description ? `<p class="description">${escapeHtml(description)}</p>` : ''}
          ${technologies ? `<p class="technologies">${escapeHtml(technologies)}</p>` : ''}
          ${link ? `<a href="${escapeHtml(link)}" target="_blank">View Project</a>` : ''}
        </div>
      `;
    })
    .join('');
}

/**
 * Render certifications section
 */
function renderCertifications(certifications: Array<Record<string, string>>): string {
  if (!Array.isArray(certifications) || certifications.length === 0) {
    return '';
  }

  // Filter out empty entries (entries with no Name)
  const validCerts = certifications.filter(cert => {
    const name = cert.Name || cert.name || '';
    return name.trim().length > 0;
  });

  if (validCerts.length === 0) {
    return '';
  }

  return validCerts
    .map((cert) => {
      const name = cert.Name || cert.name || '';
      const issuer = cert.Issuer || cert.issuer || '';
      const date = cert.Date || cert.date || '';
      const link = cert.Link || cert.link || '';

      return `
        <div class="certification-item">
          <h3>${escapeHtml(name)}</h3>
          ${issuer ? `<span class="issuer">${escapeHtml(issuer)}</span>` : ''}
          ${date ? `<span class="date">${escapeHtml(date)}</span>` : ''}
          ${link ? `<a href="${escapeHtml(link)}" target="_blank">View Certificate</a>` : ''}
        </div>
      `;
    })
    .join('');
}

/**
 * Render achievements section
 * Supports both string arrays and object arrays
 */
function renderAchievements(achievements: Array<string | Record<string, string>>): string {
  if (!Array.isArray(achievements) || achievements.length === 0) {
    return '';
  }

  // Handle string array format (from AchievementsStep)
  if (typeof achievements[0] === 'string') {
    const validAchievements = (achievements as string[]).filter(achievement => 
      achievement && achievement.trim().length > 0
    );
    
    if (validAchievements.length === 0) {
      return '';
    }

    return validAchievements
      .map((achievement) => `
        <div class="achievement-item">
          <h3>${escapeHtml(achievement)}</h3>
        </div>
      `)
      .join('');
  }

  // Handle object array format (legacy format)
  const validAchievements = (achievements as Array<Record<string, string>>).filter(achievement => {
    const title = achievement.Title || achievement.title || '';
    return title.trim().length > 0;
  });

  if (validAchievements.length === 0) {
    return '';
  }

  return validAchievements
    .map((achievement) => {
      const title = achievement.Title || achievement.title || '';
      const description = achievement.Description || achievement.description || '';
      const date = achievement.Date || achievement.date || '';

      return `
        <div class="achievement-item">
          <h3>${escapeHtml(title)}</h3>
          ${description ? `<p class="description">${escapeHtml(description)}</p>` : ''}
          ${date ? `<span class="date">${escapeHtml(date)}</span>` : ''}
        </div>
      `;
    })
    .join('');
}

/**
 * Render languages section
 * Supports both simple items and progress bars (for templates that use progress bar classes)
 */
function renderLanguages(languages: Array<string | Record<string, unknown>>, useProgressBars: boolean = false): string {
  console.log('[renderLanguages] Input:', { languages, type: typeof languages, isArray: Array.isArray(languages), length: Array.isArray(languages) ? languages.length : 0, useProgressBars });
  
  if (!Array.isArray(languages) || languages.length === 0) {
    console.log('[renderLanguages] Empty or not array, returning empty string');
    return '';
  }

  // Map proficiency levels to percentages for progress bars
  const proficiencyToPercentage = (proficiency: string): number => {
    const prof = proficiency.toLowerCase();
    if (prof.includes('native')) return 100;
    if (prof.includes('fluent')) return 95;
    if (prof.includes('advanced')) return 85;
    if (prof.includes('intermediate')) return 75;
    if (prof.includes('basic') || prof.includes('beginner')) return 60;
    // Default for unknown proficiency
    return 80;
  };

  // Handle string array format (if languages are stored as simple strings)
  if (typeof languages[0] === 'string') {
    console.log('[renderLanguages] Processing as string array');
    const validLanguages = (languages as string[]).filter(lang => lang && typeof lang === 'string' && lang.trim().length > 0);
    console.log('[renderLanguages] Valid languages (string):', validLanguages);
    if (validLanguages.length === 0) {
      console.log('[renderLanguages] No valid string languages, returning empty');
      return '';
    }
    
    if (useProgressBars) {
      // For string array with progress bars, render with default 80% proficiency
      const result = validLanguages
        .map((lang) => `
          <div class="psp-language-item">
            <div class="psp-language-name">${escapeHtml(lang)}</div>
            <div class="psp-language-bar-container">
              <div class="psp-language-bar-fill" style="width: 80%"></div>
            </div>
            <div class="psp-language-percentage">80%</div>
          </div>
        `)
        .join('');
      console.log('[renderLanguages] String array result length (progress bars):', result.length);
      return result;
    } else {
      // Simple format for other templates
      const result = validLanguages
        .map((lang) => `
          <div class="language-item">
            <span class="language">${escapeHtml(lang)}</span>
          </div>
        `)
        .join('');
      console.log('[renderLanguages] String array result length (simple):', result.length);
      return result;
    }
  }

  // Handle object array format
  console.log('[renderLanguages] Processing as object array');
  const validLanguages = (languages as Array<Record<string, unknown>>).filter(lang => {
    // Support multiple field name variations
    const language = lang.Language || lang.language || lang.name || '';
    const isValid = language && typeof language === 'string' && language.trim().length > 0;
    if (!isValid) {
      console.log('[renderLanguages] Filtered out invalid language:', lang);
    }
    return isValid;
  });

  console.log('[renderLanguages] Valid languages (object):', validLanguages.length, validLanguages);

  if (validLanguages.length === 0) {
    console.log('[renderLanguages] No valid object languages, returning empty');
    return '';
  }

  if (useProgressBars) {
    const result = validLanguages
      .map((lang) => {
        // Support multiple field name variations
        const language = lang.Language || lang.language || lang.name || '';
        const proficiency = lang.Proficiency || lang.proficiency || lang.level || '';
        
        // For templates with progress bars, render with progress bars
        const percentage = proficiency ? proficiencyToPercentage(String(proficiency)) : 80;

        return `
          <div class="psp-language-item">
            <div class="psp-language-name">${escapeHtml(String(language))}</div>
            <div class="psp-language-bar-container">
              <div class="psp-language-bar-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="psp-language-percentage">${percentage}%</div>
          </div>
        `;
      })
      .join('');
    
    console.log('[renderLanguages] Final result length (progress bars):', result.length, 'Preview:', result.substring(0, 200));
    return result;
  } else {
    // Simple format for other templates
    const result = validLanguages
      .map((lang) => {
        // Support multiple field name variations
        const language = lang.Language || lang.language || lang.name || '';
        const proficiency = lang.Proficiency || lang.proficiency || lang.level || '';

        return `
          <div class="language-item">
            <span class="language">${escapeHtml(String(language))}</span>
            ${proficiency ? `<span class="proficiency">${escapeHtml(String(proficiency))}</span>` : ''}
          </div>
        `;
      })
      .join('');
    
    console.log('[renderLanguages] Final result length (simple):', result.length, 'Preview:', result.substring(0, 200));
    return result;
  }
}

/**
 * Render hobbies section
 * Supports string array format (from HobbiesStep)
 */
function renderHobbies(hobbies: Array<string | Record<string, unknown>>): string {
  console.log('[renderHobbies] ===== START =====');
  console.log('[renderHobbies] Input:', { hobbies, type: typeof hobbies, isArray: Array.isArray(hobbies), length: Array.isArray(hobbies) ? hobbies.length : 0 });
  console.log('[renderHobbies] Full hobbies value:', JSON.stringify(hobbies, null, 2));
  
  if (!Array.isArray(hobbies) || hobbies.length === 0) {
    console.log('[renderHobbies] Empty or not array, returning empty string');
    console.log('[renderHobbies] ===== END (EMPTY) =====');
    return '';
  }

  // Handle string array format (primary format from HobbiesStep)
  if (typeof hobbies[0] === 'string') {
    console.log('[renderHobbies] Processing as string array');
    const validHobbies = (hobbies as string[]).filter(hobby => hobby && typeof hobby === 'string' && hobby.trim().length > 0);
    console.log('[renderHobbies] Valid hobbies (string):', validHobbies);
    if (validHobbies.length === 0) {
      console.log('[renderHobbies] No valid string hobbies, returning empty');
      return '';
    }
    
    const result = validHobbies
      .map((hobby) => `
        <div class="hobby-item">
          <span class="hobby">${escapeHtml(hobby)}</span>
        </div>
      `)
      .join('');
    console.log('[renderHobbies] String array result length:', result.length);
    return result;
  }

  // Handle object array format (legacy format, if any)
  console.log('[renderHobbies] Processing as object array');
  const validHobbies = (hobbies as Array<Record<string, unknown>>).filter(hobby => {
    const hobbyName = hobby.Hobby || hobby.hobby || hobby.name || '';
    const isValid = hobbyName && typeof hobbyName === 'string' && hobbyName.trim().length > 0;
    if (!isValid) {
      console.log('[renderHobbies] Filtered out invalid hobby:', hobby);
    }
    return isValid;
  });

  console.log('[renderHobbies] Valid hobbies (object):', validHobbies.length, validHobbies);

  if (validHobbies.length === 0) {
    console.log('[renderHobbies] No valid object hobbies, returning empty');
    return '';
  }

  const result = validHobbies
    .map((hobby) => {
      const hobbyName = hobby.Hobby || hobby.hobby || hobby.name || '';

      return `
        <div class="hobby-item">
          <span class="hobby">${escapeHtml(String(hobbyName))}</span>
        </div>
      `;
    })
    .join('');
  
  console.log('[renderHobbies] Final result length:', result.length, 'Preview:', result.substring(0, 200));
  return result;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

