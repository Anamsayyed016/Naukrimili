/**
 * Formatting — preserve paragraphs and bullets; normalize whitespace only.
 */

const OCR_ARTIFACT_RE = /[\uE000-\uF8FF\uFFFD\u200B-\u200D\uFEFF]/g;
const CONTROL_CHAR_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

const BULLET_RE = /^[\s]*(?:[-–—•·▪‣●○◦]|\d+[\.\)])\s+/;

export function normalizeSummaryFormatting(text: string): string {
  if (!text?.trim()) return '';

  let s = text
    .replace(/\r\n/g, '\n')
    .replace(OCR_ARTIFACT_RE, '')
    .replace(CONTROL_CHAR_RE, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const lines = s.split('\n');
  const normalized = lines.map((line) => {
    if (BULLET_RE.test(line)) {
      const bullet = line.match(BULLET_RE)?.[0] || '- ';
      const content = line.replace(BULLET_RE, '').trim();
      return `${bullet}${content}`;
    }
    return line.trimEnd();
  });

  return normalized.join('\n').trim();
}

export function countParagraphs(text: string): number {
  if (!text?.trim()) return 0;
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 12).length;
}

export function isBulletSummary(text: string): boolean {
  const lines = (text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return false;
  const bulletLines = lines.filter((l) => BULLET_RE.test(l));
  return bulletLines.length >= 2 && bulletLines.length / lines.length >= 0.35;
}

export function countSentences(text: string): number {
  const flat = (text || '').replace(/\n+/g, ' ').trim();
  if (!flat) return 0;
  return flat.split(/(?<=[.!?])\s+/).filter((s) => s.length >= 8).length;
}
