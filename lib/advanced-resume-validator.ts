/**
 * Advanced Resume Validator & Merger
 * 
 * Validates and merges multiple data sources:
 * 1. Parser output (PyResparser) - may be incomplete or messy
 * 2. Gemini AI parsed output - first draft JSON
 * 3. Original resume text - the ground truth
 * 
 * Features:
 * - Validates email and phone formats
 * - Extracts multiple items where applicable
 * - Corrects mistakes using original text
 * - Returns only valid JSON following strict schema
 * - Non-disruptive to existing codebase
 */

export interface ParsedResumeData {
  name: string;
  email: string;
  phone: string;
  address: string;
  skills: string[];
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  experience: Array<{
    job_title: string;
    company: string;
    start_date: string;
    end_date: string;
    description: string;
  }>;
  projects: string[];
  certifications: string[];
}

export interface DataSource {
  parserData?: any;
  geminiData?: any;
  originalText: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  confidence: number;
}

export class AdvancedResumeValidator {
  private readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private readonly PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;
  private readonly INDIAN_PHONE_REGEX = /^(\+91[\s-]?)?[6-9]\d{9}$/;
  private readonly US_PHONE_REGEX = /^(\+1[\s-]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;

  /**
   * Main entry point - validates and merges all data sources
   */
  async validateAndMerge(dataSources: DataSource): Promise<ParsedResumeData> {
    console.log('🔍 Starting advanced resume validation and merging...');
    
    const { parserData, geminiData, originalText } = dataSources;
    
    // Step 1: Extract and validate individual data sources
    const parserExtracted = this.extractFromParser(parserData);
    const geminiExtracted = this.extractFromGemini(geminiData);
    const textExtracted = this.extractFromOriginalText(originalText);
    
    // Step 2: Merge and validate data
    const mergedData = this.mergeDataSources({
      parser: parserExtracted,
      gemini: geminiExtracted,
      text: textExtracted
    });
    
    // Step 3: Final validation and correction
    const validatedData = this.validateAndCorrect(mergedData, originalText);
    
    console.log('✅ Advanced resume validation completed');
    return validatedData;
  }

  /**
   * Extract data from PyResparser output
   */
  private extractFromParser(parserData: any): Partial<ParsedResumeData> {
    if (!parserData || typeof parserData !== 'object') {
      return {};
    }

    try {
      return {
        name: this.cleanString(parserData.name || parserData.full_name || ''),
        email: this.cleanString(parserData.email || ''),
        phone: this.cleanString(parserData.phone || parserData.mobile || ''),
        address: this.cleanString(parserData.address || parserData.location || ''),
        skills: this.extractArray(parserData.skills || []),
        education: this.extractEducation(parserData.education || []),
        experience: this.extractExperience(parserData.experience || []),
        projects: this.extractArray(parserData.projects || []),
        certifications: this.extractArray(parserData.certifications || [])
      };
    } catch (error) {
      console.warn('⚠️ Error extracting from parser data:', error);
      return {};
    }
  }

  /**
   * Extract data from Gemini AI output
   */
  private extractFromGemini(geminiData: any): Partial<ParsedResumeData> {
    if (!geminiData || typeof geminiData !== 'object') {
      return {};
    }

    try {
      return {
        name: this.cleanString(geminiData.name || ''),
        email: this.cleanString(geminiData.email || ''),
        phone: this.cleanString(geminiData.phone || ''),
        address: this.cleanString(geminiData.address || ''),
        skills: this.extractArray(geminiData.skills || []),
        education: this.extractEducation(geminiData.education || []),
        experience: this.extractExperience(geminiData.experience || []),
        projects: this.extractArray(geminiData.projects || []),
        certifications: this.extractArray(geminiData.certifications || [])
      };
    } catch (error) {
      console.warn('⚠️ Error extracting from Gemini data:', error);
      return {};
    }
  }

  /**
   * Extract data from original resume text using regex patterns
   */
  private extractFromOriginalText(originalText: string): Partial<ParsedResumeData> {
    if (!originalText || typeof originalText !== 'string') {
      return {};
    }

    const text = originalText.trim();
    
    return {
      name: this.extractNameFromText(text),
      email: this.extractEmailFromText(text),
      phone: this.extractPhoneFromText(text),
      address: this.extractAddressFromText(text),
      skills: this.extractSkillsFromText(text),
      education: this.extractEducationFromText(text),
      experience: this.extractExperienceFromText(text),
      projects: this.extractProjectsFromText(text),
      certifications: this.extractCertificationsFromText(text)
    };
  }

  /**
   * Merge data from all sources with priority and conflict resolution
   */
  private mergeDataSources(sources: {
    parser: Partial<ParsedResumeData>;
    gemini: Partial<ParsedResumeData>;
    text: Partial<ParsedResumeData>;
  }): ParsedResumeData {
    console.log('🔄 Merging data from all sources...');

    // Priority order: Original text > Gemini > Parser
    // Original text is considered ground truth for validation
    const merged: ParsedResumeData = {
      name: this.selectBestValue([sources.text.name, sources.gemini.name, sources.parser.name]),
      email: this.selectBestValue([sources.text.email, sources.gemini.email, sources.parser.email]),
      phone: this.selectBestValue([sources.text.phone, sources.gemini.phone, sources.parser.phone]),
      address: this.selectBestValue([sources.text.address, sources.gemini.address, sources.parser.address]),
      skills: this.mergeArrays([sources.text.skills, sources.gemini.skills, sources.parser.skills]),
      education: this.mergeEducation([sources.text.education, sources.gemini.education, sources.parser.education]),
      experience: this.mergeExperience([sources.text.experience, sources.gemini.experience, sources.parser.experience]),
      projects: this.mergeArrays([sources.text.projects, sources.gemini.projects, sources.parser.projects]),
      certifications: this.mergeArrays([sources.text.certifications, sources.gemini.certifications, sources.parser.certifications])
    };

    return merged;
  }

  /**
   * Final validation and correction using original text
   */
  private validateAndCorrect(data: ParsedResumeData, originalText: string): ParsedResumeData {
    console.log('✅ Performing final validation and correction...');

    const corrected: ParsedResumeData = { ...data };

    // Validate and correct email
    if (corrected.email && !this.isValidEmail(corrected.email)) {
      const emailFromText = this.extractEmailFromText(originalText);
      corrected.email = emailFromText || '';
    }

    // Validate and correct phone
    if (corrected.phone && !this.isValidPhone(corrected.phone)) {
      const phoneFromText = this.extractPhoneFromText(originalText);
      corrected.phone = phoneFromText || '';
    }

    // Enhance name if incomplete
    if (!corrected.name || corrected.name.length < 2) {
      const nameFromText = this.extractNameFromText(originalText);
      corrected.name = nameFromText || '';
    }

    // Remove duplicates and clean arrays
    corrected.skills = this.deduplicateArray(corrected.skills);
    corrected.projects = this.deduplicateArray(corrected.projects);
    corrected.certifications = this.deduplicateArray(corrected.certifications);
    corrected.education = this.deduplicateEducation(corrected.education);
    corrected.experience = this.deduplicateExperience(corrected.experience);

    return corrected;
  }

  // ==================== EXTRACTION METHODS ====================

  private extractNameFromText(text: string): string {
    // Look for name patterns at the beginning of resume
    const lines = text.split('\n').slice(0, 10);
    for (const line of lines) {
      const cleanLine = line.trim();
      if (cleanLine.length > 2 && cleanLine.length < 50 && 
          !cleanLine.includes('@') && !cleanLine.includes('+') && 
          !cleanLine.includes('http') && !cleanLine.includes('www') &&
          !cleanLine.toLowerCase().includes('resume') &&
          !cleanLine.toLowerCase().includes('cv')) {
        return cleanLine;
      }
    }
    return '';
  }

  private extractEmailFromText(text: string): string {
    const emailMatch = text.match(this.EMAIL_REGEX);
    return emailMatch ? emailMatch[0] : '';
  }

  private extractPhoneFromText(text: string): string {
    // Try Indian phone format first
    const indianMatch = text.match(this.INDIAN_PHONE_REGEX);
    if (indianMatch) return indianMatch[0];

    // Try US phone format
    const usMatch = text.match(this.US_PHONE_REGEX);
    if (usMatch) return usMatch[0];

    // Try general phone format
    const generalMatch = text.match(this.PHONE_REGEX);
    if (generalMatch) return generalMatch[0];

    return '';
  }

  private extractAddressFromText(text: string): string {
    // Look for location patterns
    const locationPatterns = [
      /(?:address|location|city|state)[:\s]*([^\n]+)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})\s*\d{5}/, // US format
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*India/i
    ];

    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }
    return '';
  }

  private extractSkillsFromText(text: string): string[] {
    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue.js',
      'HTML', 'CSS', 'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker',
      'Git', 'Linux', 'Agile', 'Scrum', 'Machine Learning', 'Data Analysis',
      'TypeScript', 'Express', 'MongoDB', 'Redis', 'GraphQL', 'REST API',
      'CI/CD', 'Kubernetes', 'Jenkins', 'Jest', 'Cypress', 'Selenium'
    ];

    const foundSkills = commonSkills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );

    return foundSkills;
  }

  private extractEducationFromText(text: string): Array<{degree: string; institution: string; year: string}> {
    const education: Array<{degree: string; institution: string; year: string}> = [];
    
    // Look for degree patterns
    const degreePatterns = [
      /(Bachelor|Master|PhD|B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|B\.?E\.?|M\.?E\.?|B\.?Tech|M\.?Tech)\s+[^\n]*(?:in|of)?\s*([^\n]+?)(?:\s+(\d{4})|\s+(\d{4}-\d{4}))/gi,
      /([^\n]+)\s+(University|College|Institute|School)[^\n]*(?:(\d{4})|(\d{4}-\d{4}))/gi
    ];

    for (const pattern of degreePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        education.push({
          degree: this.cleanString(match[1] || match[2]),
          institution: this.cleanString(match[2] || match[1]),
          year: this.cleanString(match[3] || match[4] || '')
        });
      }
    }

    return education.slice(0, 5); // Limit to 5 entries
  }

  private extractExperienceFromText(text: string): Array<{job_title: string; company: string; start_date: string; end_date: string; description: string}> {
    const experience: Array<{job_title: string; company: string; start_date: string; end_date: string; description: string}> = [];
    
    // Look for experience patterns
    const expPatterns = [
      /([^\n]+?)\s+at\s+([^\n]+?)(?:\s+(\d{4})\s*-\s*(\d{4}|\w+))/gi,
      /([^\n]+?)\s+-\s+([^\n]+?)(?:\s+(\d{4})\s*-\s*(\d{4}|\w+))/gi
    ];

    for (const pattern of expPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        experience.push({
          job_title: this.cleanString(match[1]),
          company: this.cleanString(match[2]),
          start_date: this.cleanString(match[3] || ''),
          end_date: this.cleanString(match[4] || ''),
          description: ''
        });
      }
    }

    return experience.slice(0, 10); // Limit to 10 entries
  }

  private extractProjectsFromText(text: string): string[] {
    const projects: string[] = [];
    
    // Look for project patterns
    const projectPatterns = [
      /project[:\s]*([^\n]+)/gi,
      /built\s+([^\n]+)/gi,
      /developed\s+([^\n]+)/gi,
      /created\s+([^\n]+)/gi
    ];

    for (const pattern of projectPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null && projects.length < 10) {
        const project = this.cleanString(match[1]);
        if (project.length > 10) {
          projects.push(project);
        }
      }
    }

    return projects;
  }

  private extractCertificationsFromText(text: string): string[] {
    const certifications: string[] = [];
    
    // Look for certification patterns
    const certPatterns = [
      /certification[:\s]*([^\n]+)/gi,
      /certified\s+in\s+([^\n]+)/gi,
      /([A-Z]{2,}\s+certification)/gi,
      /([^\n]+)\s+certificate/gi
    ];

    for (const pattern of certPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null && certifications.length < 10) {
        const cert = this.cleanString(match[1]);
        if (cert.length > 5) {
          certifications.push(cert);
        }
      }
    }

    return certifications;
  }

  // ==================== UTILITY METHODS ====================

  private cleanString(value: any): string {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/\s+/g, ' ');
  }

  private extractArray(value: any): string[] {
    if (Array.isArray(value)) {
      return value.map(item => this.cleanString(item)).filter(item => item.length > 0);
    }
    return [];
  }

  private extractEducation(value: any): Array<{degree: string; institution: string; year: string}> {
    if (!Array.isArray(value)) return [];
    
    return value.map(edu => ({
      degree: this.cleanString(edu.degree || edu.title || ''),
      institution: this.cleanString(edu.institution || edu.school || edu.college || ''),
      year: this.cleanString(edu.year || edu.end_year || edu.graduation_year || '')
    })).filter(edu => edu.degree || edu.institution);
  }

  private extractExperience(value: any): Array<{job_title: string; company: string; start_date: string; end_date: string; description: string}> {
    if (!Array.isArray(value)) return [];
    
    return value.map(exp => ({
      job_title: this.cleanString(exp.job_title || exp.title || exp.position || ''),
      company: this.cleanString(exp.company || exp.organization || ''),
      start_date: this.cleanString(exp.start_date || exp.start || ''),
      end_date: this.cleanString(exp.end_date || exp.end || exp.current || ''),
      description: this.cleanString(exp.description || exp.responsibilities || exp.achievements || '')
    })).filter(exp => exp.job_title || exp.company);
  }

  private selectBestValue(values: (string | undefined)[]): string {
    for (const value of values) {
      if (value && value.trim().length > 0) {
        return value.trim();
      }
    }
    return '';
  }

  private mergeArrays(arrays: (string[] | undefined)[]): string[] {
    const merged: string[] = [];
    const seen = new Set<string>();

    for (const array of arrays) {
      if (Array.isArray(array)) {
        for (const item of array) {
          const cleanItem = this.cleanString(item);
          if (cleanItem && !seen.has(cleanItem.toLowerCase())) {
            merged.push(cleanItem);
            seen.add(cleanItem.toLowerCase());
          }
        }
      }
    }

    return merged;
  }

  private mergeEducation(arrays: (Array<{degree: string; institution: string; year: string}> | undefined)[]): Array<{degree: string; institution: string; year: string}> {
    const merged: Array<{degree: string; institution: string; year: string}> = [];
    const seen = new Set<string>();

    for (const array of arrays) {
      if (Array.isArray(array)) {
        for (const item of array) {
          const key = `${item.degree}-${item.institution}`.toLowerCase();
          if (!seen.has(key) && (item.degree || item.institution)) {
            merged.push(item);
            seen.add(key);
          }
        }
      }
    }

    return merged;
  }

  private mergeExperience(arrays: (Array<{job_title: string; company: string; start_date: string; end_date: string; description: string}> | undefined)[]): Array<{job_title: string; company: string; start_date: string; end_date: string; description: string}> {
    const merged: Array<{job_title: string; company: string; start_date: string; end_date: string; description: string}> = [];
    const seen = new Set<string>();

    for (const array of arrays) {
      if (Array.isArray(array)) {
        for (const item of array) {
          const key = `${item.job_title}-${item.company}`.toLowerCase();
          if (!seen.has(key) && (item.job_title || item.company)) {
            merged.push(item);
            seen.add(key);
          }
        }
      }
    }

    return merged;
  }

  private isValidEmail(email: string): boolean {
    return this.EMAIL_REGEX.test(email);
  }

  private isValidPhone(phone: string): boolean {
    return this.PHONE_REGEX.test(phone) || 
           this.INDIAN_PHONE_REGEX.test(phone) || 
           this.US_PHONE_REGEX.test(phone);
  }

  private deduplicateArray(array: string[]): string[] {
    const seen = new Set<string>();
    return array.filter(item => {
      const lower = item.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
  }

  private deduplicateEducation(education: Array<{degree: string; institution: string; year: string}>): Array<{degree: string; institution: string; year: string}> {
    const seen = new Set<string>();
    return education.filter(edu => {
      const key = `${edu.degree}-${edu.institution}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private deduplicateExperience(experience: Array<{job_title: string; company: string; start_date: string; end_date: string; description: string}>): Array<{job_title: string; company: string; start_date: string; end_date: string; description: string}> {
    const seen = new Set<string>();
    return experience.filter(exp => {
      const key = `${exp.job_title}-${exp.company}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Validate the final parsed data
   */
  validateParsedData(data: ParsedResumeData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let confidence = 100;

    // Validate required fields
    if (!data.name || data.name.length < 2) {
      errors.push('Name is missing or too short');
      confidence -= 20;
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Valid email is required');
      confidence -= 20;
    }

    if (!data.phone || !this.isValidPhone(data.phone)) {
      warnings.push('Phone number format may be invalid');
      confidence -= 10;
    }

    // Validate arrays
    if (data.skills.length === 0) {
      warnings.push('No skills found');
      confidence -= 15;
    }

    if (data.experience.length === 0) {
      warnings.push('No work experience found');
      confidence -= 15;
    }

    if (data.education.length === 0) {
      warnings.push('No education information found');
      confidence -= 10;
    }

    // Ensure confidence doesn't go below 0
    confidence = Math.max(0, confidence);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      confidence
    };
  }
}
