/**
 * Template Loader Utility
 * Dynamically loads template HTML and CSS files
 */

// Lazy load templates data to avoid module initialization issues
let templatesDataCache: any = null;
async function getTemplatesData(): Promise<any> {
  if (!templatesDataCache) {
    const module = await import('./templates.json');
    templatesDataCache = module.default;
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
    if (!templatesData || !templatesData.templates) {
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
    // Use absolute URL if available (for production), otherwise relative
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
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
    // Use absolute URL if available (for production), otherwise relative
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
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
  formData: Record<string, any>
): string {
  // Support both old field names (Full Name) and new field names (firstName, lastName)
  let fullName = formData['Full Name'] || 
                 `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || 
                 formData.name || '';
  
  const email = formData['Email'] || formData.email || '';
  const phone = formData['Phone'] || formData.phone || '';
  const jobTitle = formData['Job Title'] || formData.jobTitle || formData.desiredJobTitle || '';
  const location = formData['Location'] || formData.location || '';
  const linkedin = formData['LinkedIn'] || formData.linkedin || '';
  const portfolio = formData['Portfolio'] || formData.website || formData.portfolio || '';
  
  const summary = formData['Professional Summary'] || 
                  formData['Career Objective'] || 
                  formData['Objective'] || 
                  formData['Executive Summary'] ||
                  formData.summary ||
                  formData.professionalSummary || '';
  
  // Support additional field name variations
  const firstName = formData.firstName || formData['First Name'] || '';
  const lastName = formData.lastName || formData['Last Name'] || '';
  
  // Build full name from parts if not provided directly
  if (!fullName && (firstName || lastName)) {
    fullName = `${firstName} ${lastName}`.trim();
  }
  
  // Handle profile image
  const profileImage = formData['Profile Image'] || 
                       formData['Photo'] || 
                       formData.profileImage || 
                       formData.photo || 
                       formData.profilePhoto || 
                       '';

  // Render all sections first
  const experienceData = formData['Work Experience'] || formData['Experience'] || formData.experience || [];
  const educationData = formData['Education'] || formData.education || [];
  const skillsData = formData['Skills'] || formData.skills || [];
  const projectsData = formData['Projects'] || formData['Projects(optional)'] || formData['Academic Projects'] || formData.projects || [];
  const certificationsData = formData['Certifications'] || formData.certifications || [];
  const achievementsData = formData['Achievements'] || formData['Key Achievements'] || formData.achievements || [];
  const languagesData = formData['Languages'] || formData.languages || [];

  // Debug logging (always enabled for troubleshooting)
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
  });

  const placeholders: Record<string, string> = {
    '{{FULL_NAME}}': fullName,
    '{{FIRST_NAME}}': firstName,
    '{{LAST_NAME}}': lastName,
    '{{EMAIL}}': email,
    '{{PHONE}}': phone,
    '{{JOB_TITLE}}': jobTitle,
    '{{LOCATION}}': location,
    '{{LINKEDIN}}': linkedin,
    '{{PORTFOLIO}}': portfolio,
    '{{SUMMARY}}': summary,
    '{{PROFILE_IMAGE}}': profileImage,
    '{{EXPERIENCE}}': renderExperience(experienceData),
    '{{EDUCATION}}': renderEducation(educationData),
    '{{SKILLS}}': renderSkills(skillsData),
    '{{PROJECTS}}': renderProjects(projectsData),
    '{{CERTIFICATIONS}}': renderCertifications(certificationsData),
    '{{ACHIEVEMENTS}}': renderAchievements(achievementsData),
    '{{LANGUAGES}}': renderLanguages(languagesData),
  };

  // Debug: Log rendered content lengths (always enabled for troubleshooting)
  console.log('[TemplateLoader] Rendered content lengths:', {
    LANGUAGES: placeholders['{{LANGUAGES}}'].length,
    PROJECTS: placeholders['{{PROJECTS}}'].length,
    CERTIFICATIONS: placeholders['{{CERTIFICATIONS}}'].length,
    ACHIEVEMENTS: placeholders['{{ACHIEVEMENTS}}'].length,
    LANGUAGES_preview: placeholders['{{LANGUAGES}}'].substring(0, 100),
    PROJECTS_preview: placeholders['{{PROJECTS}}'].substring(0, 100),
    CERTIFICATIONS_preview: placeholders['{{CERTIFICATIONS}}'].substring(0, 100),
  });

  let result = htmlTemplate;
  
  // Handle Handlebars-style conditionals FIRST (before placeholder replacement)
  // Remove {{#if SECTION}}...{{/if}} blocks if the section is empty
  result = result.replace(/\{\{#if\s+(\w+)\}\}[\s\S]*?\{\{\/if\}\}/gi, (match, sectionName) => {
    // Check if the section has content BEFORE replacement
    const sectionPlaceholder = `{{${sectionName.toUpperCase()}}}`;
    const renderedContent = placeholders[sectionPlaceholder];
    const hasContent = renderedContent && 
                       typeof renderedContent === 'string' &&
                       renderedContent.trim().length > 0;
    
    // Debug logging for sections after Skills (always enabled for troubleshooting)
    if (['LANGUAGES', 'PROJECTS', 'CERTIFICATIONS', 'ACHIEVEMENTS'].includes(sectionName.toUpperCase())) {
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
  
  // Replace placeholders AFTER conditionals are processed
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    const beforeReplace = result;
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value || '');
    
    // Debug: Log placeholder replacements for key sections
    if (['{{LANGUAGES}}', '{{PROJECTS}}', '{{CERTIFICATIONS}}', '{{ACHIEVEMENTS}}'].includes(placeholder)) {
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
function renderExperience(experiences: Array<Record<string, any>>): string {
  if (!Array.isArray(experiences) || experiences.length === 0) {
    return '';
  }

  return experiences
    .map((exp) => {
      // Support multiple field name formats
      const company = exp.Company || exp.company || '';
      const position = exp.Position || exp.position || exp.title || exp.Title || '';
      const duration = exp.Duration || exp.duration || '';
      const description = exp.Description || exp.description || '';
      
      // Build duration from start/end dates if not provided directly
      let finalDuration = duration;
      if (!finalDuration) {
        const startDate = exp.startDate || exp.StartDate || exp['Start Date'] || '';
        // Check current flag first, then endDate
        const isCurrent = exp.current === true || exp.Current === true;
        const endDateValue = exp.endDate || exp.EndDate || exp['End Date'] || '';
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
            <h3>${escapeHtml(position)}</h3>
            <span class="company">${escapeHtml(companyWithLocation)}</span>
            ${finalDuration ? `<span class="duration">${escapeHtml(finalDuration)}</span>` : ''}
          </div>
          ${description ? `<p class="description">${escapeHtml(description)}</p>` : ''}
        </div>
      `;
    })
    .join('');
}

/**
 * Render education section
 */
function renderEducation(education: Array<Record<string, any>>): string {
  if (!Array.isArray(education) || education.length === 0) {
    return '';
  }

  return education
    .map((edu) => {
      // Support multiple field name formats
      const institution = edu.Institution || edu.institution || edu.school || edu.School || '';
      const degree = edu.Degree || edu.degree || '';
      const year = edu.Year || edu.year || edu.graduationDate || edu.GraduationDate || '';
      const field = edu.Field || edu.field || '';
      const cgpa = edu.CGPA || edu.cgpa || '';

      // Build degree with field if available
      const degreeWithField = field ? `${degree}${degree ? ' - ' : ''}${field}` : degree;

      return `
        <div class="education-item">
          <h3>${escapeHtml(degreeWithField)}</h3>
          <span class="institution">${escapeHtml(institution)}</span>
          ${year ? `<span class="year">${escapeHtml(year)}</span>` : ''}
          ${cgpa ? `<span class="cgpa">CGPA: ${escapeHtml(cgpa)}</span>` : ''}
        </div>
      `;
    })
    .join('');
}

/**
 * Render skills section
 */
function renderSkills(skills: string[]): string {
  if (!Array.isArray(skills) || skills.length === 0) {
    return '';
  }

  return skills
    .map((skill) => `<span class="skill-tag">${escapeHtml(skill)}</span>`)
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
function renderAchievements(achievements: Array<Record<string, string>> | string[]): string {
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
 */
function renderLanguages(languages: Array<Record<string, any>> | string[]): string {
  console.log('[renderLanguages] Input:', { languages, type: typeof languages, isArray: Array.isArray(languages), length: Array.isArray(languages) ? languages.length : 0 });
  
  if (!Array.isArray(languages) || languages.length === 0) {
    console.log('[renderLanguages] Empty or not array, returning empty string');
    return '';
  }

  // Handle string array format (if languages are stored as simple strings)
  if (typeof languages[0] === 'string') {
    console.log('[renderLanguages] Processing as string array');
    const validLanguages = (languages as string[]).filter(lang => lang && typeof lang === 'string' && lang.trim().length > 0);
    console.log('[renderLanguages] Valid languages (string):', validLanguages);
    if (validLanguages.length === 0) {
      console.log('[renderLanguages] No valid string languages, returning empty');
      return '';
    }
    
    const result = validLanguages
      .map((lang) => `
        <div class="language-item">
          <span class="language">${escapeHtml(lang)}</span>
        </div>
      `)
      .join('');
    console.log('[renderLanguages] String array result length:', result.length);
    return result;
  }

  // Handle object array format
  console.log('[renderLanguages] Processing as object array');
  const validLanguages = (languages as Array<Record<string, any>>).filter(lang => {
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
  
  console.log('[renderLanguages] Final result length:', result.length, 'Preview:', result.substring(0, 200));
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

