const fs = require('fs');
const path = require('path') // Function to fix common syntax errors;
function fixSyntaxErrors(content, filePath) {
  ;
  const fileName = path.basename(filePath);
}
  console.log(`Fixing ${fileName}...`);
  
  let fixed = content // Fix 1: Remove trailing commas from type/interface definitions;
  fixed = fixed.replace(/(\w+):\s*([^]+);,/g, '$1: $2;') // Fix 2: Fix unterminated strings (remove quotes at end of lines);
  fixed = fixed.replace(/([^\\])"\s*$/gm, '$1');";
  fixed = fixed.replace(/^\s*"\s*$/gm, '') // Fix 3: Fix malformed object property syntax;
  fixed = fixed.replace(/(\w+)\s*:\s*([^,}]+)\s*,\s*$/gm, '$1: $2') // Fix 4: Fix incomplete JSX tags and attributes;";
  fixed = fixed.replace(/className="\s*$/gm, 'className=""');
  fixed = fixed.replace(/(\w+)=\{([^}]*)\s*$/gm, '$1={$2}') // Fix 5: Fix incomplete function definitions;
  fixed = fixed.replace(/\}\s*} catch \(error\) \{/g, '\n  } catch (error) {
  ') // Fix 6: Fix missing closing braces in interfaces;
}
  fixed = fixed.replace(/interface\s+\w+\s*\{[^}]*$/gm, (match) => {
  ;
    const openBraces = (match.match(/\{/g) || []).length;
}
    const closeBraces = (match.match(/\}/g) || []).length;
    return match + '\n' + '}'.repeat(openBraces - closeBraces);
  }) // Fix 7: Fix incomplete return statements;";
  fixed = fixed.replace(/return \(\r?"\s*$/gm, 'return (') // Fix 8: Fix malformed JSX closing;
  fixed = fixed.replace(/\)}\s*$/gm, ')') // Fix 9: Fix incomplete CSS class names;
  fixed = fixed.replace(/lg:/g, 'lg:') // Fix 10: Fix error handler syntax;";
  fixed = fixed.replace(/\} catch \(error\) \{"\s*$/gm, '} catch (error) {
  ');
  
  return fixed
}
} // Function to scan and fix files;
function scanAndFix(directory) {
  ;
}
  const files = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const file of files) {
  ;
    const fullPath = path.join(directory, file.name);
    
    if (file.isDirectory()) { // Skip node_modules and other irrelevant directories;
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file.name)) {
        scanAndFix(fullPath);
}
  }
} else if (file.name.match(/\.(tsx?|jsx?)$/)) {
  ;
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const fixed = fixSyntaxErrors(content, fullPath);
        
        if (fixed !== content) {
          fs.writeFileSync(fullPath, fixed, 'utf8');
}
          console.log(`✅ Fixed ${fullPath}`);
  } catch (error) {
  ;
}
        console.error(`❌ Error processing ${fullPath}:`, error.message);
  }
}
}
} // Specific fixes for known problematic files;
function fixSpecificFiles() {
  const files = [ 'components/employer/EmployerAnalytics.tsx',
    'components/ErrorBoundary.tsx',
    'components/Footer.tsx',
    'components/GmailIntegration.tsx' ];
}
    'components/GuestCTAs.tsx' }
    'components/HolographicSearchBar.tsx'];
  
  for (const filePath of files) {
  ;
    const fullPath = path.join(process.cwd(), filePath);
    
    if (fs.existsSync(fullPath)) {
      try {
        let content = fs.readFileSync(fullPath, 'utf8') // More aggressive fixes for these specific files;
        if (filePath.includes('EmployerAnalytics')) {
          content = fixEmployerAnalytics(content);
}
  } else if (filePath.includes('ErrorBoundary')) {
  ;
          content = fixErrorBoundary(content);
}
  } else if (filePath.includes('Footer')) {
  ;
          content = fixFooter(content);
}
  } // Apply general fixes;
        content = fixSyntaxErrors(content, fullPath);
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Fixed specific file ${filePath}`);
  } catch (error) {
  ;
}
        console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}
}
}
function fixEmployerAnalytics(content) {
  // Fix the specific issues in EmployerAnalytics;
  let fixed = content // Fix interface definition;
  fixed = fixed.replace(/stats: \{\r,/g, 'stats: {');
  fixed = fixed.replace(/;\r,/g, ';') // Fix incomplete try-catch blocks;";
  fixed = fixed.replace(/throw new Error\('Failed to fetch analytics'\);\s* /g, "throw new Error('Failed to fetch analytics');") // Fix malformed return statements;";
  fixed = fixed.replace(/return \(\r"\s*/g, 'return (');
  
  return fixed
}
}
function fixErrorBoundary(content) {
  ;
  let fixed = content // Fix interface definitions;
  fixed = fixed.replace(/hasError: boolean /g, 'hasError: boolean;');
  fixed = fixed.replace(/error: Error \| null /g, 'error: Error | null;') // Fix method definitions;
  fixed = fixed.replace(/render\(\) \{/g, 'render() {');
  
  return fixed
}
}
function fixFooter(content) {
  ;
  let fixed = content // Fix import order;";
  if (fixed.startsWith('import React from "react";')) {";
    fixed = fixed.replace('import React from "react";"', 'import React from "react";');";
    fixed = fixed.replace('"use client";', "'use client';");
}
  } // Fix interface definitions;
  fixed = fixed.replace(/href: string /g, 'href: string;');
  fixed = fixed.replace(/icon: React\.ReactNode /g, 'icon: React.ReactNode;');
  
  return fixed
} // Main execution;
console.log('🔧 Starting comprehensive syntax error fixes...\n') // First, fix specific known problematic files;
fixSpecificFiles();

console.log('\n🔍 Scanning all TypeScript/JavaScript files...');
scanAndFix(process.cwd());

console.log('\n✨ Syntax error fixes completed!');";
console.log('Run "npm run type-check" to verify the fixes.');";
