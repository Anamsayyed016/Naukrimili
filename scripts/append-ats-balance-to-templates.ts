/**
 * Append ATS content-balance CSS block to all premium template style.css files.
 * Run: npx tsx scripts/append-ats-balance-to-templates.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  appendBalanceCssToTemplateStylesheet,
  getPremiumTemplateIds,
} from '../lib/resume-builder/ats-content-balance-css';

const root = join(process.cwd(), 'public', 'templates');
const ids = getPremiumTemplateIds();

let updated = 0;
for (const id of ids) {
  const cssPath = join(root, id, 'style.css');
  try {
    const before = readFileSync(cssPath, 'utf8');
    const after = appendBalanceCssToTemplateStylesheet(before);
    if (after !== before) {
      writeFileSync(cssPath, after, 'utf8');
      updated += 1;
      console.log(`updated: ${id}`);
    } else {
      console.log(`unchanged: ${id}`);
    }
  } catch (err) {
    console.warn(`skip ${id}:`, err instanceof Error ? err.message : err);
  }
}

console.log(`\nDone — ${updated}/${ids.length} premium templates updated.`);
