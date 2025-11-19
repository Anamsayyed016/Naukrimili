/**
 * Create Placeholder Images for Resume Templates
 * Generates simple placeholder PNG images using Node.js canvas or sharp
 * 
 * Usage: node scripts/create-placeholder-images.js
 */

const fs = require('fs').promises;
const path = require('path');

// Template configurations
const templates = [
  { id: 'modern-professional', name: 'Modern Professional', color: '#2C3E50' },
  { id: 'creative-modern', name: 'Creative Modern', color: '#0054FF' },
  { id: 'classic-simple', name: 'Classic Simple', color: '#4B4F5A' },
  { id: 'executive-blue', name: 'Executive Blue', color: '#1E3A8A' },
  { id: 'minimal-ats', name: 'Minimal ATS', color: '#C8C8C8' },
  { id: 'clean-one-column', name: 'Clean One Column', color: '#000000' },
];

// Create a simple SVG-based placeholder
function createSVGPlaceholder(width, height, templateName, color) {
  const bgColor = color + '15'; // 15% opacity
  const borderColor = color;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${bgColor}" stroke="${borderColor}" stroke-width="2"/>
  <text x="50%" y="45%" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${color}">
    ${templateName}
  </text>
  <text x="50%" y="55%" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#666">
    Resume Template
  </text>
  <text x="50%" y="70%" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#999">
    ${width}×${height}
  </text>
</svg>`;
}

// Convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Create a simple data URI PNG placeholder (1x1 pixel, then scale with CSS)
function createDataURIPlaceholder(color) {
  const rgb = hexToRgb(color);
  // Create a simple 1x1 PNG data URI with the template color
  // This is a minimal approach - for real images, use sharp or canvas
  return `data:image/svg+xml;base64,${Buffer.from(createSVGPlaceholder(300, 400, 'Template', color)).toString('base64')}`;
}

async function createPlaceholderImages() {
  console.log('🎨 Creating placeholder images for templates...\n');
  
  try {
    // Try to use sharp if available, otherwise use SVG
    let useSharp = false;
    try {
      require('sharp');
      useSharp = true;
      console.log('✅ Using sharp for image generation\n');
    } catch (e) {
      console.log('⚠️  Sharp not found, using SVG placeholders\n');
    }
    
    for (const template of templates) {
      try {
        const templateDir = path.join(process.cwd(), 'public', 'templates', template.id);
        
        // Ensure directory exists
        await fs.mkdir(templateDir, { recursive: true });
        
        // Create thumbnail (300×400px)
        const thumbnailPath = path.join(templateDir, 'thumbnail.png');
        const thumbnailSVG = createSVGPlaceholder(300, 400, template.name, template.color);
        await fs.writeFile(thumbnailPath.replace('.png', '.svg'), thumbnailSVG);
        
        // Create preview (800×1000px)
        const previewPath = path.join(templateDir, 'preview.png');
        const previewSVG = createSVGPlaceholder(800, 1000, template.name, template.color);
        await fs.writeFile(previewPath.replace('.png', '.svg'), previewSVG);
        
        if (useSharp) {
          const sharp = require('sharp');
          // Convert SVG to PNG
          await sharp(Buffer.from(thumbnailSVG))
            .resize(300, 400)
            .png()
            .toFile(thumbnailPath);
          
          await sharp(Buffer.from(previewSVG))
            .resize(800, 1000)
            .png()
            .toFile(previewPath);
          
          console.log(`✅ Created PNG images for: ${template.name}`);
        } else {
          console.log(`✅ Created SVG placeholders for: ${template.name}`);
          console.log(`   Note: Install 'sharp' for PNG generation: npm install sharp`);
        }
        
      } catch (error) {
        console.error(`❌ Error creating images for ${template.name}:`, error.message);
      }
    }
    
    console.log('\n✨ Placeholder image creation complete!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Install sharp: npm install sharp --save-dev');
    console.log('   2. Run: npm run generate:template-images');
    console.log('   3. This will generate real template previews from HTML/CSS');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  createPlaceholderImages().catch(console.error);
}

module.exports = { createPlaceholderImages };

