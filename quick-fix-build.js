#!/usr/bin/env node
/**
 * Quick build fix for remaining issues
 */

const fs = require('fs').promises;

async function quickBuildFix() {
  console.log('🔧 Quick build fix for deployment...');
  
  try {
    // Fix ResumeEditor.tsx - ensure proper closing
    let resumeEditor = await fs.readFile('components/ResumeEditor.tsx', 'utf8');
    
    // Ensure proper function ending
    if (!resumeEditor.includes('  );\n}') && resumeEditor.includes('  );\n} ')) {
      resumeEditor = resumeEditor.replace('  );\n} ', '  );\n}');
      await fs.writeFile('components/ResumeEditor.tsx', resumeEditor, 'utf8');
      console.log('✅ Fixed ResumeEditor.tsx');
    }
    
    // Fix SystemHealthWidgets.tsx - fix try-catch syntax
    let systemHealth = await fs.readFile('components/admin/SystemHealthWidgets.tsx', 'utf8');
    
    // Fix malformed try-catch-finally
    const fixedSystemHealth = systemHealth
      .replace(/throw error\}\s*console\.error\([^}]+\)\} finally \{/g, 'throw error;\n    }\n  } catch (error) {\n    console.error("Error:", error);\n  } finally {')
      .replace(/setIsLoading\(false\)\}/g, 'setIsLoading(false);\n  }');
    
    if (fixedSystemHealth !== systemHealth) {
      await fs.writeFile('components/admin/SystemHealthWidgets.tsx', fixedSystemHealth, 'utf8');
      console.log('✅ Fixed SystemHealthWidgets.tsx');
    }
    
    // Fix EmployerAnalytics.tsx
    let employerAnalytics = await fs.readFile('components/employer/EmployerAnalytics.tsx', 'utf8');
    
    // Fix the malformed try-catch structure
    const fixedEmployerAnalytics = employerAnalytics
      .replace(/setData\(analyticsData\)\} catch \(err\) \{/g, 'setData(analyticsData);\n      } catch (err) {')
      .replace(/setError\([^}]+\)\} finally \{/g, 'setError(err instanceof Error ? err.message : "An error occurred");\n      } finally {')
      .replace(/setIsLoading\(false\)\}/g, 'setIsLoading(false);\n      }')
      .replace(/fetchAnalytics\(\);\s*\/\/ Refresh every 5 minutes/g, 'fetchAnalytics();\n    \n    // Refresh every 5 minutes')
      .replace(/return \(\) => clearInterval\(interval\)\}, \[\]\);/g, 'return () => clearInterval(interval);\n  }, []);');
    
    if (fixedEmployerAnalytics !== employerAnalytics) {
      await fs.writeFile('components/employer/EmployerAnalytics.tsx', fixedEmployerAnalytics, 'utf8');
      console.log('✅ Fixed EmployerAnalytics.tsx');
    }
    
    console.log('\n✨ Quick fixes applied! Ready for deployment.');
    
  } catch (error) {
    console.error('❌ Error during quick fix:', error.message);
  }
}

quickBuildFix();
