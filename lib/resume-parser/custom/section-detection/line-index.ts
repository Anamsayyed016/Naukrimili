/**
 * Line-index utilities with character offsets for non-overlapping partitions.
 */

import type { LineSpan } from './types';

export function buildLineIndex(text: string): LineSpan[] {
  const lines: LineSpan[] = [];
  let offset = 0;
  const parts = text.split('\n');
  for (let i = 0; i < parts.length; i++) {
    const line = parts[i];
    const start = offset;
    const end = start + line.length;
    lines.push({
      index: i,
      text: line,
      start,
      end,
      isBlank: line.trim().length === 0,
    });
    offset = end + (i < parts.length - 1 ? 1 : 0);
  }
  return lines;
}

export function sliceTextByLines(
  lines: LineSpan[],
  fromLine: number,
  toLineExclusive: number,
  fullText: string
): string {
  if (fromLine >= toLineExclusive || fromLine < 0 || toLineExclusive > lines.length) return '';
  const start = lines[fromLine].start;
  const end = lines[toLineExclusive - 1].end;
  return fullText.slice(start, end).trim();
}

export function lineContentDensity(lines: LineSpan[], from: number, toExclusive: number) {
  const slice = lines.slice(from, toExclusive).filter((l) => !l.isBlank);
  const text = slice.map((l) => l.text).join('\n');
  const lineCount = slice.length;
  const charCount = text.length;
  const bulletLines = slice.filter((l) => /^[\s]*(?:[-–—•·▪‣●]|\d+[\.\)])\s+/m.test(l.text)).length;
  const dateHits = (text.match(/\b(?:19|20)\d{2}\b|present|current/gi) || []).length;
  const commaHits = (text.match(/,/g) || []).length;
  const locationHits = (
    text.match(
      /\b(?:remote|hybrid|india|usa|uk|canada|australia|bhopal|delhi|mumbai|bangalore|hyderabad|pune)\b/gi
    ) || []
  ).length;
  const skillishLines = slice.filter((l) => {
    const t = l.text.trim();
    return t.length <= 90 && t.includes(',') && t.split(',').length >= 3;
  }).length;

  return {
    lineCount,
    charCount,
    bulletDensity: lineCount > 0 ? bulletLines / lineCount : 0,
    dateDensity: lineCount > 0 ? dateHits / lineCount : 0,
    commaDensity: lineCount > 0 ? commaHits / lineCount : 0,
    locationDensity: lineCount > 0 ? locationHits / lineCount : 0,
    skillLineDensity: lineCount > 0 ? skillishLines / lineCount : 0,
  };
}
