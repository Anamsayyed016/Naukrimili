/**
 * Recover readable text from PDF content streams when xref/structure parsing fails.
 * Inflates FlateDecode streams and extracts Tj / TJ string operators.
 * Generic — no resume-specific rules.
 */

import zlib from 'zlib';

function decodePdfLiteral(raw: string): string {
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\(\d{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}

function readableRatio(s: string): number {
  if (!s) return 0;
  const letters = (s.match(/[A-Za-z]/g) || []).length;
  return letters / Math.max(s.length, 1);
}

function extractLiteralsFromContent(payload: string): string[] {
  const out: string[] = [];
  for (const m of payload.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj/g)) {
    const lit = m[0].replace(/\s*Tj\s*$/, '');
    out.push(decodePdfLiteral(lit.slice(1, -1)));
  }
  for (const m of payload.matchAll(/\[(.*?)\]\s*TJ/gs)) {
    const parts: string[] = [];
    for (const lit of m[1].matchAll(/\((?:\\.|[^\\)])*\)/g)) {
      parts.push(decodePdfLiteral(lit[0].slice(1, -1)));
    }
    if (parts.length) out.push(parts.join(''));
  }
  if (out.length === 0) {
    for (const lit of payload.matchAll(/\((?:\\.|[^\\)])*\)/g)) {
      const t = decodePdfLiteral(lit[0].slice(1, -1));
      if (/[A-Za-z]{2}/.test(t)) out.push(t);
    }
  }
  return out;
}

function stitchTokens(toks: string[]): string {
  const lines: string[] = [];
  let line = '';
  for (const raw of toks) {
    const t = raw.replace(/\s+/g, ' ').trim();
    if (!t) continue;
    if (!line) {
      line = t;
      continue;
    }
    const gapJoin =
      /[A-Za-z0-9)]$/.test(line) &&
      /^[a-z]/.test(t) &&
      t.length < 24 &&
      !/[.?:!;]$/.test(line);
    const spaceJoin =
      /[A-Za-z0-9)]$/.test(line) &&
      /^[A-Za-z0-9(]/.test(t) &&
      t.length < 40 &&
      !/[.?:!;]$/.test(line);
    if (gapJoin) line += t;
    else if (spaceJoin) line += ` ${t}`;
    else {
      lines.push(line);
      line = t;
    }
  }
  if (line) lines.push(line);
  return lines.join('\n');
}

/** True when recovered text looks like real resume prose, not binary noise. */
export function isUsableRecoveredPdfText(text: string): boolean {
  const t = (text || '').trim();
  if (t.length < 120) return false;
  const words = t.match(/[A-Za-z]{3,}/g) || [];
  if (words.length < 25) return false;
  return readableRatio(t) >= 0.45;
}

/**
 * Best-effort text extraction from content streams after pdf.js / pdf-parse
 * fails on broken xref tables or illegal characters.
 */
export function recoverTextFromPdfContentStreams(buffer: Buffer): string {
  if (!buffer?.length) return '';
  const latin = buffer.toString('latin1');
  if (!latin.includes('stream')) return '';

  const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  const pageChunks: string[][] = [];
  let m: RegExpExecArray | null;

  while ((m = streamRe.exec(latin))) {
    const raw = Buffer.from(m[1], 'latin1');
    let decoded: Buffer | null = null;
    try {
      decoded = zlib.inflateSync(raw);
    } catch {
      try {
        decoded = zlib.unzipSync(raw);
      } catch {
        decoded = null;
      }
    }
    const payload = (decoded || raw).toString('latin1');
    if (!/Tj|TJ|BT/.test(payload) && readableRatio(payload) < 0.35) continue;

    const literals = extractLiteralsFromContent(payload)
      .map((t) => t.replace(/\s+/g, ' ').trim())
      .filter(
        (t) =>
          Boolean(t) &&
          t.length < 500 &&
          readableRatio(t) >= 0.4 &&
          !/^PDFXC/i.test(t) &&
          !/^[\x00-\x08\x0e-\x1f]+/.test(t)
      );
    if (literals.length >= 3) pageChunks.push(literals);
  }

  if (!pageChunks.length) return '';

  return pageChunks
    .map(stitchTokens)
    .join('\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
