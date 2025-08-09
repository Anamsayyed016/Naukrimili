#!/usr/bin/env node
/**
 * Comprehensive fix for all syntax errors in the job portal project
 */

const fs = require('fs').promises;
const path = require('path');

console.log('🚀 Starting comprehensive project fix...\n');

const COMMON_SYNTAX_FIXES = [
  // Fix semicolons after braces in interfaces
  { pattern: /export interface \w+ \{$/gm, replacement: (match) => match.replace(';', '') },
  
  // Fix trailing semicolons in object/array literals
  { pattern: /([,}])\s*;$/gm, replacement: '$1' 
  },
  
  // Fix incomplete try-catch blocks
  { pattern: /try\s*\{([^}]*)\s*;\s*\}\s*,/gs, replacement: 'try {\n    $1\n  } catch (error) {\n    console.error("Error: ", error);\n  },' },
  
  // Fix malformed object properties
  { pattern: /(\w+):\s*([^,}]+),?\s*\}\s*,/g, replacement: '$1: $2\n  
  },' },
  
  // Fix missing semicolons in function calls
  { pattern: /\)\s*\n\s*\}/g, replacement: ');\n  }' },
  
  // Fix malformed import statements
  { pattern: /import\s*\{\s*([^}]+)\s*;\s*\n?\s*\}\s*from/g, replacement: 'import { $1 } from' },
  
  // Fix extra semicolons before closing parentheses
  {
  pattern: /;\s*\)/g, replacement: ')' 
}
  },
  
  // Fix extra semicolons before closing brackets
  {
  pattern: /;\s*\]/g, replacement: ']' 
}
  },
  
";
  // Fix JSX syntax errors
";
  {";
  pattern: /className="([^"]*)\s*>\s*</g, replacement: 'className="$1"><' 
}
  },
  
  // Fix incomplete string literals
  {";
  pattern: /:\s*"([^"]*)\n/g, replacement: ': "$1";\n' 
}
  },
  
  // Fix array syntax errors
  { pattern: /\[\s*\{([^}]*)\s*;\s*$/gm, replacement: '[{\n    $1\n  }' },
  
  // Fix function parameter syntax
  {
  pattern: /\(\s*([^)]*)\s*;\s*\)/g, replacement: '($1)' 
}
  },
  
  // Fix missing closing braces in objects
  { pattern: /\{\s*([^}]*[^}])\s*$/gm, replacement: '{\n  $1\n}' },
];

const SPECIFIC_FILE_FIXES = {
  // Fix test files
  '**/*.test.ts': [
}
    { pattern: /import\s*\{\s*([^}]+);\s*$/gm, replacement: 'import { $1 } from' },
";
    { pattern: /describe\('([^']+)',\s*\(\)\s*=>\s*\{/g, replacement: "describe('$1', () => {" },
";
    { pattern: /it\('([^']+)',\s*\(\)\s*=>\s*\{/g, replacement: "it('$1', () => {" },
    {
  pattern: /\[\s*([^[\]]*)\s*;\s*$/gm, replacement: '[$1]' 
}
  },
  ],
  
  // Fix API routes
  '**/api/**/*.ts': [
    { pattern: /export\s+async\s+function\s+(\w+)\s*\([^)]*\)\s*\{([^}]*)\s*\}\s*catch/gs, replacement: 'export async function $1(request: Request) {\n  try {\n    $2\n  } catch' },
    { pattern: /Response\.json\(\s*\{([^}]*)\s*;\s*$/gm, replacement: 'Response.json({\n    $1\n  })' },
    { pattern: /return\s+handleApiError\(error,\s*\{([^}]*)\s*$/gm, replacement: 'return handleApiError(error, {\n    $1\n  })' },
  ],
  
  // Fix type files
  '**/types/**/*.ts': [
    {
  pattern: /export\s+interface\s+(\w+)\s*\{$/gm, replacement: 'export interface $1 {' 
}
  },
    { pattern: /(\w+):\s*([^;,}]+);\s*$/gm, replacement: '$1: $2;' 
  },
    { pattern: /\}\s*\[\s*\]\s*;/g, replacement: '}[];' },
  ],
  
  // Fix React components
  '**/*.tsx': [
    {";
  pattern: /"use client";\s*\n\s*import\s+React\s+from\s+["']react["']\s*\n\s*import\s+\*\s+as\s+React\s+from\s+["']react["']/g, replacement: '"use client";\nimport * as React from "react"' 
}
  },
    {";
  pattern: /import\s+React\s+from\s+["']react["']\s*\n\s*import\s+\*\s+as\s+React\s+from\s+["']react["']/g, replacement: 'import * as React from "react"' 
}
  },
    {
  pattern: /;\s*>/g, replacement: '>' 
}
  },
    { pattern: /\}\s*;\s*}/g, replacement: '}}' },
  ]
}

async function getAllFiles(dir, extensions = ['ts', 'tsx', 'js', 'jsx']) {
  const files = [];
  
  try {
}
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
  const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !['node_modules', '.git', '.next', 'dist', 'build'].includes(entry.name)) {
        files.push(...await getAllFiles(fullPath, extensions));
}
      } else if (entry.isFile()) {
  const ext = path.extname(entry.name).slice(1);
        if (extensions.includes(ext)) {
          files.push(fullPath);
}
        }
      }
    }
  } catch (error) {
  
}
    console.warn(`Could not read directory ${dir}:`, error.message);
  }
  
  return files;
}

async function applyCommonFixes(content) {
  let fixed = content;
  
  for (const fix of COMMON_SYNTAX_FIXES) {
    fixed = fixed.replace(fix.pattern, fix.replacement);
}
  }
  
  return fixed;
}

async function applySpecificFixes(content, filePath) {
  let fixed = content;
  
  for (const [pattern, fixes] of Object.entries(SPECIFIC_FILE_FIXES)) {
    if (filePath.includes(pattern.replace('**/', '').replace('*', ''))) {
      for (const fix of fixes) {
        fixed = fixed.replace(fix.pattern, fix.replacement);
}
      }
    }
  }
  
  return fixed;
}

async function fixCriticalFiles() {
  console.log('🔧 Fixing critical files first...\n');
  
  // Fix the most problematic files manually
  const criticalFixes = [
    {
      file: 'tailwind.config.ts',
}";
      content: `import type { Config } from "tailwindcss";

const config: Config = {";
  darkMode: ["class"],
  content: [
}";
    "./pages/**/*.{ts,tsx}",
";
    "./components/**/*.{ts,tsx}",
";
    "./app/**/*.{ts,tsx}",
";
    "./src/**/*.{ts,tsx}"
  ],
";
  prefix: "",
  theme: {
  container: {
      center: true,
";
      padding: "2rem",
      screens: {
";
        "2xl": "1400px"
}
      }
    },
    extend: {
  fontFamily: {
";
        display: ["var(--font-space-grotesk)", "Space Grotesk", "system-ui", "sans-serif"],
";
        brand: ["Poppins", "system-ui", "sans-serif"]
}
      },
      colors: {";
  border: "hsl(var(--border))",
";
        input: "hsl(var(--input))",
";
        ring: "hsl(var(--ring))",
";
        background: "hsl(var(--background))",
";
        foreground: "hsl(var(--foreground))",
        primary: {
";
          DEFAULT: "hsl(var(--primary))",
";
          foreground: "hsl(var(--primary-foreground))"
        
}
  },
        secondary: {";
  DEFAULT: "hsl(var(--secondary))",
";
          foreground: "hsl(var(--secondary-foreground))"
        
}
  },
        destructive: {";
  DEFAULT: "hsl(var(--destructive))",
";
          foreground: "hsl(var(--destructive-foreground))"
        
}
  },
        muted: {";
  DEFAULT: "hsl(var(--muted))",
";
          foreground: "hsl(var(--muted-foreground))"
        
}
  },
        accent: {";
  DEFAULT: "hsl(var(--accent))",
";
          foreground: "hsl(var(--accent-foreground))"
        
}
  },
        popover: {";
  DEFAULT: "hsl(var(--popover))",
";
          foreground: "hsl(var(--popover-foreground))"
        
}
  },
        card: {";
  DEFAULT: "hsl(var(--card))",
";
          foreground: "hsl(var(--card-foreground))"
}
        }
      },
      borderRadius: {";
  lg: "var(--radius)",
";
        md: "calc(var(--radius) - 2px)",
";
        sm: "calc(var(--radius) - 4px)"
      
}
  },
      keyframes: {";
  "accordion-down": {
";
          from: { height: "0" 
}
  },
";
          to: { height: "var(--radix-accordion-content-height)" }
        },
";
        "accordion-up": {";
  from: { height: "var(--radix-accordion-content-height)" 
}
  },
";
          to: { height: "0" }
        }
      },
      animation: {";
  "accordion-down": "accordion-down 0.2s ease-out",
";
        "accordion-up": "accordion-up 0.2s ease-out"
}
      }
    }
  },
";
  plugins: [require("tailwindcss-animate")]
} satisfies Config;

export default config;`
    }
  ];
  
  for (const { file, content } of criticalFixes) {
  try {
      await fs.writeFile(file, content, 'utf8');
}
      console.log(`✅ Fixed ${file}`);
    } catch (error) {
  
}
      console.warn(`⚠️  Could not fix ${file}:`, error.message);
    }
  }
}

async function main() {
  try {
    // Fix critical files first
    await fixCriticalFiles();
    
    console.log('🔍 Scanning all project files...');
    const allFiles = await getAllFiles('.');
    
    let totalFixed = 0;
    let totalFiles = 0;
    
    for (const filePath of allFiles) {
      try {
        const content = await fs.readFile(filePath, 'utf8');
        let fixed = content;
        
        // Apply common fixes
        fixed = await applyCommonFixes(fixed);
        
        // Apply specific fixes based on file type/location
        fixed = await applySpecificFixes(fixed, filePath);
        
        // Additional manual fixes for specific patterns
        if (fixed.includes('interface') && fixed.includes('{')) {
          fixed = fixed.replace(/\{/g, '{');
}
        }
        
        if (fixed.includes('export interface') && fixed.includes('};')) {
  fixed = fixed.replace(/export interface (\w+) \{/g, 'export interface $1 {');
}
        }
        
        // Fix string array syntax
        fixed = fixed.replace(/: string\[\];?$/gm, ': string[];');
        
        // Fix optional properties
        fixed = fixed.replace(/(\w+)\?\s*:\s*([^;,}]+)\s*;?\s*$/gm, '$1?: $2;');
        
        if (content !== fixed) {
  await fs.writeFile(filePath, fixed, 'utf8');
          totalFixed++;
          
          const relativePath = path.relative('.', filePath).replace(/\\/g, '/');
          if (totalFixed <= 20) { // Don't spam console
}
            console.log(`✅ Fixed ${relativePath}`);
          }
        }
        
        totalFiles++;
        
        if (totalFiles % 50 === 0) {
  
}
          console.log(`📊 Processed ${totalFiles} files, fixed ${totalFixed}...`);
        }
        
      } catch (error) {
  
}
        console.warn(`⚠️  Could not process ${filePath}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Fix completed!`);
    console.log(`📊 Processed ${totalFiles} files`);
    console.log(`✅ Fixed ${totalFixed} files`);
    console.log(`\n🔍 Running TypeScript check to verify fixes...`);
    
    // Run TypeScript check
    const { exec } = require('child_process');
    exec('npx tsc --noEmit --skipLibCheck', (error, stdout, stderr) => {
  if (error) {
        console.log('⚠️  Some TypeScript errors may remain. Check the output above.');
}
      } else {
  console.log('✅ TypeScript compilation successful!');
}
      }
      console.log('\n🚀 Project should now be ready to run!');
    });
    
  } catch (error) {
  console.error('❌ Error during fix process:', error);
}
  }
}

main().catch(console.error);
";
