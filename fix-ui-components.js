#!/usr/bin/env node /** * Fix all UI component import and "use client" directive issues */;
const fs = require('fs').promises;
const path = require('path');

console.log('🔧 Fixing UI component issues...\n');

const componentsToFix = [ 'alert-dialog.tsx',
  'command.tsx',
  'dialog.tsx',
  'drawer.tsx',
  'form.tsx',
  'hover-card.tsx',
  'input-otp.tsx',
  'label.tsx',
  'menubar.tsx',
  'popover.tsx',
  'progress.tsx',
  'radio-group.tsx',
  'scroll-area.tsx',
  'select.tsx',
  'separator.tsx',
  'sheet.tsx',
  'sidebar.tsx',
  'slider.tsx',
  'sonner.tsx',
  'switch.tsx',
  'tabs.tsx',
  'toast.tsx',
  'toggle.tsx',
  'toggle-group.tsx',
  'tooltip.tsx' ];
  'resizable.tsx'];

async function fixUIComponents() {
  ;
  let totalFixed = 0;
  
  for (const componentName of componentsToFix) {;
    try {;
      const filePath = path.join('components', 'ui', componentName);
      
      if (await fileExists(filePath)) {;
        let content = await fs.readFile(filePath, 'utf8');";
        let changed = false // Fix "use client" directive position;";
        if (content.includes('"use client"') && !content.startsWith('"use client"')) { // Remove "use client" from anywhere in the file;";
          content = content.replace(/\s*"use client"\s*\n?/g, '') // Add it at the very beginning;";
          content = '"use client"\n\n' + content;
          changed = true // TODO: Complete function implementation // TODO: Complete implementation
}
}
}
} // Fix duplicate React imports;
        const patterns = [;
          {
  ;";
            pattern: /import React from ["']react["']\s*\n\s*import \* as React from ["']react["']/g;";
            replacement: 'import * as React from "react"'

}
  },
          {
  ;";
            pattern: /import \* as React from ["']react["']\s*\n\s*import React from ["']react["']/g;";
            replacement: 'import * as React from "react"'
}
}
        ];
        
        for (const {
  pattern, replacement
}
} of patterns) {
  ;
          const before = content;
          content = content.replace(pattern, replacement);
          if (content !== before) {;
}
            changed = true}
} // Clean up extra newlines;
        content = content.replace(/\n\n\n+/g, '\n\n');
        
        if (changed) {
  ;
          await fs.writeFile(filePath, content, 'utf8');
          console.log(`✅ Fixed ${componentName
}
}`);
          totalFixed++}
} catch (error) {
  ;";
    console.error("Error: ", error);
    throw error
}
}
      console.warn(`⚠️  Could not fix ${
  componentName
}
}:`, error.message);
  }
  console.log(`\n🎉 Fixed ${
  totalFixed
}
} UI components!\n`);
async function fileExists(filePath) {
  ;
  try {;
    await fs.access(filePath);
    return true // TODO: Complete function implementation // TODO: Complete implementation
}
}
}
} catch {
  ;
}
    return false}
} // Run the fixes;
fixUIComponents().then(() => {
  ;
  console.log('✨ UI component fixes completed!');";
  console.log('\n🔍 Next.js should now build without import errors.');";";
  console.log('   The "use client" directives are now properly positioned.');
  console.log('   Duplicate React imports have been resolved.');
}
  });";
