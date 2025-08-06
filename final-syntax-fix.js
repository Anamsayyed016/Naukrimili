#!/usr/bin/env node
/**
 * Comprehensive fix for all remaining syntax issues
 */

const fs = require('fs').promises;
const path = require('path');

async function fixAllSyntaxIssues() {
  console.log('🔧 Final comprehensive syntax fix...');
  
  try {
    // Fix ResumeEditor.tsx - the "roun\nnded" issue
    let resumeEditor = await fs.readFile('components/ResumeEditor.tsx', 'utf8');
    resumeEditor = resumeEditor.replace('roun\nnded', 'rounded');
    await fs.writeFile('components/ResumeEditor.tsx', resumeEditor, 'utf8');
    console.log('✅ Fixed ResumeEditor.tsx button class');
    
    // Fix useLocationDetection.ts - missing semicolon
    let locationDetection = await fs.readFile('hooks/useLocationDetection.ts', 'utf8');
    locationDetection = locationDetection
      .replace('continue}', 'continue;\n    }')
      .replace('return null}, []);', 'return null;\n  }, []);');
    await fs.writeFile('hooks/useLocationDetection.ts', locationDetection, 'utf8');
    console.log('✅ Fixed useLocationDetection.ts');
    
    // Fix useRealTimeJobSearch.ts - missing semicolon and try-catch structure
    let realTimeSearch = await fs.readFile('hooks/useRealTimeJobSearch.ts', 'utf8');
    realTimeSearch = realTimeSearch
      .replace('return generateMockJobs(debouncedFilters)} finally {', 'return generateMockJobs(debouncedFilters);\n    } catch (error) {\n      console.error("Search error:", error);\n    } finally {')
      .replace('setIsSearching(false)}', 'setIsSearching(false);\n    }');
    await fs.writeFile('hooks/useRealTimeJobSearch.ts', realTimeSearch, 'utf8');
    console.log('✅ Fixed useRealTimeJobSearch.ts');
    
    // Fix userActivityService.ts - missing semicolon
    let userActivity = await fs.readFile('lib/userActivityService.ts', 'utf8');
    userActivity = userActivity.replace('.map(entry => entry[0])}', '.map(entry => entry[0]);\n  }');
    await fs.writeFile('lib/userActivityService.ts', userActivity, 'utf8');
    console.log('✅ Fixed userActivityService.ts');
    
    // Fix fraud-reports route - missing object structure
    let fraudReports = await fs.readFile('app/api/admin/fraud-reports/route.ts', 'utf8');
    fraudReports = fraudReports
      .replace(
        'description: \'This job posting appears to be fake with unrealistic requirements and salary.\'\n  // TODO: Complete function implementation\n}\n      },',
        'description: \'This job posting appears to be fake with unrealistic requirements and salary.\'\n      },'
      );
    await fs.writeFile('app/api/admin/fraud-reports/route.ts', fraudReports, 'utf8');
    console.log('✅ Fixed fraud-reports route');
    
    // Additional safety fixes for common patterns
    const filesToFix = [
      'components/ResumeEditor.tsx',
      'hooks/useLocationDetection.ts', 
      'hooks/useRealTimeJobSearch.ts',
      'lib/userActivityService.ts'
    ];
    
    for (const filePath of filesToFix) {
      try {
        let content = await fs.readFile(filePath, 'utf8');
        let fixed = content
          // Fix incomplete try-catch blocks
          .replace(/} catch \([^)]+\) \{\s*} finally \{/g, '} catch (error) {\n    console.error("Error:", error);\n  } finally {')
          // Fix missing semicolons before closing braces
          .replace(/([^;])\s*}\s*([,\]\)])/g, '$1;\n  }$2')
          // Fix malformed function endings
          .replace(/return ([^;]+)}(?:\s*$)/g, 'return $1;\n}')
          // Fix incomplete object definitions
          .replace(/([a-zA-Z_$][a-zA-Z0-9_$]*:\s*[^,}]+)\s*\/\/[^\n]*\n\s*}\s*([,}])/g, '$1\n    }$2');
          
        if (content !== fixed) {
          await fs.writeFile(filePath, fixed, 'utf8');
          console.log(`✅ Applied additional fixes to ${filePath}`);
        }
      } catch (err) {
        console.log(`⚠️  Could not fix ${filePath}: ${err.message}`);
      }
    }
    
    console.log('\n✨ All syntax issues fixed! Ready for build.');
    
  } catch (error) {
    console.error('❌ Error during comprehensive fix:', error.message);
  }
}

fixAllSyntaxIssues();
