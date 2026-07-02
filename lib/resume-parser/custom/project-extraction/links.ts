/**
 * Link extraction — GitHub, GitLab, Bitbucket, live/demo URLs, app stores.
 */

export interface ExtractedLinks {
  github: string;
  liveUrl: string;
  confidence: number;
}

const GITHUB_RE =
  /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w.-]+\/[\w.-]+(?:\/[^\s,|]*)?/gi;
const GITLAB_RE =
  /(?:https?:\/\/)?(?:www\.)?gitlab\.com\/[\w./-]+/gi;
const BITBUCKET_RE =
  /(?:https?:\/\/)?(?:www\.)?bitbucket\.org\/[\w./-]+/gi;
const PLAY_STORE_RE =
  /(?:https?:\/\/)?play\.google\.com\/store\/apps\/[^\s,|]+/gi;
const APP_STORE_RE =
  /(?:https?:\/\/)?(?:apps\.apple\.com|itunes\.apple\.com)\/[^\s,|]+/gi;
const GENERIC_URL_RE =
  /https?:\/\/[^\s,|<>()]+/gi;

const REPO_HOST_RE = /github\.com|gitlab\.com|bitbucket\.org/i;

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim().replace(/[.,;]+$/, '');
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function firstMatch(text: string, re: RegExp): string {
  const m = text.match(re);
  return m?.[0] ? normalizeUrl(m[0]) : '';
}

export function extractLinksFromText(text: string): ExtractedLinks {
  if (!text?.trim()) return { github: '', liveUrl: '', confidence: 0 };

  const github =
    firstMatch(text, GITHUB_RE) ||
    firstMatch(text, GITLAB_RE) ||
    firstMatch(text, BITBUCKET_RE);

  const labeledLive =
    text.match(/(?:live|demo|portfolio|url|website|deployed at)\s*[:–-]\s*(https?:\/\/\S+|www\.\S+)/i)?.[1] ||
    text.match(/(?:live|demo|portfolio|url|website|deployed at)\s*[:–-]\s*(\S+\.\S+)/i)?.[1];

  let liveUrl = '';
  if (labeledLive) {
    liveUrl = normalizeUrl(labeledLive);
  } else {
    const urls = text.match(GENERIC_URL_RE) || [];
    for (const u of urls) {
      if (!REPO_HOST_RE.test(u)) {
        liveUrl = normalizeUrl(u);
        break;
      }
    }
  }

  const playStore = firstMatch(text, PLAY_STORE_RE);
  const appStore = firstMatch(text, APP_STORE_RE);
  if (!liveUrl && playStore) liveUrl = playStore;
  if (!liveUrl && appStore) liveUrl = appStore;

  let confidence = 0;
  if (github) confidence += 55;
  if (liveUrl) confidence += 50;
  if (labeledLive) confidence += 15;

  return { github, liveUrl, confidence: Math.min(100, confidence) };
}

export function lineHasLinkSignal(text: string): boolean {
  return extractLinksFromText(text).confidence >= 50;
}
