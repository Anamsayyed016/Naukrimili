export class PDFExtractor {
  static async extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      console.log('📄 Extracting text from buffer, mime type:', mimeType);
      
      // Check if it's a PDF and try pdf-parse with error handling
      if (mimeType === 'application/pdf') {
        try {
          const { default: pdf } = await import('pdf-parse');
          const data = await pdf(buffer);
          const text = data.text;
          
          if (text && text.length > 50) {
            console.log('✅ PDF buffer text extraction completed with pdf-parse, length:', text.length);
            return text;
          }
        } catch (pdfError) {
          console.log('⚠️ pdf-parse failed for buffer, using fallback method:', pdfError.message);
        }
      }
      
      // For other file types or if pdf-parse fails, use basic buffer conversion
      const text = buffer.toString('utf8');
      
      console.log('✅ Buffer text extraction completed with fallback, length:', text.length);
      
      return text;
      
    } catch (error) {
      console.error('❌ Buffer text extraction failed:', error);
      throw new Error(`Failed to extract text from buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static getFileType(mimeType: string): string {
    switch (mimeType) {
      case 'application/pdf':
        return 'pdf';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'docx';
      case 'application/msword':
        return 'doc';
      default:
        return 'unknown';
    }
  }

  static isSupportedFileType(mimeType: string): boolean {
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    return supportedTypes.includes(mimeType);
  }
}

export default PDFExtractor;
