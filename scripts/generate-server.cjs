const fs = require('fs');
const path = require('path');

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
  
  // Verify the file was created and has valid syntax
  if (fs.existsSync(outputPath)) {
    console.log('✅ server.cjs created successfully');
    
    // Basic syntax check
    try {
      require(outputPath);
      console.log('✅ server.cjs syntax is valid');
    } catch (syntaxError) {
      console.error('❌ server.cjs syntax error:', syntaxError.message);
      process.exit(1);
    }
  } else {
    console.error('❌ Failed to create server.cjs');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error generating server.cjs:', error.message);
  process.exit(1);
}
