import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const EXT = new Set(['.tsx', '.ts', '.jsx', '.js']);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.next' || ent.name === 'css-backup-20251010') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (EXT.has(path.extname(ent.name))) files.push(p);
  }
  return files;
}

function extractClasses(content) {
  const classes = new Set();
  for (const m of content.matchAll(/className=\{cn\(([\s\S]*?)\)\}/g)) {
    const block = m[1];
    for (const sm of block.matchAll(/['"`]([^'"`]+)['"`]/g)) {
      sm[1].split(/\s+/).filter(Boolean).forEach((c) => classes.add(c));
    }
  }
  for (const m of content.matchAll(/className="([^"]+)"/g)) {
    m[1].split(/\s+/).filter(Boolean).forEach((c) => classes.add(c));
  }
  for (const m of content.matchAll(/className='([^']+)'/g)) {
    m[1].split(/\s+/).filter(Boolean).forEach((c) => classes.add(c));
  }
  for (const m of content.matchAll(/className=\{`([^`]+)`\}/g)) {
    m[1].split(/\s+/).filter(Boolean).forEach((c) => classes.add(c));
  }
  for (const m of content.matchAll(/className=\{['"]([^'"]+)['"]\}/g)) {
    m[1].split(/\s+/).filter(Boolean).forEach((c) => classes.add(c));
  }
  return classes;
}

function routeOf(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (rel.startsWith('app/admin') || rel.startsWith('components/admin')) return 'admin';
  if (rel.startsWith('app/dashboard') || rel.startsWith('components/dashboard')) return 'dashboard';
  if (rel.startsWith('app/auth') || rel.startsWith('components/auth')) return 'auth';
  if (rel.startsWith('app/resume-builder') || rel.startsWith('components/resume-builder')) return 'resume-builder';
  if (rel.startsWith('app/employer') || rel.startsWith('components/employer')) return 'employer';
  if (rel.startsWith('app/jobs') || rel.startsWith('components/jobs')) return 'jobs';
  if (rel.startsWith('app/companies') || rel.startsWith('components/companies')) return 'companies';
  if (
    rel === 'app/page.tsx' ||
    rel.startsWith('app/HomePageClient') ||
    rel.startsWith('components/home/') ||
    rel.startsWith('components/JobSearchHero')
  ) {
    return 'homepage';
  }
  if (
    rel.startsWith('components/MainNavigation') ||
    rel.startsWith('components/Footer') ||
    rel.startsWith('components/navigation/') ||
    rel.startsWith('components/ui/') ||
    rel.startsWith('components/motion/') ||
    rel.startsWith('components/companies/CompanyLogo') ||
    rel.startsWith('components/SEOJobLink') ||
    rel.startsWith('components/EnhancedJobCard') ||
    rel.startsWith('lib/fonts/') ||
    rel.startsWith('lib/utils')
  ) {
    return 'shared-layout';
  }
  return 'other';
}

function classInCss(css, className) {
  if (!className || className.includes('${')) return false;
  const plain = className.replace(/\\/g, '');
  // Tailwind escapes : as \:
  const escaped = plain.replace(/:/g, '\\:').replace(/\[/g, '\\[').replace(/\]/g, '\\]');
  return css.includes(`.${escaped}{`) || css.includes(`.${escaped} `) || css.includes(`.${plain}{`);
}

const files = walk(path.join(ROOT, 'app'))
  .concat(walk(path.join(ROOT, 'components')))
  .concat(walk(path.join(ROOT, 'lib')));

const routeClasses = {};
const routeFiles = {};
for (const f of files) {
  const route = routeOf(f);
  const content = fs.readFileSync(f, 'utf8');
  const cls = extractClasses(content);
  if (!routeClasses[route]) {
    routeClasses[route] = new Set();
    routeFiles[route] = 0;
  }
  routeFiles[route]++;
  cls.forEach((c) => routeClasses[route].add(c));
}

const homepageRequired = new Set([
  ...(routeClasses.homepage || []),
  ...(routeClasses['shared-layout'] || []),
]);

const routes = [
  'admin',
  'dashboard',
  'auth',
  'resume-builder',
  'employer',
  'jobs',
  'companies',
  'homepage',
  'shared-layout',
  'other',
];

console.log('ROUTE\tFILES\tUNIQUE_CLASSES\tEXCLUSIVE_CLASSES');
for (const r of routes) {
  const exclusive =
    r === 'homepage' || r === 'shared-layout'
      ? 0
      : [...(routeClasses[r] || [])].filter((c) => !homepageRequired.has(c)).length;
  console.log(`${r}\t${routeFiles[r] || 0}\t${routeClasses[r]?.size || 0}\t${exclusive}`);
}

const cssPaths = [
  path.join(process.env.TEMP || '/tmp', 'd0fbe.css'),
  path.join(ROOT, '.next/static/css/d0fbe899d3e56b39.css'),
];
let css = '';
for (const p of cssPaths) {
  if (fs.existsSync(p)) {
    css = fs.readFileSync(p, 'utf8');
    break;
  }
}

if (css) {
  console.log('\nROUTE\tEXCLUSIVE\tMATCHED_IN_CSS\tEST_BYTES');
  const totalCss = css.length;
  for (const r of routes) {
    if (r === 'homepage' || r === 'shared-layout') continue;
    const exclusive = [...(routeClasses[r] || [])].filter(
      (c) => !homepageRequired.has(c) && !c.includes('${')
    );
    let matched = 0;
    let bytes = 0;
    for (const c of exclusive) {
      if (classInCss(css, c)) {
        matched++;
        bytes += c.length + 80;
      }
    }
    console.log(`${r}\t${exclusive.length}\t${matched}\t${bytes}`);
  }
  console.log(`\nTOTAL_CSS_BYTES\t${totalCss}`);
  console.log(`HOMEPAGE_REQUIRED_CLASSES\t${homepageRequired.size}`);
}
