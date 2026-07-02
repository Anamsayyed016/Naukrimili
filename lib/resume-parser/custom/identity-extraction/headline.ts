/**
 * Professional headline / title detection near identity block.
 */

import { isLikelyJobTitleFragment } from '@/lib/resume-parser/field-classification';
import {
  isPlausiblePersonName,
  isResumeSectionHeadingLine,
  looksLikeJobTitleLine,
} from '@/lib/resume-parser/import-sanitize';

import { getZoneLines, type ScanZone } from './sources';

export interface HeadlineDetection {
  professionalHeadline: string;
  professionalTitle: string;
  confidence: number;
}

const TITLE_KEYWORDS_RE =
  /\b(?:software|full[- ]?stack|front[- ]?end|back[- ]?end|python|java|devops|data|machine learning|cloud|mobile|web|product|engineering|developer|engineer|analyst|designer|architect|consultant|manager|intern|scientist|researcher|administrator|specialist)\b/i;

export function scoreHeadlineCandidate(text: string): number {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 3 || trimmed.length > 120) return 0;
  if (isResumeSectionHeadingLine(trimmed)) return 0;
  if (isPlausiblePersonName(trimmed)) return 0;
  if (/[@+]|https?:\/\//i.test(trimmed)) return 0;
  if (/[.!?]$/.test(trimmed) && trimmed.split(/\s+/).length > 8) return 0;

  let score = 0;
  if (looksLikeJobTitleLine(trimmed)) score += 38;
  if (isLikelyJobTitleFragment(trimmed)) score += 32;
  if (TITLE_KEYWORDS_RE.test(trimmed)) score += 24;
  if (trimmed.split(/\s+/).length <= 8) score += 10;

  return Math.min(100, Math.round(score));
}

export function detectHeadline(zones: ScanZone[], fullName: string): HeadlineDetection {
  const lines = getZoneLines(zones, ['header', 'contact', 'preamble']);
  let best = { professionalHeadline: '', professionalTitle: '', confidence: 0 };

  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i];
    if (!line || line === fullName) continue;
    if (isResumeSectionHeadingLine(line)) continue;

    const labeled = line.match(/^(?:title|headline|position|role)\s*[:–-]\s*(.+)$/i);
    const candidate = labeled?.[1]?.trim() || line;
    const conf = scoreHeadlineCandidate(candidate);
    if (conf > best.confidence) {
      best = {
        professionalHeadline: candidate,
        professionalTitle: candidate,
        confidence: conf,
      };
    }

    if (fullName && lines[i - 1] === fullName && conf >= 40) {
      best.confidence = Math.min(100, conf + 10);
    }
  }

  return best;
}
