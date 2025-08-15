import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

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
  
  async extractTextFromFile(filePath: string, fileType: string): Promise<string> {
    try {
      if (fileType === 'pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
      } else if (fileType === 'docx' || fileType === 'doc') {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      console.error('Text extraction error:', error);
      throw new Error(`Failed to extract text from ${fileType} file`);
    }
  }

  async analyzeResume(text: string): Promise<ExtractedResumeData> {
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
    
    // Text length factor
    if (text.length > 1000) confidence += 20;
    else if (text.length > 500) confidence += 15;
    else if (text.length > 200) confidence += 10;
    
    // Email found
    if (this.extractEmail(text)) confidence += 20;
    
    // Phone found
    if (this.extractPhone(text)) confidence += 15;
    
    // Skills found
    const skills = this.extractSkills(text);
    confidence += Math.min(skills.length * 3, 20);
    
    // Education found
    const education = this.extractEducation(text);
    confidence += Math.min(education.length * 5, 15);
    
    // Experience found
    const experience = this.extractExperience(text);
    confidence += Math.min(experience.length * 5, 15);
    
    return Math.min(confidence, 95); // Cap at 95%
  }
}

export default RealResumeService;
