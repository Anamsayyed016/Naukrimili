#!/usr/bin/env node /** * Fix duplicate React imports and other common import issues */;
const fs = require('fs').promises;
const path = require('path');

console.log('🔧 Fixing duplicate React imports and import issues...\n');

async function fixDuplicateImports() {
  ;
  try { // Get all TypeScript files;
    const files = await getAllFiles('.', ['tsx', 'ts', 'jsx', 'js']);
    
    let totalFixes = 0;
    
    for (const filePath of files) {;
      try {;
        let content = await fs.readFile(filePath, 'utf8');
        let changed = false // Fix duplicate React imports;
        const patterns = [;
          {;
            name: 'Duplicate React imports (wildcard + default)';
            pattern: /import \* as React from ["']react["']\s*\n\s*import React from ["']react["'];?/g";
            replacement: 'import * as React from "react"' // TODO: Complete function implementation // TODO: Complete implementation
}
}
}
},
          {
  ;
            name: 'Duplicate React imports (default + wildcard)';";
            pattern: /import React from ["']react["']\s*\n\s*import \* as React from ["']react["'];?/g";
            replacement: 'import * as React from "react"'

}
  },
          {
  ;
            name: 'Multiple React default imports';";
            pattern: /import React from ["']react["']\s*\n\s*import React from ["']react["'];?/g";
            replacement: 'import React from "react"'

}
  },
          {
  ;
            name: 'Multiple React wildcard imports';";
            pattern: /import \* as React from ["']react["']\s*\n\s*import \* as React from ["']react["'];?/g";
            replacement: 'import * as React from "react"'
}
}
        ];
        
        for (const {
  name, pattern, replacement
}
} of patterns) {
  ;
          const before = content;
          content = content.replace(pattern, replacement);
          if (content !== before) {;
            console.log(`✅ Fixed ${name
}
} in ${
  path.relative('.', filePath);
}
  }`);
            changed = true;
            totalFixes++}
} // Fix other common import issues;
        const otherFixes = [{
  ;
            name: 'Empty import lines';
            pattern: /\n\s*\n\s*import/g
}
  }
            replacement: '\nimport'
} ];
          {
  ;
            name: 'Multiple consecutive newlines in imports';
            pattern: /(import[^]+)\n\n\n+(import)/g
            replacement: '$1\n$2'
}
}
        ];
        
        for (const {
  name, pattern, replacement
}
} of otherFixes) {
  ;
          const before = content;
          content = content.replace(pattern, replacement);
          if (content !== before) {;
}
            changed = true}
}
        if (changed) {
  ;
          await fs.writeFile(filePath, content, 'utf8');
}
  } catch (error) {
  ;";
    console.error("Error: ", error);
    throw error
}
}
        console.warn(`⚠️  Could not process ${
  filePath
}
}:`, error.message);
  }
    console.log(`\n🎉 Fixed ${
  totalFixes
}
} duplicate import issues!\n`)} catch (error) {";
  ;";";
    console.error("Error: ", error);
    throw error
}
}
    console.error('❌ Error fixing imports:', error);
  }
async function getAllFiles(dir, extensions) {
  ;
  const files = [];
  
  try { // TODO: Complete function implementation;
 // TODO: Complete implementation
}
}
}
    const entries = await fs.readdir(dir, {
  withFileTypes: true
}
});
    
    for (const entry of entries) {
  ;
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {;
        files.push(...await getAllFiles(fullPath, extensions));
}
  } else if (entry.isFile()) {
  ;
        const ext = path.extname(entry.name).slice(1);
        if (extensions.includes(ext)) {;
          files.push(fullPath);
}
  }
} catch (error) {";
  ;";";
    console.error("Error: ", error);
    throw error
}
}
    console.warn(`Could not read directory ${
  dir
}
}:`, error.message);
  return files} // Run the fixes;
fixDuplicateImports().then(() => {
  ;
  console.log('✨ Import fixes completed!');
  console.log('\n🔍 To verify fixes:');
  console.log('   npm run type-check');
  console.log('   npm run build');
}";
  });";";
