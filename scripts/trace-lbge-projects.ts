/**
 * Forensic trace: Luxury Burgundy Gold Executive — projects column placement.
 */
import { readFileSync } from 'fs';
import { injectResumeData } from '../lib/resume-builder/template-loader';
import { balanceTwoColumnLayout } from '../lib/resume-builder/column-balance-engine';
import { buildGallerySampleFormData } from '../lib/resume-builder/gallery-demo';
import { resolveTemplateLayoutMetadata } from '../lib/resume-builder/template-layout-metadata';
import { resolveSidebarAllowedFlexibleSections } from '../lib/resume-builder/column-balance-engine';

const tid = 'luxury-burgundy-gold-executive';
const html = readFileSync(`public/templates/${tid}/index.html`, 'utf8');

const meta = resolveTemplateLayoutMetadata({ htmlTemplate: html, templateId: tid });
const allowed = resolveSidebarAllowedFlexibleSections(html, tid);

console.log('layoutMetadata.fixedSections:', [...meta.fixedSections]);
console.log('layoutMetadata.movableSections:', [...meta.movableSections]);
console.log('allowedFlexible:', [...allowed]);

const galleryData = buildGallerySampleFormData(tid);
const liveData = {
  ...galleryData,
  _imported: true,
  experience: Array.from({ length: 4 }, (_, i) => ({
    company: `Company ${i + 1}`,
    position: `Senior Role ${i + 1}`,
    startDate: '2018-01',
    endDate: '2023-12',
    achievements: ['Achievement line one', 'Achievement line two', 'Achievement line three'],
  })),
  projects: [
    {
      name: 'Project Alpha',
      description: 'Long project description with many details about the work done.',
      technologies: 'React, Node',
    },
    {
      name: 'Project Beta',
      description: 'Another substantial project with multiple bullet points worth of content.',
      technologies: 'Python, AWS',
    },
    {
      name: 'Project Gamma',
      description: 'Third project to increase main column height significantly.',
      technologies: 'Go, K8s',
    },
  ],
};

function analyze(label: string, data: Record<string, unknown>, opts: Record<string, unknown> = {}) {
  const rendered = injectResumeData(html, data, { templateId: tid, mode: 'preview', ...opts });
  const mainMatch = rendered.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const asideMatch = rendered.match(/<aside[^>]*>([\s\S]*?)<\/aside>/i);
  const main = mainMatch?.[1] ?? '';
  const aside = asideMatch?.[1] ?? '';
  console.log(`\n${label}:`);
  console.log('  projects in main:', /lbge-section--projects|project-item/.test(main));
  console.log('  projects in sidebar:', /lbge-section--projects|project-item/.test(aside));
  console.log('  column-balanced:', /data-column-balanced/.test(rendered));
  console.log('  moved projects:', /data-column-moved="projects"/.test(rendered));
}

analyze('Gallery demo', galleryData, { galleryPreview: true, galleryTemplateId: tid });
analyze('Live preview (full)', liveData);

const preInject = injectResumeData(html, liveData, { templateId: tid, mode: 'preview' });
const preMain = preInject.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';
console.log('\nBefore explicit balance (if inject already balanced):');
console.log('  projects in main:', /lbge-section--projects|project-item/.test(preMain));

// Simulate without balance by checking balanceTwoColumnLayout on html before inject... 
// Actually inject already runs balance. Check moved sections:
const bal = balanceTwoColumnLayout(preInject, { htmlTemplate: html, templateId: tid });
console.log('\nRe-balance on already-balanced html moved:', bal.moved);
