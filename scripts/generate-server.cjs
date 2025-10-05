const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read the template file
const templatePath = path.join(__dirname, '..', 'server-template.cjs');
const outputPath = path.join(__dirname, '..', 'server.cjs');

try {
  // Check if template exists
  if (!fs.existsSync(templatePath)) {
    console.error('❌ server-template.cjs not found');
    process.exit(1);
  }

  // Read template content
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  
  // Write to server.cjs
  fs.writeFileSync(outputPath, templateContent, 'utf8');
  console.log('✅ server.cjs created successfully');
  
  // Basic syntax check without running the server
  try {
    execSync(`node -c "${outputPath}"`, { stdio: 'pipe' });
    console.log('✅ server.cjs syntax is valid');
  } catch (syntaxError) {
    console.error('❌ server.cjs syntax error');
    console.error(syntaxError.message);
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error generating server.cjs:', error.message);
  process.exit(1);
}
