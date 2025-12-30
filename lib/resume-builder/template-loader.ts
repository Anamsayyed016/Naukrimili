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
export function applyColorVariant(css: string, colorVariant: ColorVariant): string {
  return css
    .replace(/--primary-color:\s*[^;]+;/g, `--primary-color: ${colorVariant.primary};`)
    .replace(/--accent-color:\s*[^;]+;/g, `--accent-color: ${colorVariant.accent};`)
    .replace(/--text-color:\s*[^;]+;/g, `--text-color: ${colorVariant.text};`);
}

/**
 * Inject resume data into HTML template
 */
export function injectResumeData(
  htmlTemplate: string,
  formData: Record<string, unknown>
): string {
  // Helper function to safely extract string values
  const getString = (key: string | string[]): string => {
    if (Array.isArray(key)) {
      for (const k of key) {
        const value = formData[k];
        if (typeof value === 'string' && value) return value;
      }
      return '';
    }
    const value = formData[key];
    return typeof value === 'string' ? value : '';
  };

  // Helper function to safely extract array values
  const getArray = <T>(key: string | string[], defaultValue: T[] = []): T[] => {
    if (Array.isArray(key)) {
      for (const k of key) {
        const value = formData[k];
        if (Array.isArray(value)) return value as T[];
      }
      return defaultValue;
    }
    const value = formData[key];
    return Array.isArray(value) ? (value as T[]) : defaultValue;
  };

  // Support both old field names (Full Name) and new field names (firstName, lastName)
  const fullNameValue = getString(['Full Name', 'name']);
  const firstNameValue = getString(['firstName', 'First Name']);
  const lastNameValue = getString(['lastName', 'Last Name']);
  let fullName = fullNameValue || 
                 (firstNameValue && lastNameValue ? `${firstNameValue} ${lastNameValue}`.trim() : '') || 
                 firstNameValue || 
                 lastNameValue;
  
  const email = getString(['Email', 'email']);
  const phone = getString(['Phone', 'phone']);
  const jobTitle = getString(['Job Title', 'jobTitle', 'desiredJobTitle']);
  const location = getString(['Location', 'location']);
  const linkedin = getString(['LinkedIn', 'linkedin']);
  const portfolio = getString(['Portfolio', 'website', 'portfolio']);
  
  const summary = getString(['Professional Summary', 'Career Objective', 'Objective', 'Executive Summary', 'summary', 'professionalSummary']);
  
  // Support additional field name variations
  const firstName = firstNameValue;
  const lastName = lastNameValue;
  
  // Build full name from parts if not provided directly
  if (!fullName && (firstName || lastName)) {
    fullName = `${firstName} ${lastName}`.trim();
  }
  
  // Handle profile image
  const profileImage = getString(['Profile Image', 'Photo', 'profileImage', 'photo', 'profilePhoto']);

  // Check if template needs progress bars (detected by CSS class names)
  const isPremiumSideProfile = htmlTemplate.includes('psp-skills-progress') || htmlTemplate.includes('psp-languages-progress');

  // Render all sections first
  const experienceData = getArray<Record<string, unknown>>(['Work Experience', 'Experience', 'experience'], []);
  const educationData = getArray<Record<string, unknown>>(['Education', 'education'], []);
  const skillsData = getArray<string>(['Skills', 'skills'], []);
  const projectsData = getArray<Record<string, string>>(['Projects', 'Projects(optional)', 'Academic Projects', 'projects'], []);
  const certificationsData = getArray<Record<string, string>>(['Certifications', 'certifications'], []);
  const achievementsDataRaw = getArray<unknown>(['Achievements', 'Key Achievements', 'achievements'], []);
  const achievementsData = achievementsDataRaw as Array<string | Record<string, string>>;
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
  console.log('[TemplateLoader] Data check:', {
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
    '{{EXPERIENCE}}': renderExperience(experienceData),
    '{{EDUCATION}}': renderEducation(educationData),
    '{{SKILLS}}': renderSkills(skillsData, isPremiumSideProfile),
    '{{PROJECTS}}': renderProjects(projectsData),
    '{{CERTIFICATIONS}}': renderCertifications(certificationsData),
    '{{ACHIEVEMENTS}}': renderAchievements(achievementsData),
    '{{LANGUAGES}}': renderLanguages(languagesData, isPremiumSideProfile),
    '{{HOBBIES}}': renderHobbies(hobbiesData as Array<string | Record<string, unknown>>),
  };

  // Debug: Log rendered content lengths (always enabled for troubleshooting)
  console.log('[TemplateLoader] Rendered content lengths:', {
    LANGUAGES: placeholders['{{LANGUAGES}}'].length,
    PROJECTS: placeholders['{{PROJECTS}}'].length,
    CERTIFICATIONS: placeholders['{{CERTIFICATIONS}}'].length,
    ACHIEVEMENTS: placeholders['{{ACHIEVEMENTS}}'].length,
    HOBBIES: placeholders['{{HOBBIES}}'].length,
    LANGUAGES_preview: placeholders['{{LANGUAGES}}'].substring(0, 100),
    PROJECTS_preview: placeholders['{{PROJECTS}}'].substring(0, 100),
    CERTIFICATIONS_preview: placeholders['{{CERTIFICATIONS}}'].substring(0, 100),
    HOBBIES_preview: placeholders['{{HOBBIES}}'].substring(0, 100),
  });

  let result = htmlTemplate;
  
  // Handle Handlebars-style conditionals FIRST (before placeholder replacement)
  // Process {{#if SECTION}}...{{/if}} blocks
  result = result.replace(/\{\{#if\s+(\w+)\}\}[\s\S]*?\{\{\/if\}\}/gi, (match, sectionName) => {
    // Check if the section has content BEFORE replacement
    const sectionPlaceholder = `{{${sectionName.toUpperCase()}}}`;
    const renderedContent = placeholders[sectionPlaceholder];
    const hasContent = renderedContent && 
                       typeof renderedContent === 'string' &&
                       renderedContent.trim().length > 0;
    
    // Debug logging for sections after Skills (always enabled for troubleshooting)
    if (['LANGUAGES', 'PROJECTS', 'CERTIFICATIONS', 'ACHIEVEMENTS', 'HOBBIES'].includes(sectionName.toUpperCase())) {
      console.log(`[TemplateLoader] Conditional check for ${sectionName.toUpperCase()}:`, {
        hasPlaceholder: !!placeholders[sectionPlaceholder],
        renderedLength: renderedContent ? renderedContent.length : 0,
        hasContent,
        rawContent: renderedContent ? renderedContent.substring(0, 150) : 'empty',
        placeholderValue: placeholders[sectionPlaceholder] ? placeholders[sectionPlaceholder].substring(0, 150) : 'undefined',
        sectionPlaceholder
      });
    }
    
    if (hasContent) {
      // Remove the conditional tags but keep the content
      return match.replace(/\{\{#if\s+\w+\}\}/gi, '').replace(/\{\{\/if\}\}/gi, '');
    } else {
      // Remove the entire block
      return '';
    }
  });
  
  // Process {{#unless SECTION}}...{{/unless}} blocks (opposite of {{#if}})
  result = result.replace(/\{\{#unless\s+(\w+)\}\}[\s\S]*?\{\{\/unless\}\}/gi, (match, sectionName) => {
    // Check if the section has content BEFORE replacement
    const sectionPlaceholder = `{{${sectionName.toUpperCase()}}}`;
    const renderedContent = placeholders[sectionPlaceholder];
    const hasContent = renderedContent && 
                       typeof renderedContent === 'string' &&
                       renderedContent.trim().length > 0;
    
    // Debug logging for PROFILE_IMAGE (critical for image display)
    if (sectionName.toUpperCase() === 'PROFILE_IMAGE') {
      console.log(`[TemplateLoader] {{#unless}} check for ${sectionName.toUpperCase()}:`, {
        hasPlaceholder: !!placeholders[sectionPlaceholder],
        renderedLength: renderedContent ? renderedContent.length : 0,
        hasContent,
        rawContent: renderedContent ? renderedContent.substring(0, 150) : 'empty',
        placeholderValue: placeholders[sectionPlaceholder] ? placeholders[sectionPlaceholder].substring(0, 150) : 'undefined',
        sectionPlaceholder,
        willShow: !hasContent // {{#unless}} shows content when section is EMPTY
      });
    }
    
    // {{#unless}} shows content when the section is EMPTY (opposite of {{#if}})
    if (!hasContent) {
      // Remove the conditional tags but keep the content (section is empty, so show unless block)
      return match.replace(/\{\{#unless\s+\w+\}\}/gi, '').replace(/\{\{\/unless\}\}/gi, '');
    } else {
      // Remove the entire block (section has content, so don't show unless block)
      return '';
    }
  });
  
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
  
  // Clean up any remaining placeholder-like syntax
  const beforeCleanup = result;
  result = result.replace(/\{\{[^}]+\}\}/g, '');
  
  // Debug: Log remaining placeholders
  const remainingPlaceholders = beforeCleanup.match(/\{\{[^}]+\}\}/g);
  if (remainingPlaceholders && remainingPlaceholders.length > 0) {
    console.log('[TemplateLoader] Remaining placeholders after cleanup:', remainingPlaceholders);
  }

  return result;
}

/**
 * Render experience section
 */
function renderExperience(experiences: Array<Record<string, unknown>>): string {
  if (!Array.isArray(experiences) || experiences.length === 0) {
    return '';
  }

  return experiences
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

      return `
        <div class="experience-item">
          <div class="experience-header">
            <h3>${escapeHtml(String(position))}</h3>
            <span class="company">${escapeHtml(String(companyWithLocation))}</span>
            ${finalDuration ? `<span class="duration">${escapeHtml(String(finalDuration))}</span>` : ''}
          </div>
          ${description ? `<p class="description">${escapeHtml(String(description))}</p>` : ''}
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

  return education
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
function renderSkills(skills: string[], useProgressBars: boolean = false): string {
  if (!Array.isArray(skills) || skills.length === 0) {
    return '';
  }

  // If not using progress bars, use simple tags
  if (!useProgressBars) {
    return skills
      .map((skill) => `<span class="skill-tag">${escapeHtml(skill)}</span>`)
      .join('');
  }

  // Generate progress bars with auto-calculated percentages
  // Distribute skills across different percentage ranges for visual variety
  const totalSkills = skills.length;
  
  return skills
    .map((skill, index) => {
      // Calculate percentage: distribute between 70-95% for visual appeal
      // First skills get higher percentages, creating a natural distribution
      const basePercentage = 70;
      const range = 25; // 70-95%
      const percentage = Math.min(95, basePercentage + Math.floor((range * (totalSkills - index)) / totalSkills));
      
      const skillName = typeof skill === 'string' ? skill : (skill.name || skill.Name || String(skill));
      
      return `
        <div class="psp-skill-item">
          <div class="psp-skill-name">${escapeHtml(skillName)}</div>
          <div class="psp-skill-bar-container">
            <div class="psp-skill-bar-fill" style="width: ${percentage}%"></div>
          </div>
          <div class="psp-skill-percentage">${percentage}%</div>
        </div>
      `;
    })
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

