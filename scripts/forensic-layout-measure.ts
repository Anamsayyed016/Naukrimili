/**
 * FORENSIC ONLY — DOM layout measurement across resume templates.
 * Does not modify rendering. Outputs JSON metrics to tmp/forensic-layout-report.json
 */
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { loadTemplateServer } from '../lib/resume-builder/template-loader-server';
import { applyColorVariant } from '../lib/resume-builder/color-theme';
import { injectResumeData } from '../lib/resume-builder/template-loader';
import { PREVIEW_CONTENT_FLOW_CSS } from '../lib/resume-builder/preview-content-flow';
import { getAtsContentBalanceStyleBlock, isPremiumTemplate } from '../lib/resume-builder/ats-content-balance-css';
import templatesRegistry from '../lib/resume-builder/templates.json';

const A4_H = 1123;
const IMPORT_BUILDER = {
  customParserUsed: true,
  firstName: 'Anam',
  lastName: 'Sayyed',
  email: 'anam@example.com',
  phone: '+91 98765 43210',
  summary:
    'Full-stack developer with experience building scalable web applications and leading delivery across the stack.',
  experience: [
    {
      company: 'Naukrimili',
      title: 'Full Stack Developer',
      achievements: ['Built job portal', 'Integrated custom parser', 'Deployed production stack'],
    },
    {
      company: 'Tech Corp',
      title: 'Software Engineer',
      achievements: ['API design', 'Reduced latency 30%'],
    },
  ],
  projects: [
    { name: 'Job Portal', description: 'Next.js platform.' },
    { name: 'Restaurant Site', description: 'Ordering website.' },
  ],
  skills: ['Python', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
  education: [{ institution: 'University', degree: 'B.Tech CS', year: '2022' }],
  certifications: [{ name: 'AWS Architect', issuer: 'Amazon', date: '2024' }],
  languages: [{ language: 'English', proficiency: 'Fluent' }],
  achievements: ['Hackathon Winner 2023'],
};

const SPARSE_BUILDER = {
  customParserUsed: true,
  firstName: 'Alex',
  lastName: 'Lee',
  summary: 'Junior developer seeking opportunities.',
  experience: [
    { company: 'Startup', title: 'Intern', description: 'Built features.' },
  ],
  skills: ['JavaScript', 'HTML'],
  education: [{ institution: 'College', degree: 'BSc', year: '2024' }],
};

type SectionMetric = {
  selector: string;
  found: boolean;
  offsetHeight: number;
  scrollHeight: number;
  clientHeight: number;
  computedMinHeight: string;
  computedHeight: string;
  computedAlignItems: string;
  rectHeight: number;
};

async function measureHtml(page: import('puppeteer').Page, label: string) {
  return page.evaluate(`(() => {
    const pick = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return { selector: sel, found: false, offsetHeight: 0, scrollHeight: 0, clientHeight: 0, computedMinHeight: '', computedHeight: '', computedAlignItems: '', rectHeight: 0 };
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { selector: sel, found: true, offsetHeight: el.offsetHeight, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, computedMinHeight: cs.minHeight, computedHeight: cs.height, computedAlignItems: cs.alignItems, rectHeight: Math.round(r.height) };
    };
    const container = document.querySelector('.resume-container');
    const containerH = container ? container.scrollHeight : 0;
    const layoutEl = document.querySelector('[class*="-layout"], .resume-wrapper, .ese-layout');
    const sidebarEl = document.querySelector('aside, .sidebar, [class*="-sidebar"]');
    const mainEl = document.querySelector('main, .main-content, [class*="-main"]');
    let largestGap = 0;
    let largestPath = '';
    if (sidebarEl && mainEl) {
      const sbSections = Array.from(sidebarEl.querySelectorAll('section, .ese-section'));
      const sbContent = sbSections.reduce((sum, n) => sum + n.getBoundingClientRect().height, 0);
      const gap = Math.max(0, Math.round(sidebarEl.getBoundingClientRect().height - sbContent));
      if (gap > largestGap) { largestGap = gap; largestPath = 'sidebar column below last section'; }
    }
    const contentNodes = Array.from(document.querySelectorAll('.experience-item, .project-item, .education-item, .skill-tag, .summary-text, section'));
    const contentH = contentNodes.reduce((s, el) => s + el.offsetHeight, 0);
    return {
      label: ${JSON.stringify(label)},
      pageHeight: 1123,
      containerScrollHeight: containerH,
      pageFillPct: Math.round((containerH / 1123) * 100),
      whitespacePct: Math.round((Math.max(0, 1123 - containerH) / 1123) * 100),
      sidebarHeight: sidebarEl ? sidebarEl.scrollHeight : 0,
      mainHeight: mainEl ? mainEl.scrollHeight : 0,
      columnImbalance: sidebarEl && mainEl ? Math.abs(sidebarEl.scrollHeight - mainEl.scrollHeight) : 0,
      layoutAlignItems: layoutEl ? getComputedStyle(layoutEl).alignItems : '',
      layoutMinHeight: layoutEl ? getComputedStyle(layoutEl).minHeight : '',
      largestEmptyBlock: { path: largestPath, gap: largestGap },
      contentSumEstimate: contentH,
      reservedHeight: Math.max(0, containerH - contentH),
      summary: pick('.summary-text'),
      experience: pick('.experience-list'),
      sidebar: pick('aside'),
      main: pick('main'),
      handlebarsLeaks: (document.body.innerHTML.match(/\\{\\{[#/]?[A-Za-z_][A-Za-z0-9_]*\\}\\}/g) || []).length
    };
  })()`);
}

async function buildHtml(templateId: string, builder: Record<string, unknown>) {
  const loaded = await loadTemplateServer(templateId);
  if (!loaded) throw new Error(`missing ${templateId}`);
  const { template, html, css } = loaded;
  const color = template.colors.find((c) => c.id === template.defaultColor) || template.colors[0];
  const coloredCss = applyColorVariant(css, color);
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || html;
  const injected = injectResumeData(body, builder, { templateId, mode: 'preview' });
  const ats = isPremiumTemplate(templateId) ? getAtsContentBalanceStyleBlock() : '';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
${coloredCss}
${PREVIEW_CONTENT_FLOW_CSS}
</style></head><body>${injected}${ats}</body></html>`;
}

async function main() {
  const ids = (templatesRegistry.templates as Array<{ id: string }>).map((t) => t.id);
  const sample = ids.filter((id) =>
    [
      'executive-sidebar-elite',
      'executive-corporate',
      'platinum-executive-edge',
      'executive-timeline',
      'modern-edge',
      'teal-modern',
      'prism-edition',
      'charcoal-premium',
    ].includes(id)
  );

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 2000 });

  const reports: Record<string, unknown> = { dense: {}, sparse: {} };

  for (const id of sample) {
    for (const [mode, builder] of [
      ['dense', IMPORT_BUILDER],
      ['sparse', SPARSE_BUILDER],
    ] as const) {
      const html = await buildHtml(id, builder);
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const metrics = await measureHtml(page, `${id}-${mode}`);
      (reports[mode] as Record<string, unknown>)[id] = metrics;
      console.log(
        `${id} [${mode}] fill=${(metrics as { pageFillPct: number }).pageFillPct}% align=${(metrics as { layoutAlignItems: string }).layoutAlignItems} imbalance=${(metrics as { columnImbalance: number }).columnImbalance}px hb=${(metrics as { handlebarsLeaks: number }).handlebarsLeaks}`
      );
    }
  }

  await browser.close();
  const out = path.join(process.cwd(), 'tmp', 'forensic-layout-report.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(reports, null, 2));
  console.log(`Wrote ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
