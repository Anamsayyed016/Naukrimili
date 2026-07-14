/**
 * Safe pdf-parse import for Next.js standalone/server bundles.
 * The package entry (index.js) runs a debug read of ./test/data/05-versions-space.pdf
 * when module.parent is falsy — which breaks in webpack.
 *
 * When pdf-parse fails (broken xref / illegal chars), falls back to content-stream
 * text recovery so resumes with recoverable embedded text are not abandoned.
 */
import {
  isUsableRecoveredPdfText,
  recoverTextFromPdfContentStreams,
} from '@/lib/pdf-stream-text-recovery';

export async function parsePdfBuffer(buffer: Buffer): Promise<{
  text: string;
  numpages: number;
  recoveredFromStreams?: boolean;
}> {
  try {
    const mod = await import('pdf-parse/lib/pdf-parse.js');
    const pdfParse = (mod as { default?: (b: Buffer) => Promise<{ text: string; numpages?: number }> })
      .default;
    if (typeof pdfParse !== 'function') {
      throw new Error('pdf-parse/lib/pdf-parse.js did not export a parser function');
    }
    const data = await pdfParse(buffer);
    const text = data.text || '';
    const words = text.match(/[a-zA-Z]{3,}/g) || [];
    if (text.trim().length >= 80 && words.length >= 15) {
      return {
        text,
        numpages: data.numpages ?? 0,
      };
    }
    // pdf-parse succeeded but yielded almost nothing — try stream recovery.
    const recovered = recoverTextFromPdfContentStreams(buffer);
    if (isUsableRecoveredPdfText(recovered) && recovered.length > text.length) {
      return { text: recovered, numpages: data.numpages ?? 0, recoveredFromStreams: true };
    }
    return {
      text,
      numpages: data.numpages ?? 0,
    };
  } catch {
    const recovered = recoverTextFromPdfContentStreams(buffer);
    if (isUsableRecoveredPdfText(recovered)) {
      return { text: recovered, numpages: 0, recoveredFromStreams: true };
    }
    throw new Error('PDF text extraction failed (structure parse and stream recovery)');
  }
}
