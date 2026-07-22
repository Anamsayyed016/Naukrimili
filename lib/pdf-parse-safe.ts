/**
 * Safe pdf-parse import for Next.js standalone/server bundles.
 * The package entry (index.js) runs a debug read of ./test/data/05-versions-space.pdf
 * when module.parent is falsy — which breaks in webpack.
 *
 * When pdf-parse fails (broken xref / illegal chars), falls back to content-stream
 * text recovery so resumes with recoverable embedded text are not abandoned.
 *
 * Some WeasyPrint / broken-flate PDFs intermittently throw inside pdf.js; we retry
 * once and prefer the longest usable extract (structure parse vs stream recovery).
 */
import {
  isUsableRecoveredPdfText,
  recoverTextFromPdfContentStreams,
} from '@/lib/pdf-stream-text-recovery';

function wordCount(text: string): number {
  return (text.match(/[a-zA-Z]{3,}/g) || []).length;
}

function isThinHeadingOnlyExtract(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  const words = wordCount(t);
  // Short extracts that are mostly section titles / font metadata, not prose bodies.
  if (t.length < 900 && words < 120) {
    const headingHits = (
      t.match(
        /\b(?:summary|objective|experience|education|qualification|skills?|projects?|certifications?|declaration|profile|hobbies?|achievements?|awards?)\b/gi
      ) || []
    ).length;
    const hasProseSentence = /[a-z]{3,}\s+[a-z]{3,}[.!?]/i.test(t) || /\b(?:responsible|managed|worked|developed|years?)\b/i.test(t);
    if (headingHits >= 3 && !hasProseSentence) return true;
  }
  return false;
}

async function tryPdfParse(
  buffer: Buffer
): Promise<{ text: string; numpages: number } | null> {
  try {
    const mod = await import('pdf-parse/lib/pdf-parse.js');
    const pdfParse = (mod as { default?: (b: Buffer) => Promise<{ text: string; numpages?: number }> })
      .default;
    if (typeof pdfParse !== 'function') return null;
    const data = await pdfParse(buffer);
    return { text: data.text || '', numpages: data.numpages ?? 0 };
  } catch {
    return null;
  }
}

export async function parsePdfBuffer(buffer: Buffer): Promise<{
  text: string;
  numpages: number;
  recoveredFromStreams?: boolean;
}> {
  let best = await tryPdfParse(buffer);
  // Intermittent flate/xref failures — one retry often recovers full text.
  if (!best || isThinHeadingOnlyExtract(best.text) || wordCount(best.text) < 15) {
    const retry = await tryPdfParse(buffer);
    if (
      retry &&
      (!best ||
        retry.text.length > best.text.length ||
        (isThinHeadingOnlyExtract(best.text) && !isThinHeadingOnlyExtract(retry.text)))
    ) {
      best = retry;
    }
  }

  const streamRecovered = recoverTextFromPdfContentStreams(buffer);
  const streamUsable = isUsableRecoveredPdfText(streamRecovered);

  if (best && best.text.trim().length >= 80 && wordCount(best.text) >= 15) {
    // Prefer structure parse unless it is heading-only and streams are richer.
    if (
      isThinHeadingOnlyExtract(best.text) &&
      streamUsable &&
      streamRecovered.length > best.text.length * 1.2
    ) {
      return {
        text: streamRecovered,
        numpages: best.numpages,
        recoveredFromStreams: true,
      };
    }
    return {
      text: best.text,
      numpages: best.numpages,
    };
  }

  if (streamUsable && (!best || streamRecovered.length > (best.text?.length ?? 0))) {
    return {
      text: streamRecovered,
      numpages: best?.numpages ?? 0,
      recoveredFromStreams: true,
    };
  }

  if (best) {
    return { text: best.text, numpages: best.numpages };
  }

  if (streamUsable) {
    return { text: streamRecovered, numpages: 0, recoveredFromStreams: true };
  }

  throw new Error('PDF text extraction failed (structure parse and stream recovery)');
}

/** Exported for upload OCR gating — heading-only thin extracts should attempt OCR. */
export function isPdfTextTooThinForParsing(text: string): boolean {
  return isThinHeadingOnlyExtract(text) || wordCount(text) < 25;
}
