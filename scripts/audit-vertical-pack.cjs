/**
 * Measures unused vertical space below last content (before/after vertical pack).
 * Usage: node scripts/audit-vertical-pack.cjs
 */
const fs = require('fs/promises');
const path = require('path');
const puppeteer = require('puppeteer');

const A4_HEIGHT_PX = 1123;
const ROOT = path.join(__dirname, '..');

function extractExportedCss(tsFile, exportName) {
  const src = require('fs').readFileSync(path.join(ROOT, tsFile), 'utf8');
  const marker = `export const ${exportName} = \``;
  const start = src.indexOf(marker);
  if (start === -1) throw new Error(`Missing ${exportName} in ${tsFile}`);
  const from = start + marker.length;
  const end = src.indexOf('`;\n', from);
  return src.slice(from, end);
}

const SHARED_A4_SHELL_CSS = extractExportedCss('lib/resume-builder/shared-preview-shell.ts', 'SHARED_A4_SHELL_CSS');
const PREVIEW_VERTICAL_PACK_CSS = extractExportedCss('lib/resume-builder/vertical-pack-layout.ts', 'VERTICAL_PACK_LAYOUT_CSS');

const SHORT_FORM = {
  firstName: 'Alex',
  lastName: 'Morgan',
  name: 'Alex Morgan',
  email: 'alex@email.com',
  phone: '+1 555 0100',
  jobTitle: 'Product Manager',
  location: 'Austin, TX',
  summary: 'Focused product leader with experience shipping B2B SaaS.',
  skills: ['Strategy', 'Roadmaps', 'SQL'],
  experience: [
    {
      position: 'Product Manager',
      company: 'Northline',
      startDate: '2021',
      endDate: 'Present',
      description: 'Owned roadmap for analytics platform.',
    },
  ],
  education: [{ degree: 'BBA', institution: 'State University', year: '2018' }],
  projects: [],
  certifications: [],
  languages: [],
  achievements: [],
  hobbies: [],
};

const FOCUS = [
  'blush-executive-watercolor',
  'luxury-corporate',
  'executive-corporate',
  'luxe-executive',
  'sterling-executive',
  'platinum-executive-edge',
  'slate-executive-pro',
  'executive-timeline',
  'verdant-scandi-executive',
  'rosewood-modern',
];

async function loadTemplate(id) {
  const dir = path.join(ROOT, 'public', 'templates', id);
  const html = await fs.readFile(path.join(dir, 'index.html'), 'utf8');
  const css = await fs.readFile(path.join(dir, 'style.css'), 'utf8');
  return { html, css };
}

function injectMinimal(html, data) {
  let out = html;
  const map = {
    '{{name}}': data.name,
    '{{firstName}}': data.firstName,
    '{{lastName}}': data.lastName,
    '{{email}}': data.email,
    '{{phone}}': data.phone,
    '{{jobTitle}}': data.jobTitle,
    '{{location}}': data.location,
    '{{summary}}': data.summary,
  };
  for (const [k, v] of Object.entries(map)) {
    out = out.split(k).join(String(v ?? ''));
  }
  return out;
}

async function measure(page, html) {
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts?.ready);
  return page.evaluate(() => {
    const container = document.querySelector('.resume-container');
    if (!container) return { contentHeight: 0, unusedBottom: 0, containerHeight: 0 };
    const cRect = container.getBoundingClientRect();
    let lastBottom = cRect.top;
    const walk = (el) => {
      for (const child of el.children) {
        const style = window.getComputedStyle(child);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const text = (child.innerText || '').trim();
        const r = child.getBoundingClientRect();
        if (text.length > 0 && r.height > 2) lastBottom = Math.max(lastBottom, r.bottom);
        walk(child);
      }
    };
    walk(container);
    const contentHeight = Math.round(lastBottom - cRect.top);
    const containerHeight = Math.round(cRect.height);
    return { contentHeight, unusedBottom: Math.max(0, containerHeight - contentHeight), containerHeight };
  });
}

async function buildHtml(templateId, withPack) {
  const { html, css } = await loadTemplate(templateId);
  const body = injectMinimal(html, SHORT_FORM);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    ${css}
    ${SHARED_A4_SHELL_CSS}
    ${withPack ? PREVIEW_VERTICAL_PACK_CSS : ''}
  </style></head><body>${body}</body></html>`;
}

async function main() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1400 });

  // Computed-style probe for forced page-height wrappers
  for (const id of ['luxury-corporate', 'luxe-executive', 'sterling-executive']) {
    const { html, css } = await loadTemplate(id);
    for (const [label, pack] of [['without', ''], ['with', PREVIEW_VERTICAL_PACK_CSS]]) {
      const doc = `<!DOCTYPE html><html><head><style>${css}${SHARED_A4_SHELL_CSS}${pack}</style></head><body>${html}</body></html>`;
      await page.setContent(doc, { waitUntil: 'domcontentloaded' });
      const probe = await page.evaluate(() => {
        const sel = ['.resume-wrapper', '.resume-body', '[class*="-body"]', '[class*="timeline-accent"]'];
        const out = {};
        for (const s of sel) {
          const el = document.querySelector(s);
          if (!el) continue;
          const cs = getComputedStyle(el);
          out[s] = { minHeight: cs.minHeight, height: cs.height, alignItems: cs.alignItems, alignSelf: cs.alignSelf };
        }
        return out;
      });
      console.log(`\n${id} (${label} pack):`, JSON.stringify(probe, null, 2));
    }
  }

  console.log('\nTemplate                         unused bottom (before -> after)  contentH');
  console.log('-'.repeat(72));
  for (const id of FOCUS) {
    try {
      const before = await measure(page, await buildHtml(id, false));
      const after = await measure(page, await buildHtml(id, true));
      const delta = before.unusedBottom - after.unusedBottom;
      console.log(
        `${id.padEnd(32)} ${String(before.unusedBottom).padStart(4)}px -> ${String(after.unusedBottom).padStart(4)}px  (${delta >= 0 ? '-' : '+'}${Math.abs(delta)}px)  h=${after.contentHeight}`
      );
    } catch (e) {
      console.log(`${id.padEnd(32)} ERROR: ${e.message}`);
    }
  }
  console.log(`\nA4 reference: ${A4_HEIGHT_PX}px`);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
