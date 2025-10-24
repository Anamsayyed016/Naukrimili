import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ExtractedResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  jobTitle: string;
  skills: string[];
  education: string[];
  experience: string[];
  linkedin: string;
  portfolio: string;
  expectedSalary: string;
  preferredJobType: string;
  confidence: number;
  rawText: string;
}

export class RealResumeService {
  
  /**
   * Save resume to PostgreSQL database
   */
  async saveResume(resumeData: any): Promise<any> {
    try {
      console.log('💾 Saving resume to database:', resumeData);
      
      // Extract user ID from the data
      const userId = resumeData.userId || 1; // Default to user 1 if not provided
      
      // Save to database using Prisma
      const savedResume = await prisma.resume.create({
        data: {
          userId: parseInt(userId.toString()),
          fileName: resumeData.fileName || 'resume',
          fileUrl: resumeData.fileUrl || '',
          fileSize: resumeData.fileSize || 0,
          mimeType: resumeData.mimeType || 'application/json',
          parsedData: resumeData.parsedData || resumeData,
          atsScore: resumeData.atsScore || 0,
        },
      });

      console.log('✅ Resume saved to database:', savedResume);
      
      return {
        id: savedResume.id,
        userId: savedResume.userId,
        data: savedResume.parsedData,
        createdAt: savedResume.createdAt,
        updatedAt: savedResume.updatedAt,
        versions: [savedResume.parsedData],
        metadata: {
          atsScore: savedResume.atsScore,
          completeness: 85, // Default completeness score
          lastAnalyzed: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ Database save error:', error);
      throw new Error(`Failed to save resume to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get resume record by ID
   */
  async getResumeRecord(resumeId: string, userId: string): Promise<any> {
    try {
      const resume = await prisma.resume.findFirst({
        where: {
          id: parseInt(resumeId),
          userId: parseInt(userId),
        },
      });
      
      if (!resume) {
        return null;
      }
      
      return {
        id: resume.id,
        userId: resume.userId,
        data: resume.parsedData,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
        versions: [resume.parsedData],
        metadata: {
          atsScore: resume.atsScore,
          completeness: 85,
          lastAnalyzed: resume.updatedAt.toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ Database fetch error:', error);
      throw new Error(`Failed to fetch resume from database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractName(lines: string[]): string {
    // Look for name patterns in first few lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      // Common name patterns
      if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(line) && line.length < 50) {
        return line;
      }
      // All caps name
      if (/^[A-Z\s]{3,30}$/.test(line) && line.split(' ').length >= 2) {
        return line;
      }
    }
    return 'Name Not Found';
  }

  private extractEmail(text: string): string {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = text.match(emailRegex);
    return match ? match[0] : '';
  }

  private extractPhone(text: string): string {
    // Indian phone number patterns
    const phoneRegex = /(\+91[\s-]?)?[789]\d{9}|(\+91[\s-]?)?[789]\d{2}[\s-]?\d{3}[\s-]?\d{4}/;
    const match = text.match(phoneRegex);
    return match ? match[0] : '';
  }

  private extractLocation(lines: string[]): string {
    const locationKeywords = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];
    
    for (const line of lines) {
      for (const keyword of locationKeywords) {
        if (line.includes(keyword)) {
          return line;
        }
      }
    }
    return '';
  }

  private extractJobTitle(lines: string[]): string {
    const jobKeywords = ['Engineer', 'Manager', 'Developer', 'Analyst', 'Consultant', 'Specialist', 'Lead', 'Senior'];
    
    for (const line of lines) {
      for (const keyword of jobKeywords) {
        if (line.toLowerCase().includes(keyword.toLowerCase())) {
          return line;
        }
      }
    }
    return '';
  }

  private extractSkills(text: string): string[] {
    const skillKeywords = [
      'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'SQL', 'MongoDB',
      'AWS', 'Docker', 'Kubernetes', 'Git', 'HTML', 'CSS', 'TypeScript', 'Angular',
      'Vue.js', 'Express.js', 'Django', 'Flask', 'Spring', 'Hibernate', 'JUnit',
      'HR Management', 'Recruitment', 'Employee Relations', 'Performance Management',
      'HRIS', 'Compliance', 'Talent Acquisition', 'Training & Development'
    ];

    const foundSkills: string[] = [];
    for (const skill of skillKeywords) {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    }

    return foundSkills.slice(0, 10); // Limit to 10 skills
  }

  private extractEducation(lines: string[]): string[] {
    const education: string[] = [];
    const eduKeywords = ['University', 'College', 'Institute', 'School', 'Bachelor', 'Master', 'PhD', 'B.Tech', 'MBA'];
    
    for (const line of lines) {
      for (const keyword of eduKeywords) {
        if (line.includes(keyword)) {
          education.push(line);
          break;
        }
      }
    }
    
    return education.slice(0, 5); // Limit to 5 education entries
  }

  private extractExperience(lines: string[]): string[] {
    const experience: string[] = [];
    const expKeywords = ['Experience', 'Work', 'Employment', 'Career', 'Job'];
    
    let inExperienceSection = false;
    for (const line of lines) {
      if (expKeywords.some(keyword => line.includes(keyword))) {
        inExperienceSection = true;
        continue;
      }
      
      if (inExperienceSection && line.length > 20 && line.length < 200) {
        experience.push(line);
      }
    }
    
    return experience.slice(0, 5); // Limit to 5 experience entries
  }

  private extractLinkedIn(text: string): string {
    const linkedinRegex = /https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+/;
    const match = text.match(linkedinRegex);
    return match ? match[0] : '';
  }

  private extractPortfolio(text: string): string {
    const portfolioRegex = /https?:\/\/(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/;
    const match = text.match(portfolioRegex);
    return match ? match[0] : '';
  }

  private extractSalary(text: string): string {
    const salaryRegex = /(\d{1,2}[-–]\d{1,2})\s*(LPA|Lakh|K|Cr)/i;
    const match = text.match(salaryRegex);
    return match ? match[0] : '';
  }

  private extractJobType(text: string): string {
    const jobTypeKeywords = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
    
    for (const keyword of jobTypeKeywords) {
      if (text.includes(keyword)) {
        return keyword;
      }
    }
    return 'Full-time'; // Default
  }

  private calculateConfidence(text: string): number {
    let confidence = 0;
    
    // Check for essential elements
    if (text.length > 100) confidence += 20;
    if (this.extractEmail(text)) confidence += 20;
    if (this.extractPhone(text)) confidence += 20;
    if (this.extractSkills(text).length > 0) confidence += 20;
    if (this.extractEducation(text.split('\n')).length > 0) confidence += 20;
    
    return Math.min(100, confidence);
  }

  // Add missing methods for text extraction
  private extractTextFromDOCX(buffer: Buffer): Promise<string> {
    // For now, return a placeholder since mammoth might not be available
    return Promise.resolve('DOCX content extracted');
  }

  // Enhanced text extraction with better error handling
  async extractTextFromFile(filePath: string, fileType: string): Promise<string> {
    try {
      if (fileType === 'application/pdf') {
        try {
          const dataBuffer = fs.readFileSync(filePath);
          const pdfModule = await import('pdf-parse');
          const data = await (pdfModule.default || (pdfModule as any))(dataBuffer);
          return data.text;
        } catch (pdfError) {
          console.warn('PDF parsing failed, using fallback:', pdfError);
          return this.getFallbackText(filePath);
        }
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileType === 'application/msword') {
        try {
          const mammothModule = await import('mammoth');
          const result = await (mammothModule as any).default.extractRawText({ path: filePath });
          return result.value;
        } catch (docError) {
          console.warn('DOC parsing failed, using fallback:', docError);
          return this.getFallbackText(filePath);
        }
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error('Text extraction error:', error);
      // Return a fallback text to prevent the process from hanging
      return this.getFallbackText(filePath);
    }
  }

  // Fallback text extraction that doesn't depend on external libraries
  private getFallbackText(filePath: string): string {
    try {
      // Try to read the file as text (works for some file types)
      const content = fs.readFileSync(filePath, 'utf8');
      if (content && content.length > 0) {
        return content;
      }
    } catch (error) {
      console.warn('Fallback text reading failed:', error);
    }
    
    // Return a helpful message
    return 'Resume content could not be automatically extracted. Please fill in your details manually in the form below.';
  }

  // Enhanced resume analysis with better error handling
  async analyzeResume(text: string): Promise<ExtractedResumeData> {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      // Real text analysis and extraction
      const extractedData: ExtractedResumeData = {
        fullName: this.extractName(lines),
        email: this.extractEmail(text),
        phone: this.extractPhone(text),
        location: this.extractLocation(lines),
        jobTitle: this.extractJobTitle(lines),
        skills: this.extractSkills(text),
        education: this.extractEducation(lines),
        experience: this.extractExperience(lines),
        linkedin: this.extractLinkedIn(text),
        portfolio: this.extractPortfolio(text),
        expectedSalary: this.extractSalary(text),
        preferredJobType: this.extractJobType(text),
        confidence: this.calculateConfidence(text),
        rawText: text
      };

      return extractedData;
    } catch (error) {
      console.error('Resume analysis failed:', error);
      // Return a fallback structure to prevent hanging
      return {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        jobTitle: '',
        skills: [],
        education: [],
        experience: [],
        linkedin: '',
        portfolio: '',
        expectedSalary: '',
        preferredJobType: '',
        confidence: 0,
        rawText: text
      };
    }
  }
}

export default RealResumeService;
