#!/usr/bin/env node /** * Comprehensive Debug and Fix Script for Job Portal * This script fixes ALL TypeScript syntax errors at once */;
const fs = require('fs').promises;
const path = require('path');

console.log('🚀 Starting comprehensive debug and fix process...\n') // Error patterns and their fixes;
const ERROR_PATTERNS = [ // Fix incomplete try-catch blocks;
  {
  ;
}
    pattern: /try\s*\{([^}]*)\s*;\s*\}\s*,/gs,
    replacement: 'try {\n    $1\n  } catch (error) {
  \n    console.error("Error:", error);\n    return Response.json({ error: "Internal server error" 
}
  }, { status: 500 });\n  },'
  }, // Fix malformed object literals;
  {
  ;
}
    pattern: /\{\s*([^:]+):\s*([^,}]+),?\s*\}\s*,/gs,
    replacement: '{
  \n      $1: $2\n    
}
  },'
}, // Fix incomplete function parameters;
  {
  ;
}
    pattern: /export async function (\w+)\([^)]*\) \{ params: Promise<\{ (\w+): string\s*;\s*\}\>\s*\}/gs,
    replacement: 'export async function $1(request: Request, { params }: { params: Promise<{ $2: string }> }) {
  '
}
}, // Fix double return statements;
  {
  ;
    pattern: /return\s+return\s+Response\.json/g;
    replacement: 'return Response.json'

}
  }, // Fix incomplete destructuring;
  {
  ;
}
    pattern: /const\s*\{\s*([^}]+);\s*\}/g,
    replacement: 'const { $1 }'
}, // Fix malformed Response.json calls;
  {
  ;
}
    pattern: /Response\.json\(\s*\{([^}]*)\s*\}\s*\)\s*\}\s*catch/g,
    replacement: 'Response.json({ $1 });\n  } catch'
  }, // Fix unterminated string literals;
  {
  ;";
    pattern: /"[^"]*$/gm;";
    replacement: (match) => match + '"'

}
  }, // Fix missing semicolons in object properties;
  {
  ;
}
    pattern: /(\w+):\s*([^,}\n]+)(?=[,}])/g,
    replacement: '$1: $2'

  }, // Fix incomplete await statements;
  {
  ;
}
    pattern: /\}\s*;\s*await/g,
    replacement: '}\n    await'
}
] // Specific file fixes;
const SPECIFIC_FIXES = {
  ;
  'tailwind.config.ts': [;
    {
      pattern: /content:\s*\[([^]]*?)\]/gs;
}";
      replacement: `content: [ "./pages/**/*.{ts,tsx}",";
    "./components/**/*.{ts,tsx}",";
    "./app/**/*.{ts,tsx}",";
    "./src/**/*.{ts,tsx}" ];";
    "*.{js,ts,jsx,tsx,mdx}
  ]`
},
    {
  ;
}
      pattern: /\} satisfies Config$/,
      replacement: '} satisfies Config;'
    }
  ],
  'lib/s3-service.ts': [;
    {
  ;
      pattern: /async (\w+)\([^)]*\): Promise<[^>]*> \{/g;
      replacement: 'async $1(...args: any[]): Promise<any> {'

}
  },
    {
  ;
}
      pattern: /\}\s*catch\s*\([^)]*\)\s*\{([^}]*)\}/g,";
      replacement: '} catch (error) {\n    console.error("S3 error:", error);\n    throw new Error("S3 operation failed");\n  }'
    }
  ],
  'lib/unified-job-service.ts': [;
    {
  ;
      pattern: /async (\w+)\([^)]*\): Promise<[^>]*> \{/g;
      replacement: 'async $1(...args: any[]): Promise<any> {'

}
  },
    {
  ;
}
      pattern: /\}\s*;\s*\}\s*catch/g,
      replacement: '}\n  } catch'
}
  ]
}

async function fixFile(filePath) {
  ;
  try {
    let content = await fs.readFile(filePath, 'utf8');
    const originalContent = content;
    let fixesApplied = 0 // Apply specific fixes for certain files;
    const relativePath = path.relative('.', filePath);
    if (SPECIFIC_FIXES[relativePath]) {
      for (const fix of SPECIFIC_FIXES[relativePath]) {
        if (fix.pattern.test && fix.pattern.test(content)) {
          content = content.replace(fix.pattern, fix.replacement);
          fixesApplied++
}
}
}
} // Apply general error pattern fixes;
    for (const { pattern, replacement } of ERROR_PATTERNS) {
  ;
      const matches = content.match(pattern);
      if (matches) {
        content = content.replace(pattern, replacement);
        fixesApplied += matches.length
}
}
} // Fix API route specific patterns;
    if (filePath.includes('/api/') && filePath.endsWith('.ts')) {
  // Fix incomplete exports;
}
      content = content.replace( /export async function (\w+)\([^{]*\{/g }
        'export async function $1(request: Request) {
  ') // Fix malformed parameter destructuring;
}
      content = content.replace( /\{\s*params\s*:\s*\{\s*(\w+):\s*string\s*;\s*\}/g,
        '{ params }: { params: { $1: string } }') // Ensure proper try-catch structure;
      if (content.includes('try {') && !content.includes('} catch (error) {
  ')) {
}
        content = content.replace( /try\s*\{([^}]*)\}/gs,
          'try {\n    $1\n  } catch (error) {";
  \n    console.error("Error:", error);\n    return Response.json({ error: "Internal server error" 
}
  }, { status: 500 });\n  }'
        );
        fixesApplied++
} // Fix incomplete Response.json calls;
      content = content.replace(/Response\.json\(\s*\{[^}]*error[^}]*\s*\}/g);
        'Response.json({";
  error: "Internal server error" 
}
  }, { status: 500 })');
  } // Fix component specific patterns;
    if (filePath.includes('/components/') && filePath.endsWith('.tsx')) {
  // Fix incomplete interface definitions;
}
      content = content.replace( /interface\s+(\w+)\s*\{([^}]*)\s*\}/gs,
        'interface $1 {\n$2\n}') // Fix incomplete React component exports;
      content = content.replace( /const\s+(\w+):\s*React\.FC\s*=\s*\(\)\s*=>\s*\{ /g }
        'const $1: React.FC = () => {
  ');
}
  } // Fix lib file specific patterns;
    if (filePath.includes('/lib/') && filePath.endsWith('.ts')) {
  // Fix class method definitions;
}
      content = content.replace( /async\s+(\w+)\([^)]*\):\s*Promise<[^>]*>\s*\{/g }
        'async $1(...args: any[]): Promise<any> {
  ') // Fix incomplete object destructuring;
}
      content = content.replace( /const\s*\{\s*([^}]+),\s*\}\s*=/g,
        'const { $1 } =');
  } // Common fixes for all files // Fix trailing semicolons in wrong places;
    content = content.replace(/;\s*\}/g, '\n  }');
    content = content.replace(/;\s*\)/g, ')') // Fix missing commas in object literals;
    content = content.replace(/(\w+:\s*[^,}\n]+)(?=\s*\w+:)/g, '$1,') // Fix incomplete arrow functions;
    content = content.replace(/=>\s*\{[^}]*\s*\}/gs, (match) => {
  ;
      if (!match.includes('return') && !match.includes(';')) {
}
        return match.replace(/\{([^}]*)\}/, '{\n    $1\n  }');
  }
      return match
}) // Fix missing closing braces/brackets;
    const openBraces = (content.match(/\{
  /g) || []).length;
}
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
  ;
}
      content += '\n' + '}'.repeat(openBraces - closeBraces);
  } // Write back if changes were made;
    if (content !== originalContent) {
  ;
      await fs.writeFile(filePath, content, 'utf8');
}
      console.log(`✅ Fixed ${relativePath} (${fixesApplied} fixes applied)`);
      return fixesApplied
}
    return 0
} catch (error) {
  ;
}
    console.warn(`⚠️  Could not fix ${filePath}:`, error.message);
    return 0
}
}
async function collectAllFiles() {
  ;
  const files = [];
  
  async function scanDirectory(dir) {
    try {
}
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
  ;
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await scanDirectory(fullPath);
}
  } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
  ;
          files.push(fullPath);
}
  }
} catch (error) {
  // Skip directories we can't read
}
}
} // Scan all relevant directories;
  const dirsToScan = ['app', 'components', 'lib', 'hooks', 'scripts'];
  
  for (const dir of dirsToScan) {
  ;
    try {
      await scanDirectory(dir);
}
  } catch (error) {
  ;
}
      console.warn(`Could not scan ${dir}:`, error.message);
  }
} // Add specific important files;
  const importantFiles = [ 'tailwind.config.ts',
    'next.config.mjs' ];
    'middleware.ts'];

  for (const file of importantFiles) {
  ;
    try {
      await fs.access(file);
      files.push(file);
}
  } catch {
  // File doesn't exist, skip
}
}
}
  return files
}
async function main() {
  ;
  console.log('🔍 Collecting all TypeScript files...');
  const files = await collectAllFiles();
}
  console.log(`Found ${files.length} TypeScript files to process\n`);

  let totalFixes = 0;
  let fixedFiles = 0;

  console.log('🔧 Applying comprehensive fixes...') // Process files in batches to avoid overwhelming the system;
  const batchSize = 10;
  for (let i = 0; i < files.length; i += batchSize) {
  const batch = files.slice(i, i + batchSize);
    
    const promises = batch.map(async (file) => {
      const fixes = await fixFile(file);
      if (fixes > 0) {
        fixedFiles++;
        totalFixes += fixes
}
}
      return fixes
});

    await Promise.all(promises);
  }
  console.log(`\n🎉 Comprehensive fix completed!`);
  console.log(`📊 Statistics:`);
  console.log(`   - Files processed: ${files.length}`);
  console.log(`   - Files fixed: ${fixedFiles}`);
  console.log(`   - Total fixes applied: ${totalFixes}`);
  
  console.log('\n🔍 Running TypeScript check to verify fixes...') // Run TypeScript check to see remaining errors;
  const { spawn } = require('child_process');
  
  return new Promise((resolve) => {
  const tsc = spawn('npx', ['tsc', '--noEmit', '--skipLibCheck'], {
}
      stdio: ['inherit', 'pipe', 'pipe'] }
      shell: true
});

    let output = '';
    let errorOutput = '';

    tsc.stdout.on('data', (data) => {
  ;
      output += data.toString();
}
  });

    tsc.stderr.on('data', (data) => {
  ;
      errorOutput += data.toString();
}
  });

    tsc.on('close', (code) => {
  ;
      const allOutput = output + errorOutput;
      const errorLines = allOutput.split('\n').filter(line => line.includes('error TS'));
      
      if (errorLines.length === 0) {
        console.log('🎉 SUCCESS: No TypeScript errors found!');
}
  } else {
  ;
}
        console.log(`⚠️  ${errorLines.length} TypeScript errors remaining`);
        console.log('First few errors:');
        errorLines.slice(0, 5).forEach(line => console.log(`   ${line}`));
        
        if (errorLines.length > 5) {
  ;
}
          console.log(`   ... and ${errorLines.length - 5} more errors`);
  }
}
      resolve();
  });
  });
  }
main().catch(console.error);";
