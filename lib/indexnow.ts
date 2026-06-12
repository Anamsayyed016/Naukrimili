/**
 * IndexNow URL submission — server-only, fire-and-forget from API routes.
 * @see https://www.indexnow.org/documentation
 */
import 'server-only';
import { getBaseUrl } from '@/lib/url-utils';
import { cleanJobDataForSEO, generateSEOJobUrl } from '@/lib/seo-url-utils';

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS_PER_REQUEST = 10_000;

const BLOCKED_PATH_PREFIXES = [
  '/dashboard',
  '/auth',
  '/admin',
  '/payment',
  '/api/resumes',
  '/api/',
  '/employer/',
  '/settings',
  '/messages',
  '/profile-setup',
  '/resume-builder/editor',
] as const;

export interface IndexNowResult {
  ok: boolean;
  status?: number;
  submitted: number;
  error?: string;
}

export interface IndexNowJobInput {
  id: number | string;
  title: string;
  company?: string | null;
  location?: string | null;
  source?: string | null;
  sourceId?: string | null;
  isActive?: boolean | null;
}

export function isIndexNowConfigured(): boolean {
  return (
    process.env.INDEXNOW_ENABLED === 'true' &&
    Boolean(process.env.INDEXNOW_KEY?.trim())
  );
}

function getIndexNowKey(): string | null {
  const key = process.env.INDEXNOW_KEY?.trim();
  return key && key.length >= 32 ? key : null;
}

export function isIndexNowEligibleUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();
    return !BLOCKED_PATH_PREFIXES.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(prefix)
    );
  } catch {
    return false;
  }
}

export function buildJobPublicUrl(job: IndexNowJobInput): string {
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  const cleanJob = cleanJobDataForSEO({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    source: job.source,
    sourceId: job.sourceId,
  });
  return `${baseUrl}${generateSEOJobUrl(cleanJob)}`;
}

export function buildCompanyPublicUrl(companyId: string): string {
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  return `${baseUrl}/companies/${encodeURIComponent(companyId)}`;
}

export function buildResumeTemplateGalleryUrl(): string {
  const baseUrl = getBaseUrl().replace(/\/$/, '');
  return `${baseUrl}/resume-builder/templates`;
}

function dedupeEligibleUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of urls) {
    const url = raw.trim();
    if (!url || !isIndexNowEligibleUrl(url) || seen.has(url)) continue;
    seen.add(url);
    result.push(url);
  }
  return result;
}

async function postUrlBatch(urlList: string[]): Promise<IndexNowResult> {
  const key = getIndexNowKey();
  if (!key) {
    return { ok: false, submitted: 0, error: 'INDEXNOW_KEY missing or too short' };
  }

  const baseUrl = getBaseUrl().replace(/\/$/, '');
  let host: string;
  try {
    host = new URL(baseUrl).host;
  } catch {
    return { ok: false, submitted: 0, error: 'Invalid NEXT_PUBLIC_APP_URL / NEXTAUTH_URL' };
  }

  const keyLocation = `${baseUrl}/${key}.txt`;

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key, keyLocation, urlList }),
    });

    const ok = response.status === 200 || response.status === 202;
    if (!ok) {
      const body = await response.text().catch(() => '');
      console.warn('[IndexNow] Submit failed:', response.status, body.slice(0, 200));
      return {
        ok: false,
        status: response.status,
        submitted: urlList.length,
        error: body || `HTTP ${response.status}`,
      };
    }

    console.log('[IndexNow] Submitted', urlList.length, 'URL(s)');
    return { ok: true, status: response.status, submitted: urlList.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn('[IndexNow] Request error:', message);
    return { ok: false, submitted: 0, error: message };
  }
}

export async function submitIndexNowUrl(url: string): Promise<IndexNowResult> {
  return submitIndexNowUrls([url]);
}

export async function submitIndexNowUrls(urls: string[]): Promise<IndexNowResult> {
  if (!isIndexNowConfigured()) {
    return { ok: false, submitted: 0, error: 'IndexNow disabled' };
  }

  const eligible = dedupeEligibleUrls(urls);
  if (eligible.length === 0) {
    return { ok: false, submitted: 0, error: 'No eligible URLs' };
  }

  let totalSubmitted = 0;
  for (let i = 0; i < eligible.length; i += MAX_URLS_PER_REQUEST) {
    const batch = eligible.slice(i, i + MAX_URLS_PER_REQUEST);
    const result = await postUrlBatch(batch);
    if (!result.ok) {
      return { ...result, submitted: totalSubmitted };
    }
    totalSubmitted += result.submitted;
  }

  return { ok: true, submitted: totalSubmitted };
}

/** Non-blocking — safe to call from API handlers. */
export function notifyIndexNow(urls: string | string[]): void {
  if (!isIndexNowConfigured()) return;

  const list = dedupeEligibleUrls(Array.isArray(urls) ? urls : [urls]);
  if (list.length === 0) return;

  void submitIndexNowUrls(list).catch((error) => {
    console.error('[IndexNow] Background submit failed:', error);
  });
}

/** Notify for employer-posted manual jobs only. */
export function notifyJobIndexNow(job: IndexNowJobInput): void {
  if (!isIndexNowConfigured()) return;
  if (job.isActive === false) return;
  if (job.source && job.source !== 'manual') return;

  try {
    notifyIndexNow(buildJobPublicUrl(job));
  } catch (error) {
    console.error('[IndexNow] Job URL build failed:', error);
  }
}

export function notifyCompanyIndexNow(companyId: string): void {
  if (!isIndexNowConfigured() || !companyId) return;

  try {
    notifyIndexNow(buildCompanyPublicUrl(companyId));
  } catch (error) {
    console.error('[IndexNow] Company URL build failed:', error);
  }
}
