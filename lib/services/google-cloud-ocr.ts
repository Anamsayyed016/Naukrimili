/**
 * Google Cloud Vision OCR Service
 * Extracts text from images for resume parsing and auto-suggestions
 */

export interface OCRResult {
  text: string;
  confidence: number;
  detectedLanguages: string[];
}

export class GoogleCloudOCRService {
  private apiKey: string | null;

  constructor() {
    this.apiKey = process.env.GOOGLE_CLOUD_OCR_API_KEY || 
                  process.env.GOOGLE_CLOUD_API_KEY || 
                  process.env.GOOGLE_VISION_API_KEY || 
                  null;
    
    if (!this.apiKey) {
      console.warn('⚠️ Google Cloud OCR API key not found. OCR features will be disabled.');
    }
  }

  /**
   * Extract text from image using Google Cloud Vision API
   */
  async extractTextFromImage(imageBase64: string): Promise<OCRResult> {
    if (!this.apiKey) {
      throw new Error('Google Cloud OCR API key not configured');
    }

    try {
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
                },
                features: [
                  {
                    type: 'TEXT_DETECTION',
                    maxResults: 10,
                  },
                  {
                    type: 'DOCUMENT_TEXT_DETECTION',
                    maxResults: 10,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Google Cloud Vision API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const textAnnotations = data.responses[0]?.textAnnotations || [];
      const fullTextAnnotation = data.responses[0]?.fullTextAnnotation;

      if (textAnnotations.length === 0 && !fullTextAnnotation) {
        return {
          text: '',
          confidence: 0,
          detectedLanguages: [],
        };
      }

      // Extract full text (first annotation contains all text)
      const extractedText = fullTextAnnotation?.text || textAnnotations[0]?.description || '';
      
      // Calculate average confidence
      const confidences = textAnnotations
        .slice(1) // Skip first annotation (full text)
        .map((annotation: any) => annotation.confidence || 0)
        .filter((conf: number) => conf > 0);
      
      const avgConfidence = confidences.length > 0
        ? confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length
        : 0.9; // Default confidence if not provided

      // Extract detected languages
      const languages = fullTextAnnotation?.pages?.[0]?.property?.detectedLanguages?.map(
        (lang: any) => lang.languageCode
      ) || [];

      return {
        text: extractedText.trim(),
        confidence: avgConfidence,
        detectedLanguages: languages,
      };
    } catch (error: any) {
      console.error('Google Cloud OCR error:', error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  /**
   * Extract structured data from resume image
   * Uses OCR to extract text and then parses it into resume sections
   */
  async extractResumeData(imageBase64: string): Promise<{
    personalInfo: Record<string, string>;
    experience: Array<Record<string, string>>;
    education: Array<Record<string, string>>;
    skills: string[];
    summary: string;
  }> {
    const ocrResult = await this.extractTextFromImage(imageBase64);
    
    // Basic parsing of OCR text into resume sections
    // This is a simplified parser - can be enhanced with AI
    const text = ocrResult.text;
    const lines = text.split('\n').filter(line => line.trim().length > 0);

    const personalInfo: Record<string, string> = {};
    const experience: Array<Record<string, string>> = [];
    const education: Array<Record<string, string>> = [];
    const skills: string[] = [];
    let summary = '';

    let currentSection = '';
    let currentEntry: Record<string, string> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lowerLine = line.toLowerCase();

      // Detect sections
      if (lowerLine.includes('experience') || lowerLine.includes('work history')) {
        currentSection = 'experience';
        continue;
      }
      if (lowerLine.includes('education') || lowerLine.includes('academic')) {
        currentSection = 'education';
        continue;
      }
      if (lowerLine.includes('skill')) {
        currentSection = 'skills';
        continue;
      }
      if (lowerLine.includes('summary') || lowerLine.includes('objective') || lowerLine.includes('profile')) {
        currentSection = 'summary';
        continue;
      }

      // Parse based on current section
      if (currentSection === 'experience' && line.length > 10) {
        // Simple experience parsing
        if (line.match(/\d{4}|\d{2}\/\d{4}/)) {
          // Date pattern - likely new entry
          if (Object.keys(currentEntry).length > 0) {
            experience.push(currentEntry);
          }
          currentEntry = { duration: line };
        } else if (line.length > 5 && line.length < 50) {
          // Likely company or position
          if (!currentEntry.company) {
            currentEntry.company = line;
          } else if (!currentEntry.position) {
            currentEntry.position = line;
          }
        } else {
          // Description
          currentEntry.description = (currentEntry.description || '') + ' ' + line;
        }
      } else if (currentSection === 'education' && line.length > 5) {
        if (line.match(/\d{4}/)) {
          if (Object.keys(currentEntry).length > 0) {
            education.push(currentEntry);
          }
          currentEntry = { year: line };
        } else {
          if (!currentEntry.institution) {
            currentEntry.institution = line;
          } else if (!currentEntry.degree) {
            currentEntry.degree = line;
          }
        }
      } else if (currentSection === 'skills') {
        const skillItems = line.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 0);
        skills.push(...skillItems);
      } else if (currentSection === 'summary') {
        summary += ' ' + line;
      } else if (i < 10) {
        // First few lines likely personal info
        if (line.includes('@')) {
          personalInfo.email = line;
        } else if (line.match(/\+\d|\(\d{3}\)|^\d{3}-?\d{3}-?\d{4}$/)) {
          personalInfo.phone = line;
        } else if (line.length > 2 && line.length < 50 && !personalInfo.name) {
          personalInfo.name = line;
        }
      }
    }

    // Push last entry
    if (currentSection === 'experience' && Object.keys(currentEntry).length > 0) {
      experience.push(currentEntry);
    }
    if (currentSection === 'education' && Object.keys(currentEntry).length > 0) {
      education.push(currentEntry);
    }

    return {
      personalInfo,
      experience,
      education,
      skills: [...new Set(skills)], // Remove duplicates
      summary: summary.trim(),
    };
  }

  /**
   * Check if OCR service is available
   */
  isAvailable(): boolean {
    return this.apiKey !== null;
  }
}

