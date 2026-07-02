/**
 * Role detection within a project block.
 */

import { looksLikeJobTitleLine } from '@/lib/resume-parser/import-sanitize';

export interface RoleDetection {
  role: string;
  confidence: number;
}

const ROLE_PREFIX_RE =
  /^(?:role|my\s+role|position|contributed\s+as|developed\s+as|built\s+as)\s*[:–-]\s*(.+)$/i;

export function detectRoleFromLine(text: string): RoleDetection {
  const trimmed = text.trim();
  if (!trimmed) return { role: '', confidence: 0 };

  const labeled = trimmed.match(ROLE_PREFIX_RE);
  if (labeled?.[1]) {
    return { role: labeled[1].trim(), confidence: 85 };
  }

  if (looksLikeJobTitleLine(trimmed) && trimmed.length <= 80 && !/[.!?]/.test(trimmed)) {
    return { role: trimmed, confidence: 55 };
  }

  return { role: '', confidence: 0 };
}
