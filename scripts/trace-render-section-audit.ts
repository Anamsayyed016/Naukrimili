/**
 * Read-only validation: Builder data → rendered HTML section audit.
 * Usage: npx tsx scripts/trace-render-section-audit.ts [templateId]
 */

import fs from 'fs';
import path from 'path';
import { coalesceFormDataForTemplateRender } from '../lib/resume-builder/section-visibility';
import { injectResumeData } from '../lib/resume-builder/template-loader';
import {
  auditRenderedSections,
  formatSectionAuditReport,
} from '../lib/resume-builder/dynamic-layout-engine';

const templateId = process.argv[2] || 'executive-sidebar-elite';

async function main() {
  const htmlPath = path.join(process.cwd(), 'public', 'templates', templateId, 'index.html');
  const htmlTemplate = fs.readFileSync(htmlPath, 'utf8');
  const bodyMatch = htmlTemplate.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const html = bodyMatch ? bodyMatch[1].trim() : htmlTemplate;

  const fixturePath = process.argv[3];
  const builder: Record<string, unknown> = fixturePath
    ? JSON.parse(fs.readFileSync(fixturePath, 'utf8'))
    : {
        customParserUsed: true,
        firstName: 'Anam',
        lastName: 'Sayyed',
        summary: 'Full-stack developer with experience building scalable web applications.',
        experience: [
          {
            company: 'Naukrimili',
            title: 'Full Stack Developer',
            achievements: ['Built job portal', 'Integrated custom parser', 'Deployed on PM2'],
          },
        ],
        projects: [
          { name: 'Naukrimili Job Portal', description: 'Next.js job board with resume builder.' },
          { name: 'Cafe Zafran Website', description: 'Restaurant ordering site.' },
        ],
        skills: ['Python', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Docker'],
        education: [{ institution: 'University', degree: 'B.Tech', year: '2022' }],
        certifications: [{ name: 'AWS Solutions Architect', issuer: 'Amazon', date: '2024' }],
        languages: [{ language: 'English', proficiency: 'Fluent' }],
        achievements: ['Hackathon winner 2023'],
      };

  const coalesced = coalesceFormDataForTemplateRender(builder);
  const rendered = injectResumeData(html, builder, { templateId, mode: 'preview' });
  const rows = auditRenderedSections(coalesced, rendered);
  const report = formatSectionAuditReport(rows);
  const handlebarsLeaks = (rendered.match(/\{\{[#/]?[A-Za-z_][A-Za-z0-9_]*\}\}/g) || []).length;

  console.log(`Template: ${templateId}`);
  console.log(`Import mode: ${builder.customParserUsed === true}`);
  console.log(`Handlebars leaks: ${handlebarsLeaks}`);
  console.log('');
  console.log(report);

  const outPath = path.join(process.cwd(), 'tmp', `render-section-audit-${templateId}.txt`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, report, 'utf8');
  console.log(`\nWrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
