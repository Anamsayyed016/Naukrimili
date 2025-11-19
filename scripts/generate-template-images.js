/**
 * Template Image Generator
 * Generates thumbnail.png and preview.png for all resume templates
 * 
 * Usage: node scripts/generate-template-images.js
 * 
 * Requirements:
 * - npm install puppeteer
 * - Templates must exist in /public/templates/
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

// Sample resume data for image generation
const sampleResumeData = {
  "Full Name": "John Anderson",
  "Email": "john.anderson@email.com",
  "Phone": "+1 (555) 123-4567",
  "Location": "San Francisco, CA",
  "Job Title": "Senior Software Engineer",
  "Professional Summary": "Experienced software engineer with 8+ years in full-stack development, specializing in scalable web applications and cloud infrastructure. Proven track record of leading cross-functional teams and delivering high-quality software solutions.",
  "Work Experience": [
    {
      "Company": "Tech Corp",
      "Position": "Senior Software Engineer",
      "Duration": "2020 - Present",
      "Description": "Led development of microservices architecture serving 1M+ users. Implemented CI/CD pipelines reducing deployment time by 60%. Mentored junior developers and established coding standards."
    },
    {
      "Company": "StartupXYZ",
      "Position": "Full Stack Developer",
      "Duration": "2018 - 2020",
      "Description": "Built responsive web applications using React and Node.js. Collaborated with design team to implement pixel-perfect UIs. Optimized database queries improving page load time by 40%."
    }
  ],
  "Education": [
    {
      "Institution": "University of California",
      "Degree": "Bachelor of Science in Computer Science",
      "Year": "2016",
      "CGPA": "3.8"
    }
  ],
  "Skills": ["JavaScript", "React", "Node.js", "TypeScript", "AWS", "Docker", "PostgreSQL", "MongoDB"],
  "Projects": [
    {
      "Name": "E-Commerce Platform",
      "Description": "Built scalable e-commerce platform with payment integration",
      "Technologies": "React, Node.js, Stripe API",
      "Link": "https://example.com"
    }
  ],
  "Certifications": [
    {
      "Name": "AWS Certified Solutions Architect",
      "Issuer": "Amazon Web Services",
      "Date": "2022"
    }
  ]
};

// Template configurations
const templates = [
  { id: 'modern-professional', name: 'Modern Professional' },
  { id: 'creative-modern', name: 'Creative Modern' },
  { id: 'classic-simple', name: 'Classic Simple' },
  { id: 'executive-blue', name: 'Executive Blue' },
  { id: 'minimal-ats', name: 'Minimal ATS' },
  { id: 'clean-one-column', name: 'Clean One Column' },
];

// Inject resume data into HTML template
function injectResumeData(html, data) {
  let result = html;
  
  // Replace placeholders
  result = result.replace(/\{\{FULL_NAME\}\}/g, data["Full Name"] || '');
  result = result.replace(/\{\{EMAIL\}\}/g, data["Email"] || '');
  result = result.replace(/\{\{PHONE\}\}/g, data["Phone"] || '');
  result = result.replace(/\{\{LOCATION\}\}/g, data["Location"] || '');
  result = result.replace(/\{\{JOB_TITLE\}\}/g, data["Job Title"] || '');
  result = result.replace(/\{\{SUMMARY\}\}/g, data["Professional Summary"] || data["Career Objective"] || data["Objective"] || data["Executive Summary"] || '');
  
  // Render experience
  if (data["Work Experience"] || data["Experience"]) {
    const experiences = (data["Work Experience"] || data["Experience"] || []);
    const experienceHTML = experiences.map(exp => {
      return `
        <div class="experience-item">
          <div class="experience-header">
            <h3>${escapeHtml(exp.Position || exp.position || '')}</h3>
            <span class="company">${escapeHtml(exp.Company || exp.company || '')}</span>
            ${exp.Duration || exp.duration ? `<span class="duration">${escapeHtml(exp.Duration || exp.duration)}</span>` : ''}
          </div>
          ${exp.Description || exp.description ? `<p class="description">${escapeHtml(exp.Description || exp.description)}</p>` : ''}
        </div>
      `;
    }).join('');
    result = result.replace(/\{\{EXPERIENCE\}\}/g, experienceHTML);
  } else {
    result = result.replace(/\{\{EXPERIENCE\}\}/g, '');
  }
  
  // Render education
  if (data["Education"]) {
    const educationHTML = data["Education"].map(edu => {
      return `
        <div class="education-item">
          <h3>${escapeHtml(edu.Degree || edu.degree || '')}</h3>
          <span class="institution">${escapeHtml(edu.Institution || edu.institution || '')}</span>
          ${edu.Year || edu.year ? `<span class="year">${escapeHtml(edu.Year || edu.year)}</span>` : ''}
          ${edu.CGPA || edu.cgpa ? `<span class="cgpa">CGPA: ${escapeHtml(edu.CGPA || edu.cgpa)}</span>` : ''}
        </div>
      `;
    }).join('');
    result = result.replace(/\{\{EDUCATION\}\}/g, educationHTML);
  } else {
    result = result.replace(/\{\{EDUCATION\}\}/g, '');
  }
  
  // Render skills
  if (data["Skills"]) {
    const skillsHTML = data["Skills"].map(skill => {
      return `<span class="skill-tag">${escapeHtml(skill)}</span>`;
    }).join('');
    result = result.replace(/\{\{SKILLS\}\}/g, skillsHTML);
  } else {
    result = result.replace(/\{\{SKILLS\}\}/g, '');
  }
  
  // Render projects
  if (data["Projects"]) {
    const projectsHTML = data["Projects"].map(project => {
      return `
        <div class="project-item">
          <h3>${escapeHtml(project.Name || project.name || '')}</h3>
          ${project.Description || project.description ? `<p class="description">${escapeHtml(project.Description || project.description)}</p>` : ''}
          ${project.Technologies || project.technologies ? `<p class="technologies">${escapeHtml(project.Technologies || project.technologies)}</p>` : ''}
          ${project.Link || project.link ? `<a href="${escapeHtml(project.Link || project.link)}" target="_blank">View Project</a>` : ''}
        </div>
      `;
    }).join('');
    result = result.replace(/\{\{PROJECTS\}\}/g, projectsHTML);
  } else {
    result = result.replace(/\{\{PROJECTS\}\}/g, '');
  }
  
  // Render certifications
  if (data["Certifications"]) {
    const certsHTML = data["Certifications"].map(cert => {
      return `
        <div class="certification-item">
          <h3>${escapeHtml(cert.Name || cert.name || '')}</h3>
          ${cert.Issuer || cert.issuer ? `<span class="issuer">${escapeHtml(cert.Issuer || cert.issuer)}</span>` : ''}
          ${cert.Date || cert.date ? `<span class="date">${escapeHtml(cert.Date || cert.date)}</span>` : ''}
        </div>
      `;
    }).join('');
    result = result.replace(/\{\{CERTIFICATIONS\}\}/g, certsHTML);
  } else {
    result = result.replace(/\{\{CERTIFICATIONS\}\}/g, '');
  }
  
  // Remove conditional blocks
  result = result.replace(/\{\{#if [^}]+\}\}/g, '');
  result = result.replace(/\{\{\/if\}\}/g, '');
  
  return result;
}

function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function generateTemplateImages() {
  console.log('🚀 Starting template image generation...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();
  
  for (const template of templates) {
    try {
      console.log(`📸 Generating images for: ${template.name}...`);
      
      const templateDir = path.join(process.cwd(), 'public', 'templates', template.id);
      const htmlPath = path.join(templateDir, 'index.html');
      const cssPath = path.join(templateDir, 'style.css');
      
      // Read HTML and CSS files
      const html = await fs.readFile(htmlPath, 'utf-8');
      const css = await fs.readFile(cssPath, 'utf-8');
      
      // Inject sample data
      const populatedHTML = injectResumeData(html, sampleResumeData);
      
      // Create full HTML document
      const fullHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>${css}</style>
          </head>
          <body>
            ${populatedHTML}
          </body>
        </html>
      `;
      
      // Set content
      await page.setContent(fullHTML, { waitUntil: 'networkidle0' });
      
      // Wait for fonts and images to load
      await page.waitForTimeout(1000);
      
      // Generate thumbnail (300×400px)
      const thumbnailPath = path.join(templateDir, 'thumbnail.png');
      await page.screenshot({
        path: thumbnailPath,
        width: 300,
        height: 400,
        clip: {
          x: 0,
          y: 0,
          width: 300,
          height: 400,
        },
      });
      console.log(`  ✅ Generated: thumbnail.png`);
      
      // Generate preview (800×1000px)
      const previewPath = path.join(templateDir, 'preview.png');
      await page.screenshot({
        path: previewPath,
        width: 800,
        height: 1000,
        clip: {
          x: 0,
          y: 0,
          width: 800,
          height: 1000,
        },
      });
      console.log(`  ✅ Generated: preview.png`);
      
    } catch (error) {
      console.error(`  ❌ Error generating images for ${template.name}:`, error.message);
    }
  }
  
  await browser.close();
  console.log('\n✨ Image generation complete!');
}

// Run if called directly
if (require.main === module) {
  generateTemplateImages().catch(console.error);
}

module.exports = { generateTemplateImages };

