/**
 * Server-Side Template Loader Utility
 * Uses Node.js fs to load template files directly (for API routes)
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type { Template, LoadedTemplate, ColorVariant } from './types';

// Lazy load templates data to avoid module initialization issues
let templatesDataCache: Record<string, unknown> | null = null;
async function getTemplatesData(): Promise<Record<string, unknown>> {
  if (!templatesDataCache) {
    const templatesModule = await import('./templates.json');
    templatesDataCache = templatesModule.default;
  }
  return templatesDataCache;
}

/**
 * Load template metadata from JSON
 */
export async function loadTemplateMetadata(templateId: string): Promise<Template | null> {
  try {
    const templatesData = await getTemplatesData();
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
 * Apply color variant to CSS - inline implementation to avoid re-export issues
 */
export function applyColorVariant(css: string, colorVariant: ColorVariant): string {
  return css
    .replace(/--primary-color:\s*[^;]+;/g, `--primary-color: ${colorVariant.primary};`)
    .replace(/--accent-color:\s*[^;]+;/g, `--accent-color: ${colorVariant.accent};`)
    .replace(/--text-color:\s*[^;]+;/g, `--text-color: ${colorVariant.text};`);
}

/**
 * Inject resume data into HTML template - duplicate implementation to avoid re-export circular dependencies
 * This is server-side only and identical to template-loader.ts to prevent bundling issues
 */
export function injectResumeData(htmlTemplate: string, formData: Record<string, unknown>): string {
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
  
  const firstName = formData.firstName || formData['First Name'] || '';
  const lastName = formData.lastName || formData['Last Name'] || '';
  
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
    '{{EXPERIENCE}}': renderExperienceServer(
      formData['Work Experience'] || 
      formData['Experience'] || 
      formData.experience || 
      []
    ),
    '{{EDUCATION}}': renderEducationServer(
      formData['Education'] || 
      formData.education || 
      []
    ),
    '{{SKILLS}}': renderSkillsServer(
      formData['Skills'] || 
      formData.skills || 
      []
    ),
    '{{PROJECTS}}': renderProjectsServer(
      formData['Projects'] || 
      formData['Projects(optional)'] ||
      formData['Academic Projects'] ||
      formData.projects || 
      []
    ),
    '{{CERTIFICATIONS}}': renderCertificationsServer(
      formData['Certifications'] || 
      formData.certifications || 
      []
    ),
    '{{ACHIEVEMENTS}}': renderAchievementsServer(
      formData['Achievements'] || 
      formData['Key Achievements'] || 
      formData.achievements || 
      []
    ),
    '{{LANGUAGES}}': renderLanguagesServer(
      formData['Languages'] || 
      formData.languages || 
      []
    ),
  };

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
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value || '');
  });
  
  // Clean up any remaining placeholder-like syntax
  result = result.replace(/\{\{[^}]+\}\}/g, '');
  return result;
}

// Helper functions for server-side rendering (duplicated to avoid re-exports)
function escapeHtmlServer(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderExperienceServer(experiences: Array<Record<string, unknown>>): string {
  if (!Array.isArray(experiences) || experiences.length === 0) return '';
  return experiences.map((exp) => {
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
          <h3>${escapeHtmlServer(position)}</h3>
          <span class="company">${escapeHtmlServer(companyWithLocation)}</span>
          ${finalDuration ? `<span class="duration">${escapeHtmlServer(finalDuration)}</span>` : ''}
        </div>
        ${description ? `<p class="description">${escapeHtmlServer(description)}</p>` : ''}
      </div>
    `;
  }).join('');
}

function renderEducationServer(education: Array<Record<string, unknown>>): string {
  if (!Array.isArray(education) || education.length === 0) return '';
  return education.map((edu) => {
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
        <h3>${escapeHtmlServer(degreeWithField)}</h3>
        <span class="institution">${escapeHtmlServer(institution)}</span>
        ${year ? `<span class="year">${escapeHtmlServer(year)}</span>` : ''}
        ${cgpa ? `<span class="cgpa">CGPA: ${escapeHtmlServer(cgpa)}</span>` : ''}
      </div>
    `;
  }).join('');
}

function renderSkillsServer(skills: string[]): string {
  if (!Array.isArray(skills) || skills.length === 0) return '';
  return skills.map((skill) => `<span class="skill-tag">${escapeHtmlServer(skill)}</span>`).join('');
}

function renderProjectsServer(projects: Array<Record<string, string>>): string {
  if (!Array.isArray(projects) || projects.length === 0) return '';
  const validProjects = projects.filter(project => {
    const name = project.Name || project.name || '';
    return name.trim().length > 0;
  });
  if (validProjects.length === 0) return '';
  return validProjects.map((project) => {
    const name = project.Name || project.name || '';
    const description = project.Description || project.description || '';
    const technologies = project.Technologies || project.technologies || '';
    const link = project.Link || project.link || '';
    return `
      <div class="project-item">
        <h3>${escapeHtmlServer(name)}</h3>
        ${description ? `<p class="description">${escapeHtmlServer(description)}</p>` : ''}
        ${technologies ? `<p class="technologies">${escapeHtmlServer(technologies)}</p>` : ''}
        ${link ? `<a href="${escapeHtmlServer(link)}" target="_blank">View Project</a>` : ''}
      </div>
    `;
  }).join('');
}

function renderCertificationsServer(certifications: Array<Record<string, string>>): string {
  if (!Array.isArray(certifications) || certifications.length === 0) return '';
  const validCerts = certifications.filter(cert => {
    const name = cert.Name || cert.name || '';
    return name.trim().length > 0;
  });
  if (validCerts.length === 0) return '';
  return validCerts.map((cert) => {
    const name = cert.Name || cert.name || '';
    const issuer = cert.Issuer || cert.issuer || '';
    const date = cert.Date || cert.date || '';
    const link = cert.Link || cert.link || '';
    return `
      <div class="certification-item">
        <h3>${escapeHtmlServer(name)}</h3>
        ${issuer ? `<span class="issuer">${escapeHtmlServer(issuer)}</span>` : ''}
        ${date ? `<span class="date">${escapeHtmlServer(date)}</span>` : ''}
        ${link ? `<a href="${escapeHtmlServer(link)}" target="_blank">View Certificate</a>` : ''}
      </div>
    `;
  }).join('');
}

function renderAchievementsServer(achievements: Array<Record<string, string>> | string[]): string {
  if (!Array.isArray(achievements) || achievements.length === 0) return '';
  
  // Handle string array format (from AchievementsStep)
  if (typeof achievements[0] === 'string') {
    const validAchievements = (achievements as string[]).filter(achievement => 
      achievement && achievement.trim().length > 0
    );
    
    if (validAchievements.length === 0) return '';
    
    return validAchievements.map((achievement) => `
      <div class="achievement-item">
        <h3>${escapeHtmlServer(achievement)}</h3>
      </div>
    `).join('');
  }
  
  // Handle object array format (legacy format)
  const validAchievements = (achievements as Array<Record<string, string>>).filter(achievement => {
    const title = achievement.Title || achievement.title || '';
    return title.trim().length > 0;
  });
  if (validAchievements.length === 0) return '';
  return validAchievements.map((achievement) => {
    const title = achievement.Title || achievement.title || '';
    const description = achievement.Description || achievement.description || '';
    const date = achievement.Date || achievement.date || '';
    return `
      <div class="achievement-item">
        <h3>${escapeHtmlServer(title)}</h3>
        ${description ? `<p class="description">${escapeHtmlServer(description)}</p>` : ''}
        ${date ? `<span class="date">${escapeHtmlServer(date)}</span>` : ''}
      </div>
    `;
  }).join('');
}

function renderLanguagesServer(languages: Array<Record<string, unknown>> | string[]): string {
  if (!Array.isArray(languages) || languages.length === 0) return '';
  
  // Handle string array format (if languages are stored as simple strings)
  if (typeof languages[0] === 'string') {
    const validLanguages = (languages as string[]).filter(lang => lang && lang.trim().length > 0);
    if (validLanguages.length === 0) return '';
    
    return validLanguages.map((lang) => `
      <div class="language-item">
        <span class="language">${escapeHtmlServer(lang)}</span>
      </div>
    `).join('');
  }
  
  // Handle object array format
  const validLanguages = (languages as Array<Record<string, unknown>>).filter(lang => {
    // Support multiple field name variations
    const language = lang.Language || lang.language || lang.name || '';
    return language && typeof language === 'string' && language.trim().length > 0;
  });
  if (validLanguages.length === 0) return '';
  return validLanguages.map((lang) => {
    // Support multiple field name variations
    const language = lang.Language || lang.language || lang.name || '';
    const proficiency = lang.Proficiency || lang.proficiency || lang.level || '';
    return `
      <div class="language-item">
        <span class="language">${escapeHtmlServer(String(language))}</span>
        ${proficiency ? `<span class="proficiency">${escapeHtmlServer(String(proficiency))}</span>` : ''}
      </div>
    `;
  }).join('');
}

