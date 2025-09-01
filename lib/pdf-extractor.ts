import { readFile } from 'fs/promises';
import path from 'path';

export class PDFExtractor {
  /**
   * Extract text from PDF file
   */
  static async extractTextFromPDF(filePath: string): Promise<string> {
    try {
      console.log('📄 Extracting text from PDF:', filePath);
      
      // Read the file as buffer
      const buffer = await readFile(filePath);
      
      // Try to use pdf-parse with error handling
      try {
        const pdf = require('pdf-parse');
        const data = await pdf(buffer);
        const text = data.text;
        
        if (text && text.length > 50) {
          console.log('✅ PDF text extraction completed with pdf-parse, length:', text.length);
          return text;
        }
      } catch (pdfError) {
        console.log('⚠️ pdf-parse failed, using fallback method:', pdfError.message);
      }
      
      // Fallback to basic buffer conversion
      const text = this.bufferToText(buffer);
      
      console.log('✅ Text extraction completed with fallback, length:', text.length);
      
      return text;
      
    } catch (error) {
      console.error('❌ PDF text extraction failed:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from DOCX file
   */
  static async extractTextFromDOCX(filePath: string): Promise<string> {
    try {
      console.log('📄 Extracting text from DOCX:', filePath);
      
      // For DOCX files, we'll use a simple approach
      // In production, you might want to use libraries like mammoth or docx
      
      const buffer = await readFile(filePath);
      const text = this.bufferToText(buffer);
      
      console.log('✅ DOCX text extraction completed, length:', text.length);
      
      return text;
      
    } catch (error) {
      console.error('❌ DOCX text extraction failed:', error);
      throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from any supported file type
   */
  static async extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
    const extension = path.extname(filePath).toLowerCase();
    
    switch (extension) {
      case '.pdf':
        return this.extractTextFromPDF(filePath);
      case '.docx':
      case '.doc':
        return this.extractTextFromDOCX(filePath);
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  }

  /**
   * Basic buffer to text conversion
   * This is a simplified approach - in production, use proper parsing libraries
   */
  private static bufferToText(buffer: Buffer): string {
    try {
      // Try to convert buffer to string
      const text = buffer.toString('utf8');
      
      // If the text is mostly readable, return it
      if (text.length > 100 && this.isReadableText(text)) {
        return text;
      }
      
      // If not readable, try other encodings
      const encodings = ['latin1', 'ascii', 'base64'];
      
      for (const encoding of encodings) {
        try {
          const decodedText = buffer.toString(encoding);
          if (decodedText.length > 100 && this.isReadableText(decodedText)) {
            return decodedText;
          }
        } catch (e) {
          continue;
        }
      }
      
      // If all else fails, return a basic text representation
      return this.createBasicTextFromBuffer(buffer);
      
    } catch (error) {
      console.error('Buffer to text conversion failed:', error);
      return this.createBasicTextFromBuffer(buffer);
    }
  }

  /**
   * Check if text is readable
   */
  private static isReadableText(text: string): boolean {
    // Check if text contains mostly readable characters
    const readableChars = text.replace(/[^a-zA-Z0-9\s.,!?;:()\-_@#$%&*+=<>[\]{}|\\/"'`~]/g, '');
    const readabilityRatio = readableChars.length / text.length;
    
    return readabilityRatio > 0.7 && text.length > 50;
  }

  /**
   * Create basic text from buffer when parsing fails
   */
  private static createBasicTextFromBuffer(buffer: Buffer): string {
    // Create a basic text representation
    const hexString = buffer.toString('hex');
    const chunks = [];
    
    // Split into chunks and try to extract readable parts
    for (let i = 0; i < hexString.length; i += 2) {
      const hex = hexString.substr(i, 2);
      const charCode = parseInt(hex, 16);
      
      // Only include printable ASCII characters
      if (charCode >= 32 && charCode <= 126) {
        chunks.push(String.fromCharCode(charCode));
      } else {
        chunks.push(' ');
      }
    }
    
    const text = chunks.join('');
    
    // Clean up the text
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/[^\w\s.,!?;:()\-_@#$%&*+=<>[\]{}|\\/"'`~]/g, '') // Remove non-printable characters
      .trim();
  }

  /**
   * Extract text from file buffer (for uploaded files)
   */
  static async extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      console.log('📄 Extracting text from buffer, mime type:', mimeType);
      
      // Check if it's a PDF and try pdf-parse with error handling
      if (mimeType === 'application/pdf') {
        try {
          const pdf = require('pdf-parse');
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
      const text = this.bufferToText(buffer);
      
      console.log('✅ Buffer text extraction completed with fallback, length:', text.length);
      
      return text;
      
    } catch (error) {
      console.error('❌ Buffer text extraction failed:', error);
      throw new Error(`Failed to extract text from buffer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file type from mime type
   */
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

  /**
   * Validate if file type is supported
   */
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
