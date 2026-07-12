/**
 * Generate before/after typography comparison screenshots for a sample premium template.
 * Run: npx tsx scripts/capture-typography-screenshots.ts
 */
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import puppeteer from 'puppeteer';
import { injectResumeData } from '../lib/resume-builder/template-loader';
import { applyColorVariant } from '../lib/resume-builder/color-theme';
import templatesRegistry from '../lib/resume-builder/templates.json';

const TEMPLATE_ID = 'charcoal-premium';
const OUT_DIR = join(process.cwd(), 'docs', 'typography-before-after');

const fixture = {
  firstName: 'Anam',
  lastName: 'Sayyed',
  jobTitle: 'Python Developer',
  email: 'anamsayyed58@gmail.com',
  phone: '7415566841',
  location: 'Bhopal, Madhya Pradesh',
  summary:
    'Highly motivated Full-Stack Python Developer with expertise in Python, Django, and ReactJS. Experienced in building scalable web applications and REST APIs.',
  experience: [
    {
      position: 'Python Developer',
      company: 'Digital Solutions Pvt Ltd',
      location: 'Bhopal, Madhya Pradesh',
      startDate: '2022-01',
      endDate: 'Present',
      description: 'Designed secure, scalable RESTful APIs using Django and Flask.',
      achievements: [
        'Designed secure, scalable RESTful APIs using Django and Flask.',
        'Collaborated with cross-functional teams on product delivery.',
      ],
    },
    {
      position: 'Full Stack Developer',
      company: 'Cybrom Technology',
      location: 'Bhopal',
      startDate: '2019',
      endDate: '2020',
      description: 'Led design and development of full-stack web applications.',
    },
  ],
  education: [
    {
      degree: 'B.Tech Computer Science',
      institution: 'Rajiv Gandhi University',
      year: '2018',
    },
  ],
  skills: ['Python', 'React', 'Node', 'Django', 'SQL', 'AWS', 'JavaScript', 'MongoDB'],
  projects: [
    {
      name: 'Job Portal Application',
      description: 'Built a full-stack job portal with Next.js and PostgreSQL.',
      technologies: 'Next.js, PostgreSQL, Tailwind',
      link: 'https://example.com/job-portal',
    },
  ],
};

function stripBalanceBlock(css: string): string {
  const marker = '/* ATS Content Balance — typography & spacing */';
  const idx = css.indexOf(marker);
  return idx >= 0 ? css.slice(0, idx).trimEnd() : css;
}

function buildHtml(withBalance: boolean): string {
  const templateDir = join(process.cwd(), 'public', 'templates', TEMPLATE_ID);
  const html = readFileSync(join(templateDir, 'index.html'), 'utf8');
  let style = readFileSync(join(templateDir, 'style.css'), 'utf8');
  if (!withBalance) style = stripBalanceBlock(style);

  const meta = (templatesRegistry.templates as Array<{ id: string; colors: unknown[]; defaultColor: string }>).find(
    (t) => t.id === TEMPLATE_ID
  );
  const coloredCss = applyColorVariant(style, meta?.colors?.[0] as never);
  let body = injectResumeData(html, fixture, { templateId: TEMPLATE_ID });
  if (!withBalance) {
    body = body.replace(/<style data-injected="ats-content-balance">[\s\S]*?<\/style>/i, '');
  }

  const inner = body.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? body;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${coloredCss}</style></head><body>${inner}</body></html>`;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 1200, deviceScaleFactor: 2 });

  for (const [label, withBalance] of [
    ['before', false],
    ['after', true],
  ] as const) {
    const html = buildHtml(withBalance);
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1500));
    const out = join(OUT_DIR, `${TEMPLATE_ID}-${label}.png`);
    const el = await page.$('.resume-container');
    if (el) {
      await el.screenshot({ path: out });
    } else {
      await page.screenshot({ path: out, fullPage: true });
    }
    console.log(`wrote ${out}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
