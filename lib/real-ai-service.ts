import OpenAI from 'openai';
import { PDFExtract } from 'pdf.js-extract';
import mammoth from 'mammoth';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class RealAIService {
  
  // Extract text from PDF
  async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const pdfExtract = new PDFExtract();
      const data = await pdfExtract.extractBuffer(buffer);
      return data.pages.map(page => 
        page.content.map(item => item.str).join(' ')
      ).join('\n');
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  // Extract text from DOCX
  async extractTextFromDOCX(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('DOCX extraction error:', error);
      throw new Error('Failed to extract text from DOCX');
    }
  }

  // Parse resume with OpenAI GPT-4
  async parseResumeWithAI(text: string): Promise<any> {
    try {
      const prompt = `
        Parse the following resume text and extract structured information in JSON format:
        
        ${text}
        
        Please extract and return ONLY a valid JSON object with these fields:
        {
          "personalInfo": {
            "name": "Full Name",
            "email": "email@example.com",
            "phone": "phone number",
            "location": "city, state/country"
          },
          "experience": [
            {
              "company": "Company Name",
              "position": "Job Title",
              "duration": "Start - End dates",
              "description": "Brief description of role and achievements"
            }
          ],
          "education": [
            {
              "degree": "Degree Name",
              "field": "Field of Study",
              "institution": "University/College Name",
              "year": "Graduation Year"
            }
          ],
          "skills": ["skill1", "skill2", "skill3"],
          "summary": "Professional summary in 2-3 sentences",
          "certifications": ["cert1", "cert2"],
          "languages": ["language1", "language2"]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional resume parser. Extract information accurately and return only valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const parsedData = JSON.parse(content);
      return parsedData;

    } catch (error) {
      console.error('OpenAI parsing error:', error);
      throw new Error('Failed to parse resume with AI');
    }
  }

  // Calculate real ATS score
  calculateATSScore(resumeData: Record<string, unknown>): number {
    let score = 0;
    const maxScore = 100;

    // Contact information (20 points)
    if (resumeData.personalInfo?.email) score += 10;
    if (resumeData.personalInfo?.phone) score += 10;

    // Experience (30 points)
    if (resumeData.experience?.length > 0) score += 15;
    if (resumeData.experience?.length > 2) score += 15;

    // Education (15 points)
    if (resumeData.education?.length > 0) score += 15;

    // Skills (20 points)
    if (resumeData.skills?.length >= 5) score += 10;
    if (resumeData.skills?.length >= 10) score += 10;

    // Professional summary (10 points)
    if (resumeData.summary && resumeData.summary.length > 50) score += 10;

    // Certifications (5 points)
    if (resumeData.certifications?.length > 0) score += 5;

    return Math.min(score, maxScore);
  }

  // Generate improvement suggestions
  generateSuggestions(resumeData: Record<string, unknown>, atsScore: number): string[] {
    const suggestions = [];

    if (atsScore < 60) {
      suggestions.push("Your resume needs significant improvement for ATS compatibility");
    }

    if (!resumeData.personalInfo?.email) {
      suggestions.push("Add a professional email address");
    }

    if (!resumeData.personalInfo?.phone) {
      suggestions.push("Include your phone number");
    }

    if (resumeData.skills?.length < 5) {
      suggestions.push("Add more relevant technical skills");
    }

    if (!resumeData.summary || resumeData.summary.length < 50) {
      suggestions.push("Add a professional summary section");
    }

    if (resumeData.experience?.length < 2) {
      suggestions.push("Include more work experience details");
    }

    if (resumeData.certifications?.length === 0) {
      suggestions.push("Add relevant certifications to stand out");
    }

    return suggestions;
  }

  // Main processing function
  async processResume(file: File): Promise<any> {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      let text = '';

      // Extract text based on file type
      if (file.type === 'application/pdf') {
        text = await this.extractTextFromPDF(buffer);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        text = await this.extractTextFromDOCX(buffer);
      } else {
        throw new Error('Unsupported file type');
      }

      // Parse with AI
      const resumeData = await this.parseResumeWithAI(text);
      
      // Calculate ATS score
      const atsScore = this.calculateATSScore(resumeData);
      
      // Generate suggestions
      const suggestions = this.generateSuggestions(resumeData, atsScore);

      return {
        resumeData,
        atsScore,
        suggestions,
        extractedText: text.substring(0, 500) // First 500 chars for preview
      };

    } catch (error) {
      console.error('Resume processing error:', error);
      throw error;
    }
  }
}

export const realAIService = new RealAIService();