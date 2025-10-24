#!/usr/bin/env node

/**
 * Clean up non-working APIs from daily-scheduler.ts
 */

import fs from 'fs';

const file = 'lib/jobs/daily-scheduler.ts';
let content = fs.readFileSync(file, 'utf8');

// Remove non-working API flags from DEFAULT_CONFIG
content = content.replace(/enableAdzuna:\s*true,\s*/g, '');
content = content.replace(/enableJSearch:\s*true,\s*/g, '');
content = content.replace(/enableGoogleJobs:\s*true,\s*/g, '');
content = content.replace(/enableJooble:\s*false,\s*/g, '');

// Remove non-working API fetch blocks
content = content.replace(/\/\/ Fetch from JSearch[\s\S]*?catch \(error\) \{[\s\S]*?console\.warn\([^)]*JSearch[^)]*\);[\s\S]*?\}[\s\S]*?\}/g, '');
content = content.replace(/\/\/ Fetch from Google Jobs[\s\S]*?catch \(error\) \{[\s\S]*?console\.warn\([^)]*Google Jobs[^)]*\);[\s\S]*?\}[\s\S]*?\}/g, '');
content = content.replace(/\/\/ Fetch from Jooble[\s\S]*?catch \(error\) \{[\s\S]*?console\.warn\([^)]*Jooble[^)]*\);[\s\S]*?\}[\s\S]*?\}/g, '');

// Remove checks for non-working API configs
content = content.replace(/if \(this\.config\.enableJSearch\) \{[\s\S]*?\}[\s\S]*?\}/g, '');
content = content.replace(/if \(this\.config\.enableGoogleJobs\) \{[\s\S]*?\}[\s\S]*?\}/g, '');
content = content.replace(/if \(this\.config\.enableJooble\) \{[\s\S]*?\}[\s\S]*?\}/g, '');

fs.writeFileSync(file, content);
console.log('✅ Cleaned daily-scheduler.ts');

