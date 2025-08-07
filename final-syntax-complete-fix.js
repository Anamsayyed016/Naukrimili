const fs = require('fs');
const path = require('path') // More aggressive syntax error fixes
function fixAllSyntaxErrors(content, filePath) {
  let fixed = content;
  
}
  console.log(`Processing ${path.basename(filePath)}...`) // Fix 1: Remove all malformed semicolons after curly braces
  fixed = fixed.replace(/;\s*}/g, '\n}') // Fix 2: Fix broken object destructuring
  fixed = fixed.replace(/{\s*([^}]*?);\s*}/g, '{ $1 }') // Fix 3: Fix malformed function parameters
  fixed = fixed.replace(/\(\s*([^)]*?);\s*\)/g, '($1)') // Fix 4: Clean up malformed JSX attributes
  fixed = fixed.replace(/(\w+)=\{\s*([^}]*?);\s*}/g, '$1={$2}') // Fix 5: Fix broken array syntax
  fixed = fixed.replace(/\[\s*([^\]]*?);\s*\]/g, '[$1]') // Fix 6: Clean up malformed method calls  
  fixed = fixed.replace(/\.(\w+)\s*\(\s*([^)]*?);\s*\)/g, '.$1($2)') // Fix 7: Remove stray semicolons before operators
  fixed = fixed.replace(/;\s*([=+\-*/<>!&|])/g, ' $1') // Fix 8: Fix malformed template literals
  fixed = fixed.replace(/`([^`]*?);\s*`/g, '`$1`') // Fix 9: Fix broken ternary operators  
  fixed = fixed.replace(/\?\s*([^:]*?);\s*:/g, '? $1 :') // Fix 10: Clean up extra commas
  fixed = fixed.replace(/,\s*,+/g, ',') // Fix 11: Remove trailing semicolons in JSX
  fixed = fixed.replace(/;\s*>/g, '>');
  fixed = fixed.replace(/;\s*\/>/g, '/>') // Fix 12: Clean up broken imports
  fixed = fixed.replace(/from\s*['"][^'"]*?;\s*['"]/g, (match) => {
  return match.replace(/ /g, '');
}
  });
  
  return fixed
}

// Specific fixes for React components
function fixReactComponents(content) {
  let fixed = content // Fix React component syntax
  fixed = fixed.replace(/const\s+(\w+):\s*React\.FC\s*=\s*\(\)\s*=>\s*{\s* /g, 'const $1: React.FC = () => {') // Fix useState hooks
  fixed = fixed.replace(/useState<([^>]+)>\s*\(\s*([^)]*?);\s*\)/g, 'useState<$1>($2)') // Fix useEffect hooks
  fixed = fixed.replace(/useEffect\s*\(\s*\(\)\s*=>\s*{\s* /g, 'useEffect(() => {') // Fix event handlers
}
  fixed = fixed.replace(/onClick=\{\s*\(\)\s*=>\s*([^}]*?);\s*}/g, 'onClick={() => $1}');
  
  return fixed
}

// Apply fixes to all files
function processAllFiles() {
  const startDir = process.cwd();
  
  function processDirectory(dir) {
}
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
  const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        if (!['node_modules', '.next', '.git', 'dist', 'build', 'lib/generated'].includes(item.name)) {
          processDirectory(fullPath);
}
  }
      } else if (item.name.match(/\.(tsx?|jsx?)$/)) {
  try {
          let content = fs.readFileSync(fullPath, 'utf8');
          const original = content // Apply all fixes
          content = fixAllSyntaxErrors(content, fullPath);
          content = fixReactComponents(content) // Additional specific fixes
          if (fullPath.includes('components/') || fullPath.includes('app/')) {";
            content = content.replace(/;\s*from\s+['"`]/g, ' from \'');
}
            content = content.replace(/import\s*{\s*([^}]*?);\s*}\s*from/g, 'import { $1 } from');
  }
          
          if (content !== original) {
  fs.writeFileSync(fullPath, content, 'utf8');
}
            console.log(`✅ Fixed ${path.relative(startDir, fullPath)}`);
  }
        } catch (error) {
  
}
          console.error(`❌ Error processing ${fullPath}:`, error.message);
  }
      }
    }
  }
  
  processDirectory(startDir);
  }

console.log('🔧 Starting final comprehensive syntax fixes...\n');
processAllFiles() // Run a quick verification
console.log('\n🔍 Running verification...');
try {
  
}
  const { execSync } = require('child_process');
  execSync('npm run type-check', { cwd: process.cwd(), stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful!');
  } catch (error) {";
  console.log('⚠️  Some TypeScript errors may remain. Run "npm run type-check" to see details.');
}
  }

console.log('\n✨ Final syntax fix completed!');";
