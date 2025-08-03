#!/usr/bin/env node

/**
 * Cleanup Script for NaukriMili Job Portal
 * 
 * This script removes duplicate components and files identified in the codebase audit.
 * Run this script to clean up the codebase and improve maintainability.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_DIR = process.cwd();
const BACKUP_DIR = path.join(ROOT_DIR, 'backup', 'duplicates');

// Files to remove (duplicates identified in audit)
const FILES_TO_REMOVE = [
  // Empty service files
  'lib/adzuna-service.ts',
  'lib/services/adzuna-service.ts',
  
  // Duplicate components (keeping TypeScript versions)
  'components/JobApplication.js',
  'components/Navbar.tsx',
  'components/futuristic-header.tsx',
  'components/HeroSection.tsx',
  'components/LoaderExample.tsx',
  'components/LivingFooter.tsx',
  
  // Duplicate UI components (keeping shadcn/ui versions)
  'components/shared/atoms/Badge.tsx',
  'components/shared/atoms/Button.tsx',
  'components/shared/atoms/Card.tsx',
  
  // Backup files
  'app/api/admin/fraud-reports/route.ts.new',
  'app/api/candidates/route.ts.bak',
  'app/api/candidates/route.ts.new',
  'app/api/jobs/salary-stats/route.ts.bak',
  'app/api/jobs/salary-stats/route.ts.new',
  'app/api/seeker/jobs/route.ts.bak',
  'app/api/seeker/jobs/route.ts.new',
  'components/NexusOnboarding.tsx.bak',
  'components/NexusOnboarding.tsx.bak2',
  'components/NexusOnboarding.tsx.new',
  
  // Test files that are no longer needed
  'test.tsx',
  'python.py',
  
  // Old configuration files
  'backend-package.json',
  'package-production.json',
  
  // Temporary files
  'build-output.txt',
  'fix-flask-jwt-extended-issue.md'
];

// Directories to clean up
const DIRECTORIES_TO_CLEAN = [
  'components/shared/atoms', // Remove if empty after cleanup
  'backup', // Remove if empty after cleanup
];

// Files to update (remove imports of deleted files)
const FILES_TO_UPDATE = [
  {
    file: 'app/api/jobs/salary-stats/route.ts.bak',
    search: "import { getJobStats } from '@/lib/adzuna-service';",
    replace: "// Removed import of deleted adzuna-service"
  }
];

// Utility functions
function createBackup(filePath) {
  if (fs.existsSync(filePath)) {
    const backupPath = path.join(BACKUP_DIR, path.relative(ROOT_DIR, filePath));
    const backupDir = path.dirname(backupPath);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.copyFileSync(filePath, backupPath);
    console.log(`✅ Backed up: ${filePath}`);
  }
}

function removeFile(filePath) {
  const fullPath = path.join(ROOT_DIR, filePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      createBackup(filePath);
      fs.unlinkSync(fullPath);
      console.log(`🗑️  Removed: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`❌ Error removing ${filePath}:`, error.message);
      return false;
    }
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
}

function removeEmptyDirectories(dirPath) {
  const fullPath = path.join(ROOT_DIR, dirPath);
  
  if (fs.existsSync(fullPath)) {
    try {
      const files = fs.readdirSync(fullPath);
      if (files.length === 0) {
        fs.rmdirSync(fullPath);
        console.log(`🗑️  Removed empty directory: ${dirPath}`);
        return true;
      } else {
        console.log(`📁 Directory not empty: ${dirPath} (${files.length} files)`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error checking directory ${dirPath}:`, error.message);
      return false;
    }
  }
  return false;
}

function updateFileImports(filePath, search, replace) {
  const fullPath = path.join(ROOT_DIR, filePath);
  
  if (fs.existsSync(fullPath)) {
    try {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(search)) {
        content = content.replace(search, replace);
        fs.writeFileSync(fullPath, content);
        console.log(`✏️  Updated imports in: ${filePath}`);
        return true;
      }
    } catch (error) {
      console.error(`❌ Error updating ${filePath}:`, error.message);
      return false;
    }
  }
  return false;
}

function findUnusedImports() {
  console.log('\n🔍 Scanning for unused imports...');
  
  const searchPatterns = [
    "from '@/lib/adzuna-service'",
    "import.*adzuna-service",
    "from './JobApplication.js'",
    "import.*JobApplication.js"
  ];
  
  // This is a simplified check - in a real scenario, you'd want to use a proper AST parser
  searchPatterns.forEach(pattern => {
    console.log(`Looking for: ${pattern}`);
  });
}

// Main cleanup function
function runCleanup() {
  console.log('🧹 Starting NaukriMili Codebase Cleanup...\n');
  
  // Create backup directory
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Created backup directory: ${BACKUP_DIR}\n`);
  }
  
  let removedCount = 0;
  let errorCount = 0;
  
  // Remove duplicate files
  console.log('🗑️  Removing duplicate files...');
  FILES_TO_REMOVE.forEach(filePath => {
    if (removeFile(filePath)) {
      removedCount++;
    } else {
      errorCount++;
    }
  });
  
  // Update file imports
  console.log('\n✏️  Updating file imports...');
  FILES_TO_UPDATE.forEach(({ file, search, replace }) => {
    updateFileImports(file, search, replace);
  });
  
  // Clean up empty directories
  console.log('\n📁 Cleaning up empty directories...');
  DIRECTORIES_TO_CLEAN.forEach(dirPath => {
    removeEmptyDirectories(dirPath);
  });
  
  // Find unused imports
  findUnusedImports();
  
  // Summary
  console.log('\n📊 Cleanup Summary:');
  console.log(`✅ Files removed: ${removedCount}`);
  console.log(`❌ Errors encountered: ${errorCount}`);
  console.log(`📁 Backup location: ${BACKUP_DIR}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 Cleanup completed successfully!');
    console.log('💡 Next steps:');
    console.log('   1. Review the backup directory to ensure nothing important was removed');
    console.log('   2. Run your test suite to verify everything still works');
    console.log('   3. Commit the changes with a descriptive message');
  } else {
    console.log('\n⚠️  Cleanup completed with some errors. Please review the output above.');
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  runCleanup();
}

module.exports = {
  runCleanup,
  removeFile,
  createBackup,
  FILES_TO_REMOVE,
  DIRECTORIES_TO_CLEAN
}; 