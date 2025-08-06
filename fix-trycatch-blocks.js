#!/usr/bin/env node
/**
 * Fix malformed try-catch-finally blocks and related syntax issues
 */

const fs = require('fs').promises;
const path = require('path');

console.log('🔧 Fixing malformed try-catch-finally blocks...\n');

async function fixTryCatchBlocks() {
  const targetFiles = [
    'components/UnifiedJobPortal.tsx',
    'components/admin/JobVerificationQueue.tsx',
    'components/admin/SystemHealthWidgets.tsx',
    'components/admin/UserModerationTable.tsx'
  ];

  for (const filePath of targetFiles) {
    try {
      console.log(`🔍 Processing ${filePath}...`);
      let content = await fs.readFile(filePath, 'utf8');
      let changed = false;

      // Fix malformed try-catch blocks pattern 1:
      // } catch (error) {
      //   console.error("Error:", error);
      //   throw error}
      //   console.error('Error ...:', error)}
      const pattern1 = /\} catch \(error\) \{\s*console\.error\("Error:", error\);\s*throw error\}\s*console\.error\('[^']*', error\)\}/g;
      if (pattern1.test(content)) {
        content = content.replace(pattern1, '} catch (error) {\n    console.error("Error:", error);\n    throw error;\n  }');
        changed = true;
        console.log(`  ✅ Fixed malformed try-catch pattern 1`);
      }

      // Fix malformed try-catch blocks pattern 2:
      // } catch (error) {
      //   console.error("Error:", error);
      //   throw error}
      //   console.error('Error ...:', error)} finally {
      const pattern2 = /\} catch \(error\) \{\s*console\.error\("Error:", error\);\s*throw error\}\s*console\.error\('[^']*', error\)\} finally \{/g;
      if (pattern2.test(content)) {
        content = content.replace(pattern2, '} catch (error) {\n    console.error("Error:", error);\n    throw error;\n  } finally {');
        changed = true;
        console.log(`  ✅ Fixed malformed try-catch-finally pattern`);
      }

      // Fix incomplete finally blocks:
      // } finally {
      //   setIsLoading(false)}
      const pattern3 = /\} finally \{\s*([^}]+)\}/g;
      content = content.replace(pattern3, '} finally {\n    $1;\n  }');
      if (content !== content.replace(pattern3, '} finally {\n    $1;\n  }')) {
        changed = true;
        console.log(`  ✅ Fixed incomplete finally blocks`);
      }

      // Fix missing opening braces in try blocks
      const pattern4 = /try \{\s*([^}]+)\} catch/g;
      content = content.replace(pattern4, (match, tryBody) => {
        if (!tryBody.includes('throw error;') && tryBody.includes('throw error}')) {
          const fixed = tryBody.replace('throw error}', 'throw error;\n    }');
          return `try {\n    ${fixed} catch`;
        }
        return match;
      });

      // Fix specific issues in the files
      if (filePath.includes('UnifiedJobPortal.tsx')) {
        // Fix the specific syntax error in initializeData
        content = content.replace(
          /initializeData\(\)\}, \[detectedLocation/g,
          'initializeData();\n  }, [detectedLocation'
        );
        if (content.includes('initializeData();')) {
          changed = true;
          console.log(`  ✅ Fixed initializeData useEffect`);
        }
      }

      if (changed) {
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`✅ Fixed syntax issues in ${filePath}`);
      } else {
        console.log(`ℹ️  No changes needed in ${filePath}`);
      }

    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
}

// Run the fixes
fixTryCatchBlocks().then(() => {
  console.log('\n✨ Try-catch-finally fix completed!');
  console.log('🔍 Testing build...');
  
  const { exec } = require('child_process');
  exec('npm run build', (error, stdout, stderr) => {
    if (error) {
      console.log('❌ Build still has errors:');
      console.log(stderr.split('\n').slice(0, 30).join('\n'));
    } else {
      console.log('✅ Build successful!');
    }
  });
});
