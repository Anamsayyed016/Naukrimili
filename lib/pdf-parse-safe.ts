/**
 * Safe pdf-parse import for Next.js standalone/server bundles.
 * The package entry (index.js) runs a debug read of ./test/data/05-versions-space.pdf
 * when module.parent is falsy — which breaks in webpack.
 */
export async function parsePdfBuffer(buffer: Buffer): Promise<{
  text: string;
  numpages: number;
}> {
  const mod = await import('pdf-parse/lib/pdf-parse.js');
  const pdfParse = (mod as { default?: (b: Buffer) => Promise<{ text: string; numpages?: number }> }).default;
  if (typeof pdfParse !== 'function') {
    throw new Error('pdf-parse/lib/pdf-parse.js did not export a parser function');
  }
  const data = await pdfParse(buffer);
  return {
    text: data.text || '',
    numpages: data.numpages ?? 0,
  };
}
