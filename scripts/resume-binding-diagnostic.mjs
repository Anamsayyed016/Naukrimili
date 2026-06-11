#!/usr/bin/env node
/**
 * Production/local resume export diagnostic.
 * Usage: node scripts/resume-binding-diagnostic.mjs [production|local]
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const base = process.argv[2] === 'local' ? 'http://localhost:3000' : 'https://naukrimili.com';

const scenarios = [
  {
    name: 'alias-trap (experience=[], Work Experience=[data])',
    file: 'test-export-payload.json',
    expect: ['Infosys', 'MBA Finance', 'Tally'],
  },
  {
    name: 'empty-builder (arrays empty, summary bleed only)',
    file: 'test-empty-builder-payload.json',
    expect: [],
  },
  {
    name: 'full-profile (experience/education/skills populated)',
    file: 'test-session-import-payload.json',
    expect: ['Infosys', 'MBA Finance', 'Tally'],
  },
];

function hits(html, tokens) {
  return Object.fromEntries(tokens.map((t) => [t, html.includes(t)]));
}

console.log(`Resume binding diagnostic → ${base}\n`);

for (const scenario of scenarios) {
  const body = readFileSync(join(__dirname, scenario.file), 'utf8');
  const res = await fetch(`${base}/api/resume-builder/export/html`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const html = await res.text();
  const outFile = join(__dirname, `diag-${scenario.file.replace('.json', '')}.html`);
  writeFileSync(outFile, html);
  const found = hits(html, scenario.expect);
  const pass = scenario.expect.every((t) => found[t]);
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${scenario.name} (HTTP ${res.status})`);
  if (scenario.expect.length) console.log('  tokens:', found);
  else console.log('  (expected no section tokens — summary-only data)');
  console.log('');
}

console.log('Done. HTML outputs saved under scripts/diag-*.html');
