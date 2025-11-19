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
    return templatesData.templates.find((t: Template) => t.id === templateId) || null;
  } catch (error) {
    console.error('Error loading template metadata:', error);
    return null;
  }
}

/**
 * Load template HTML file
 */
export async function loadTemplateHTML(templatePath: string): Promise<string> {
  try {
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`Failed to load HTML: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error loading template HTML:', error);
    throw error;
  }
}

/**
 * Load template CSS file
 */
export async function loadTemplateCSS(templatePath: string): Promise<string> {
  try {
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`Failed to load CSS: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error loading template CSS:', error);
    throw error;
  }
}

/**
 * Load complete template (metadata + HTML + CSS)
 */
export async function loadTemplate(templateId: string): Promise<LoadedTemplate | null> {
  try {
    const template = await loadTemplateMetadata(templateId);
    if (!template) {
      return null;
    }

    const [html, css] = await Promise.all([
      loadTemplateHTML(template.html),
      loadTemplateCSS(template.css),
    ]);

    return {
      template,
      html,
      css,
    };
  } catch (error) {
    console.error('Error loading template:', error);
    return null;
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
  const placeholders: Record<string, string> = {
    '{{FULL_NAME}}': formData['Full Name'] || '',
    '{{EMAIL}}': formData['Email'] || '',
    '{{PHONE}}': formData['Phone'] || '',
    '{{JOB_TITLE}}': formData['Job Title'] || '',
    '{{LOCATION}}': formData['Location'] || '',
    '{{LINKEDIN}}': formData['LinkedIn'] || '',
    '{{PORTFOLIO}}': formData['Portfolio'] || '',
    '{{SUMMARY}}': formData['Professional Summary'] || 
                   formData['Career Objective'] || 
                   formData['Objective'] || 
                   formData['Executive Summary'] || '',
    '{{EXPERIENCE}}': renderExperience(formData['Work Experience'] || formData['Experience'] || []),
    '{{EDUCATION}}': renderEducation(formData['Education'] || []),
    '{{SKILLS}}': renderSkills(formData['Skills'] || []),
    '{{PROJECTS}}': renderProjects(formData['Projects'] || []),
    '{{CERTIFICATIONS}}': renderCertifications(formData['Certifications'] || []),
    '{{ACHIEVEMENTS}}': renderAchievements(formData['Achievements'] || formData['Key Achievements'] || []),
  };

  let result = htmlTemplate;
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    result = result.replace(new RegExp(placeholder, 'g'), value);
  });

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

