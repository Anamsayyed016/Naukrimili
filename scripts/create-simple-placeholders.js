/**
 * Create Simple Placeholder Images using Canvas (Node.js built-in alternative)
 * This creates actual PNG files without external dependencies
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Template configurations
const templates = [
  { id: 'modern-professional', name: 'Modern Professional', color: '#2C3E50' },
  { id: 'creative-modern', name: 'Creative Modern', color: '#0054FF' },
  { id: 'classic-simple', name: 'Classic Simple', color: '#4B4F5A' },
  { id: 'executive-blue', name: 'Executive Blue', color: '#1E3A8A' },
  { id: 'minimal-ats', name: 'Minimal ATS', color: '#C8C8C8' },
  { id: 'clean-one-column', name: 'Clean One Column', color: '#000000' },
];

// Create SVG and save as placeholder
function createSVGPlaceholder(width, height, templateName, color) {
  const bgColor = color + '15';
  const borderColor = color;
  const textColor = color;
  
  // Short name for display
  const shortName = templateName.length > 20 ? templateName.substring(0, 17) + '...' : templateName;
  
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color}08;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#grad)" stroke="${borderColor}" stroke-width="3"/>
  <rect x="20" y="20" width="${width-40}" height="${height-40}" fill="white" opacity="0.3" rx="8"/>
  <text x="50%" y="40%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.min(width/12, 28)}" font-weight="bold" fill="${textColor}">
    ${shortName}
  </text>
  <text x="50%" y="50%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.min(width/20, 16)}" fill="#666">
    Resume Template
  </text>
  <text x="50%" y="65%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.min(width/25, 12)}" fill="#999">
    ${width} × ${height}px
  </text>
  <circle cx="${width/2}" cy="${height*0.8}" r="30" fill="${color}" opacity="0.2"/>
  <circle cx="${width/2}" cy="${height*0.8}" r="20" fill="${color}" opacity="0.4"/>
</svg>`;
}

async function createPlaceholders() {
  console.log('🎨 Creating placeholder images...\n');
  
  for (const template of templates) {
    try {
      const templateDir = path.join(process.cwd(), 'public', 'templates', template.id);
      
      // Ensure directory exists
      await fs.mkdir(templateDir, { recursive: true });
      
      // Create thumbnail SVG (300×400px)
      const thumbnailSVG = createSVGPlaceholder(300, 400, template.name, template.color);
      const thumbnailPath = path.join(templateDir, 'thumbnail.svg');
      await fs.writeFile(thumbnailPath, thumbnailSVG);
      
      // Create preview SVG (800×1000px)
      const previewSVG = createSVGPlaceholder(800, 1000, template.name, template.color);
      const previewPath = path.join(templateDir, 'preview.svg');
      await fs.writeFile(previewPath, previewSVG);
      
      console.log(`✅ Created SVG placeholders for: ${template.name}`);
      
    } catch (error) {
      console.error(`❌ Error creating placeholders for ${template.name}:`, error.message);
    }
  }
  
  console.log('\n✨ Placeholder creation complete!');
  console.log('\n📝 Note: SVG files created. For PNG conversion:');
  console.log('   1. Install sharp: npm install sharp --save-dev');
  console.log('   2. Or use online SVG to PNG converter');
  console.log('   3. Or run: npm run generate:template-images (requires puppeteer)');
}

// Run
createPlaceholders().catch(console.error);

export { createPlaceholders };

