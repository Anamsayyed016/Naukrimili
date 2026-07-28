/**
 * DOCX text extraction that preserves header/footer identity blocks.
 *
 * mammoth.extractRawText() only reads the document body. Many production
 * resumes place the candidate name in the header and email/phone in the
 * footer — those are invisible to mammoth and never reach the parser.
 *
 * This module merges:
 *   1. OOXML header text (top)
 *   2. mammoth body text (middle)
 *   3. OOXML footer text (bottom)
 *
 * Generic for every .docx — no resume-specific rules.
 */

import JSZip from 'jszip';

export interface DocxExtractedText {
  text: string;
  bodyText: string;
  headerText: string;
  footerText: string;
  source: 'mammoth+ooxml' | 'mammoth' | 'ooxml' | 'empty';
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/** Paragraph-aware OOXML text: join runs within a paragraph, newline between paragraphs. */
export function extractTextFromOoxmlXml(xml: string): string {
  if (!xml || typeof xml !== 'string') return '';
  const paragraphs = xml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const runs = [...paragraph.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map((m) =>
      decodeXmlEntities(m[1] || '')
    );
    const line = runs.join('').replace(/\s+/g, ' ').trim();
    if (line) lines.push(line);
  }
  if (lines.length > 0) return lines.join('\n');

  // Fallback: flat run join when paragraph markup is unusual.
  const flat = [...xml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)]
    .map((m) => decodeXmlEntities(m[1] || ''))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  return flat;
}

/**
 * Soft-split glued contact labels so email/phone extractors see line boundaries.
 * Generic — works for any "Email Id: x  Mobile +91…" footer line.
 */
export function softSplitContactLabels(text: string): string {
  return String(text || '')
    .replace(/\b(Email\s*Id|E-?mail|Phone|Mobile|Tel|LinkedIn|GitHub)\s*:\s*/gi, '\n$1: ')
    .replace(/\b(Mobile|Phone|Tel)\s+(\+?\d)/gi, '\n$1 $2')
    // Demographics glued onto the name line in headers ("Alex Rivera Female Age 40 years").
    .replace(
      /\s+\b(Female|Male|Non[-\s]?Binary|Other)\b/gi,
      '\n$1'
    )
    .replace(/\s+\b(Age\s*[:\-]?\s*\d{1,3}(?:\s*years?)?)\b/gi, '\n$1')
    .replace(/\s+\b(Date\s+of\s+Birth|D\.?O\.?B\.?)\b/gi, '\n$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function uniqueNonEmpty(parts: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const t = part.trim();
    if (!t) continue;
    const key = t.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

async function readZipTextFiles(
  buffer: Buffer,
  matcher: (path: string) => boolean
): Promise<string[]> {
  const zip = await JSZip.loadAsync(buffer);
  const texts: string[] = [];
  const entries = Object.keys(zip.files).sort();
  for (const path of entries) {
    if (!matcher(path)) continue;
    const file = zip.files[path];
    if (!file || file.dir) continue;
    try {
      const xml = await file.async('string');
      const text = extractTextFromOoxmlXml(xml);
      if (text) texts.push(text);
    } catch {
      /* skip unreadable part */
    }
  }
  return texts;
}

export async function extractDocxOoxmlParts(buffer: Buffer): Promise<{
  headerText: string;
  footerText: string;
  bodyText: string;
}> {
  const headers = await readZipTextFiles(buffer, (p) =>
    /^word\/header\d+\.xml$/i.test(p.replace(/\\/g, '/'))
  );
  const footers = await readZipTextFiles(buffer, (p) =>
    /^word\/footer\d+\.xml$/i.test(p.replace(/\\/g, '/'))
  );
  const bodies = await readZipTextFiles(buffer, (p) => {
    const norm = p.replace(/\\/g, '/');
    return norm === 'word/document.xml';
  });

  return {
    headerText: softSplitContactLabels(uniqueNonEmpty(headers).join('\n')),
    footerText: softSplitContactLabels(uniqueNonEmpty(footers).join('\n')),
    bodyText: softSplitContactLabels(uniqueNonEmpty(bodies).join('\n\n')),
  };
}

function mergeDocxTextParts(headerText: string, bodyText: string, footerText: string): string {
  // Header first (name), body, footer last (email/phone) — matches visual resume order
  // and identity scan zones (header + footer).
  return uniqueNonEmpty([headerText, bodyText, footerText]).join('\n\n');
}

/**
 * Production DOCX extractor: mammoth body + OOXML headers/footers.
 */
export async function extractTextFromDocxBuffer(buffer: Buffer): Promise<DocxExtractedText> {
  let mammothBody = '';
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    mammothBody = String(result?.value || '').trim();
  } catch {
    mammothBody = '';
  }

  let headerText = '';
  let footerText = '';
  let ooxmlBody = '';
  try {
    const parts = await extractDocxOoxmlParts(buffer);
    headerText = parts.headerText;
    footerText = parts.footerText;
    ooxmlBody = parts.bodyText;
  } catch {
    /* OOXML optional — mammoth-only still returned below */
  }

  const bodyText = mammothBody || ooxmlBody;
  const text = mergeDocxTextParts(headerText, bodyText, footerText);

  let source: DocxExtractedText['source'] = 'empty';
  if (mammothBody && (headerText || footerText)) source = 'mammoth+ooxml';
  else if (mammothBody) source = 'mammoth';
  else if (headerText || footerText || ooxmlBody) source = 'ooxml';

  return {
    text,
    bodyText,
    headerText,
    footerText,
    source,
  };
}
