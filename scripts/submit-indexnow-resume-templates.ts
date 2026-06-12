/**
 * Submit resume template gallery + static preview URLs to IndexNow.
 * Run after adding templates: npx ts-node scripts/submit-indexnow-resume-templates.ts
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  buildResumeTemplateGalleryUrl,
  isIndexNowConfigured,
  submitIndexNowUrls,
} from '../lib/indexnow';

interface TemplateEntry {
  slug?: string;
  html?: string;
}

interface TemplatesManifest {
  templates?: TemplateEntry[];
}

async function main(): Promise<void> {
  if (!isIndexNowConfigured()) {
    console.error('[IndexNow] Set INDEXNOW_ENABLED=true and INDEXNOW_KEY in .env');
    process.exit(1);
  }

  const manifestPath = join(process.cwd(), 'lib/resume-builder/templates.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as TemplatesManifest;
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'https://naukrimili.com'
  ).replace(/\/$/, '');

  const urls: string[] = [buildResumeTemplateGalleryUrl()];

  for (const template of manifest.templates ?? []) {
    if (template.html?.startsWith('/')) {
      urls.push(`${baseUrl}${template.html}`);
    } else if (template.slug) {
      urls.push(`${baseUrl}/templates/${template.slug}/index.html`);
    }
  }

  const result = await submitIndexNowUrls(urls);
  if (!result.ok) {
    console.error('[IndexNow] Template submit failed:', result.error);
    process.exit(1);
  }

  console.log('[IndexNow] Submitted', result.submitted, 'resume template URL(s)');
}

main().catch((error) => {
  console.error('[IndexNow] Script error:', error);
  process.exit(1);
});
