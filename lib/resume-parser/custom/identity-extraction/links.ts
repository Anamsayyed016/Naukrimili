/**
 * Professional profile link detection.
 */

export interface ExtractedProfileLinks {
  linkedin: string;
  github: string;
  portfolio: string;
  website: string;
  behance: string;
  dribbble: string;
  stackoverflow: string;
  medium: string;
  researchgate: string;
  googleScholar: string;
  confidence: number;
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim().replace(/[.,;|)]+$/, '');
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const LINK_PATTERNS: Array<{ key: keyof Omit<ExtractedProfileLinks, 'confidence'>; re: RegExp; confidence: number }> = [
  { key: 'linkedin', re: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/[\w%-]+/gi, confidence: 92 },
  { key: 'github', re: /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w.-]+/gi, confidence: 90 },
  { key: 'behance', re: /(?:https?:\/\/)?(?:www\.)?behance\.net\/[\w%-]+/gi, confidence: 85 },
  { key: 'dribbble', re: /(?:https?:\/\/)?(?:www\.)?dribbble\.com\/[\w%-]+/gi, confidence: 85 },
  { key: 'stackoverflow', re: /(?:https?:\/\/)?(?:www\.)?stackoverflow\.com\/users\/\d+\/[\w%-]+/gi, confidence: 85 },
  { key: 'medium', re: /(?:https?:\/\/)?(?:www\.)?medium\.com\/@?[\w%-]+/gi, confidence: 82 },
  { key: 'researchgate', re: /(?:https?:\/\/)?(?:www\.)?researchgate\.net\/profile\/[\w%-]+/gi, confidence: 85 },
  { key: 'googleScholar', re: /(?:https?:\/\/)?(?:www\.)?scholar\.google\.com\/citations\?user=[\w%-]+/gi, confidence: 85 },
];

const PORTFOLIO_LABEL_RE =
  /(?:portfolio|personal\s+site|website|web\s*site|homepage)\s*[:–-]\s*(https?:\/\/\S+|www\.\S+|\S+\.\S+)/i;

const GENERIC_URL_RE = /https?:\/\/[^\s,|<>()]+/gi;

const NON_PORTFOLIO_HOST_RE =
  /linkedin\.com|github\.com|behance\.net|dribbble\.com|stackoverflow\.com|medium\.com|researchgate\.net|scholar\.google\.com|google\.com\/maps|mailto:/i;

export function extractProfileLinks(text: string, zoneWeight = 1): ExtractedProfileLinks {
  const out: ExtractedProfileLinks = {
    linkedin: '',
    github: '',
    portfolio: '',
    website: '',
    behance: '',
    dribbble: '',
    stackoverflow: '',
    medium: '',
    researchgate: '',
    googleScholar: '',
    confidence: 0,
  };

  if (!text?.trim()) return out;

  let maxConf = 0;

  for (const { key, re, confidence } of LINK_PATTERNS) {
    const m = text.match(re);
    if (m?.[0] && !out[key]) {
      out[key] = normalizeUrl(m[0]);
      maxConf = Math.max(maxConf, Math.round(confidence * zoneWeight));
    }
  }

  const labeled = text.match(PORTFOLIO_LABEL_RE);
  if (labeled?.[1]) {
    const url = normalizeUrl(labeled[1]);
    if (!NON_PORTFOLIO_HOST_RE.test(url)) {
      out.portfolio = url;
      out.website = url;
      maxConf = Math.max(maxConf, Math.round(88 * zoneWeight));
    }
  }

  const generic = text.match(GENERIC_URL_RE) || [];
  for (const u of generic) {
    if (NON_PORTFOLIO_HOST_RE.test(u)) continue;
    if (u.length > 200) continue;
    if (!out.portfolio) out.portfolio = normalizeUrl(u);
    if (!out.website) out.website = normalizeUrl(u);
    maxConf = Math.max(maxConf, Math.round(72 * zoneWeight));
    break;
  }

  out.confidence = Math.min(100, maxConf);
  return out;
}
