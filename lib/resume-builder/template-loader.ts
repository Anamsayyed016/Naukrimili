/**
 * Template Loader Utility
 * Dynamically loads template HTML and CSS files
 */

// Lazy load templates data to avoid module initialization issues
let templatesDataCache: any = null;
const getTemplatesData = async () => {
  if (!templatesDataCache) {
    templatesDataCache = (await import('./templates.json')).default;
  }
  return templatesDataCache;
};

export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnail: string;
  preview: string;
  html: string;
  css: string;
  categories: string[];
  layout: string;
  hasSidebar: boolean;
  hasPhoto: boolean;
  recommended: boolean;
  colors: ColorVariant[];
  defaultColor: string;
}

export interface ColorVariant {
  id: string;
  name: string;
  primary: string;
  accent: string;
  text: string;
}

export interface LoadedTemplate {
  template: Template;
  html: string;
  css: string;
}

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
      // Re-throw with more context
      throw new Error(`Failed to load template HTML from all paths. Template: ${templateId}, Path: ${templatePath}, Error: ${directError instanceof Error ? directError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('[loadTemplateHTML] Error loading template HTML:', error);
    console.error('[loadTemplateHTML] Template path:', templatePath);
    console.error('[loadTemplateHTML] Template ID:', templateId);
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
    '{{EXPERIENCE}}': renderExperience(
      formData['Work Experience'] || 
      formData['Experience'] || 
      formData.experience || 
      []
    ),
    '{{EDUCATION}}': renderEducation(
      formData['Education'] || 
      formData.education || 
      []
    ),
    '{{SKILLS}}': renderSkills(
      formData['Skills'] || 
      formData.skills || 
      []
    ),
    '{{PROJECTS}}': renderProjects(
      formData['Projects'] || 
      formData.projects || 
      []
    ),
    '{{CERTIFICATIONS}}': renderCertifications(
      formData['Certifications'] || 
      formData.certifications || 
      []
    ),
    '{{ACHIEVEMENTS}}': renderAchievements(
      formData['Achievements'] || 
      formData['Key Achievements'] || 
      formData.achievements || 
      []
    ),
    '{{LANGUAGES}}': renderLanguages(
      formData['Languages'] || 
      formData.languages || 
      []
    ),
  };

  let result = htmlTemplate;
  
  // Replace placeholders
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    result = result.replace(new RegExp(placeholder, 'g'), value || '');
  });
  
  // Handle Handlebars-style conditionals (remove if empty)
  // Remove {{#if SECTION}}...{{/if}} blocks if the section is empty
  result = result.replace(/\{\{#if\s+(\w+)\}\}[\s\S]*?\{\{\/if\}\}/gi, (match, sectionName) => {
    // Check if the section has content
    const sectionPlaceholder = `{{${sectionName.toUpperCase()}}}`;
    const hasContent = placeholders[sectionPlaceholder] && 
                       placeholders[sectionPlaceholder].trim().length > 0;
    
    if (hasContent) {
      // Remove the conditional tags but keep the content
      return match.replace(/\{\{#if\s+\w+\}\}/gi, '').replace(/\{\{\/if\}\}/gi, '');
    } else {
      // Remove the entire block
      return '';
    }
  });
  
  // Clean up any remaining placeholder-like syntax
  result = result.replace(/\{\{[^}]+\}\}/g, '');

  return result;
}

/**
 * Render experience section
 */
function renderExperience(experiences: Array<Record<string, string>>): string {
  if (!Array.isArray(experiences) || experiences.length === 0) {
    return '';
  }

  return experiences
    .map((exp) => {
      const company = exp.Company || exp.company || '';
      const position = exp.Position || exp.position || '';
      const duration = exp.Duration || exp.duration || '';
      const description = exp.Description || exp.description || '';

      return `
        <div class="experience-item">
          <div class="experience-header">
            <h3>${escapeHtml(position)}</h3>
            <span class="company">${escapeHtml(company)}</span>
            ${duration ? `<span class="duration">${escapeHtml(duration)}</span>` : ''}
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
function renderEducation(education: Array<Record<string, string>>): string {
  if (!Array.isArray(education) || education.length === 0) {
    return '';
  }

  return education
    .map((edu) => {
      const institution = edu.Institution || edu.institution || '';
      const degree = edu.Degree || edu.degree || '';
      const year = edu.Year || edu.year || '';
      const cgpa = edu.CGPA || edu.cgpa || '';

      return `
        <div class="education-item">
          <h3>${escapeHtml(degree)}</h3>
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
 */
function renderAchievements(achievements: Array<Record<string, string>>): string {
  if (!Array.isArray(achievements) || achievements.length === 0) {
    return '';
  }

  // Filter out empty entries (entries with no Title)
  const validAchievements = achievements.filter(achievement => {
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
function renderLanguages(languages: Array<Record<string, string>>): string {
  if (!Array.isArray(languages) || languages.length === 0) {
    return '';
  }

  // Filter out empty entries
  const validLanguages = languages.filter(lang => {
    const language = lang.Language || lang.language || '';
    return language.trim().length > 0;
  });

  if (validLanguages.length === 0) {
    return '';
  }

  return validLanguages
    .map((lang) => {
      const language = lang.Language || lang.language || '';
      const proficiency = lang.Proficiency || lang.proficiency || '';

      return `
        <div class="language-item">
          <span class="language">${escapeHtml(language)}</span>
          ${proficiency ? `<span class="proficiency">${escapeHtml(proficiency)}</span>` : ''}
        </div>
      `;
    })
    .join('');
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

