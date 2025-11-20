/**
 * Template Loader Utility
 * Dynamically loads template HTML and CSS files
 */

// Import templates data
import templatesData from './templates.json';

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
    // Try API route first (more reliable)
    // Extract templateId from path - handle both /templates/id/ and /templates/id/file.html formats
    const templateIdMatch = templatePath.match(/\/templates\/([^/]+)/);
    const templateId = templateIdMatch?.[1];
    let fetchPath = templatePath;
    
    if (templateId) {
      // Use API route for better reliability
      fetchPath = `/api/resume-builder/templates/${templateId}/html`;
      console.log(`[loadTemplateHTML] Using API route: ${fetchPath} (extracted from: ${templatePath})`);
    } else {
      console.log(`[loadTemplateHTML] Could not extract templateId, using direct path: ${templatePath}`);
    }
    
    const response = await fetch(fetchPath);
    if (!response.ok) {
      // Fallback to direct path if API route fails
      if (templateId && fetchPath.startsWith('/api/')) {
        console.warn(`[loadTemplateHTML] API route failed, trying direct path: ${templatePath}`);
        const fallbackResponse = await fetch(templatePath);
        if (!fallbackResponse.ok) {
          throw new Error(`Failed to load HTML: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
        }
        const fullHTML = await fallbackResponse.text();
        // Extract body content
        const bodyMatch = fullHTML.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) {
          return bodyMatch[1].trim();
        }
        return fullHTML.trim();
      }
      throw new Error(`Failed to load HTML: ${response.status} ${response.statusText}`);
    }
    const fullHTML = await response.text();
    
    // If using API route, body content is already extracted
    if (fetchPath.startsWith('/api/')) {
      return fullHTML.trim();
    }
    
    // Extract body content from full HTML (for direct path fallback)
    // Handle both full HTML documents and body-only content
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
    return fullHTML;
  } catch (error) {
    console.error('Error loading template HTML:', error);
    console.error('Template path:', templatePath);
    throw error;
  }
}

/**
 * Load template CSS file
 */
export async function loadTemplateCSS(templatePath: string): Promise<string> {
  try {
    // Try API route first (more reliable)
    // Extract templateId from path - handle both /templates/id/ and /templates/id/file.css formats
    const templateIdMatch = templatePath.match(/\/templates\/([^/]+)/);
    const templateId = templateIdMatch?.[1];
    let fetchPath = templatePath;
    
    if (templateId) {
      // Use API route for better reliability
      fetchPath = `/api/resume-builder/templates/${templateId}/css`;
      console.log(`[loadTemplateCSS] Using API route: ${fetchPath} (extracted from: ${templatePath})`);
    } else {
      console.log(`[loadTemplateCSS] Could not extract templateId, using direct path: ${templatePath}`);
    }
    
    const response = await fetch(fetchPath);
    if (!response.ok) {
      // Fallback to direct path if API route fails
      if (templateId && fetchPath.startsWith('/api/')) {
        console.warn(`[loadTemplateCSS] API route failed, trying direct path: ${templatePath}`);
        const fallbackResponse = await fetch(templatePath);
        if (!fallbackResponse.ok) {
          throw new Error(`Failed to load CSS: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
        }
        const css = await fallbackResponse.text();
        return css.replace(/@import[^;]+;/gi, '').trim();
      }
      throw new Error(`Failed to load CSS: ${response.status} ${response.statusText}`);
    }
    const css = await response.text();
    
    // Remove any @import statements that might cause issues
    return css.replace(/@import[^;]+;/gi, '').trim();
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
  const fullName = formData['Full Name'] || 
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

  return projects
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

  return certifications
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

  return achievements
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

