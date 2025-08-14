import { ResumeAI } from './resume-ai';
import { resumeDB } from './resume-database';
import { 
  ResumeData, 
  ResumeRecord, 
  ResumeAnalysisResponse, 
  ResumeGenerationRequest,
  ResumeGenerationResponse,
  APIError 
} from './resume-api-types';

export class ResumeService {

  constructor() {
    // Service class for handling resume operations
  }

  // Enhanced Analysis with Database Integration
  async analyzeResume(data: ResumeData | string, userId?: string, resumeId?: string): Promise<ResumeAnalysisResponse> {
    try {
      // Parse string input if needed
      let resumeData: ResumeData;
      if (typeof data === 'string') {
        // For now, return basic analysis until we implement proper text parsing
        resumeData = {
          fullName: '',
          contact: { email: '', phone: '' },
          summary: data,
          skills: [],
          education: [],
          workExperience: [],
          certifications: [],
          projects: []
        };
      } else {
        resumeData = data;
      }

      // Get basic analysis from AI service
      const basicAnalysis = ResumeAI.analyzeResume(resumeData);
      
      // Check for duplicates and conflicts
      const duplicateContent = this.detectDuplicateContent(resumeData);
      const conflicts = this.detectConflicts(resumeData);
      
      // Enhanced ATS scoring
      const atsScore = this.calculateATSScore(resumeData);
      
      // Build final analysis
      const finalAnalysis = {
        completeness: basicAnalysis.completeness,
        atsScore,
        issues: basicAnalysis.issues,
        suggestions: basicAnalysis.suggestions,
        missingFields: basicAnalysis.missingFields,
        strengthAreas: ['Content structure', 'Professional formatting'],
        weaknessAreas: duplicateContent.length > 0 ? ['Duplicate content detected'] : [],
        duplicateContent,
        conflicts,
      };

      // Save analysis to database if resumeId and userId provided
      if (resumeId && userId) {
        await resumeDB.saveAnalysis(resumeId, userId, finalAnalysis);
        await resumeDB.logActivity(userId, resumeId, 'analysis', { atsScore });
      }

      return {
        success: true,
        analysis: finalAnalysis,
        enhancedData: resumeData, // Return original for now
      };
    } catch (error) {
      throw this.createAPIError('ANALYSIS_FAILED', 'Failed to analyze resume', error);
    }
  }

  // Resume Generation with AI Enhancement
  async generateResume(request: ResumeGenerationRequest): Promise<ResumeGenerationResponse> {
    try {
      // Use AI service to generate base resume
      const baseResume = ResumeAI.generateResume({
        requirements: request.requirements,
        targetRole: request.targetRole,
        experienceLevel: request.experienceLevel
      });

      const resumeData = ResumeAI.enhanceResume(baseResume);

      // Generate validation and optimization
      const validation = ResumeAI.validateResume(resumeData);
      const atsOptimizations = this.generateATSOptimizations(resumeData);
      const alternativeVersions = await this.generateAlternativeVersions(resumeData);

      return {
        success: true,
        resumeData,
        suggestions: validation.errors,
        atsOptimizations,
        alternativeVersions,
      };
    } catch (error) {
      throw this.createAPIError('GENERATION_FAILED', 'Failed to generate resume', error);
    }
  }

  // File Processing and Text Extraction
  async processUploadedFile(file: File, fileType: string): Promise<{
    extractedText: string;
    parsedData: ResumeData;
    confidence: number;
    issues: string[];
  }> {
    try {
      let extractedText = '';
      
      switch (fileType) {
        case 'pdf':
          extractedText = await this.extractPDFText(file);
          break;
        case 'docx':
          extractedText = await this.extractDocxText(file);
          break;
        case 'txt':
          extractedText = await this.extractTextContent(file);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      // Parse extracted text into structured data (basic heuristics)
      const emailMatch = extractedText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
      const phoneMatch = extractedText.match(/\+?\d[\d\s().-]{7,}\d/);
      const lines = extractedText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const headerLine = lines[0] || '';
      const nameGuess = headerLine && !headerLine.toLowerCase().includes('resume') && headerLine.length <= 60 ? headerLine : '';

      const parsedData: ResumeData = {
        fullName: nameGuess,
        contact: { email: emailMatch?.[0] || '', phone: phoneMatch?.[0] || '' },
        summary: extractedText.substring(0, 600),
        skills: [],
        education: [],
        workExperience: [],
        certifications: [],
        projects: []
      };
      
      // Calculate confidence score
      const confidence = this.calculateParsingConfidence(extractedText, parsedData);
      
      // Detect parsing issues
      const issues = this.detectParsingIssues(extractedText, parsedData);

      return {
        extractedText,
        parsedData,
        confidence,
        issues,
      };
    } catch (error) {
      throw this.createAPIError('FILE_PROCESSING_FAILED', 'Failed to process uploaded file', error);
    }
  }

  // Database-Integrated CRUD Operations
  
  // Save resume to database
  async saveResume(userId: string, data: ResumeData, metadata?: any): Promise<ResumeRecord> {
    try {
      const resume = await resumeDB.saveResume(userId, data, metadata);
      await resumeDB.logActivity(userId, resume.id, 'create', { source: metadata?.fileType || 'manual' });
      return resume;
    } catch (error) {
      throw this.createAPIError('SAVE_FAILED', 'Failed to save resume', error);
    }
  }

  // Get resume from database
  async getResume(id: string, userId: string): Promise<ResumeRecord | null> {
    try {
      const resume = await resumeDB.getResume(id, userId);
      if (resume) {
        await resumeDB.logActivity(userId, id, 'view');
      }
      return resume;
    } catch (error) {
      throw this.createAPIError('FETCH_FAILED', 'Failed to retrieve resume', error);
    }
  }

  // Update resume in database
  async updateResume(id: string, userId: string, data: ResumeData, changeNotes?: string): Promise<ResumeRecord> {
    try {
      const resume = await resumeDB.updateResume(id, userId, data, changeNotes);
      await resumeDB.logActivity(userId, id, 'update', { changeNotes });
      return resume;
    } catch (error) {
      throw this.createAPIError('UPDATE_FAILED', 'Failed to update resume', error);
    }
  }

  // Delete resume from database
  async deleteResume(id: string, userId: string): Promise<boolean> {
    try {
      const success = await resumeDB.deleteResume(id, userId);
      if (success) {
        await resumeDB.logActivity(userId, id, 'delete');
      }
      return success;
    } catch (error) {
      throw this.createAPIError('DELETE_FAILED', 'Failed to delete resume', error);
    }
  }

  // List user resumes with pagination and filtering
  async listResumes(userId: string, options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: string;
  } = {}) {
    try {
      const finalOptions = {
        page: options.page || 1,
        limit: Math.min(options.limit || 10, 50), // Max 50 per page
        sortBy: options.sortBy || 'updated_at',
        sortOrder: options.sortOrder || 'desc',
        status: options.status,
      };

      const result = await resumeDB.listResumes(userId, finalOptions);
      await resumeDB.logActivity(userId, null, 'list', { page: finalOptions.page });
      
      return {
        success: true,
        data: result.data,
        pagination: {
          page: finalOptions.page,
          limit: finalOptions.limit,
          total: result.total,
          pages: Math.ceil(result.total / finalOptions.limit),
        },
      };
    } catch (error) {
      throw this.createAPIError('LIST_FAILED', 'Failed to list resumes', error);
    }
  }

  // Search resumes by content
  async searchResumes(userId: string, query: string, options: {
    page?: number;
    limit?: number;
  } = {}) {
    try {
      if (!query || query.length < 3) {
        throw new Error('Search query must be at least 3 characters long');
      }

      const finalOptions = {
        page: options.page || 1,
        limit: Math.min(options.limit || 10, 20), // Max 20 for search
      };

      const result = await resumeDB.searchResumes(userId, query, finalOptions);
      await resumeDB.logActivity(userId, null, 'search', { query, results: result.total });

      return {
        success: true,
        data: result.data,
        query,
        pagination: {
          page: finalOptions.page,
          limit: finalOptions.limit,
          total: result.total,
          pages: Math.ceil(result.total / finalOptions.limit),
        },
      };
    } catch (error) {
      throw this.createAPIError('SEARCH_FAILED', 'Failed to search resumes', error);
    }
  }

  // Generate resume with database integration
  async generateResumeWithSave(
    userId: string,
    request: ResumeGenerationRequest
  ): Promise<ResumeGenerationResponse & { resumeId: string }> {
    try {
      // Generate the resume
      const generation = await this.generateResume(request);
      
      if (!generation.success || !generation.resumeData) {
        throw new Error('Resume generation failed');
      }

      // Save to database
      const savedResume = await this.saveResume(userId, generation.resumeData, {
        generationType: 'ai_generated',
        targetRole: request.targetRole,
      });

      return {
        ...generation,
        resumeId: savedResume.id,
      };
    } catch (error) {
      throw this.createAPIError('GENERATE_SAVE_FAILED', 'Failed to generate and save resume', error);
    }
  }

  // Export resume with database tracking
  async exportResumeWithTracking(
    resumeId: string,
    userId: string,
    format: 'pdf' | 'docx' | 'txt' | 'json',
    template?: string
  ): Promise<{
    success: boolean;
    downloadUrl: string;
    filename: string;
    expiresAt: Date;
    exportId: string;
  }> {
    try {
      // Get resume data
      const resume = await this.getResume(resumeId, userId);
      if (!resume) {
        throw new Error('Resume not found');
      }

      // Generate export
      const exportResult = await this.exportResume(resume.data, format, template);

      // Calculate expiration (24 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Save export record
      const exportId = await resumeDB.saveExport(resumeId, userId, {
        format,
        filename: exportResult.filename,
        fileSize: exportResult.content.length,
        downloadUrl: exportResult.downloadUrl,
        expiresAt,
      });

      // Log export activity
      await resumeDB.logActivity(userId, resumeId, 'export', { format, template });

      return {
        success: true,
        downloadUrl: exportResult.downloadUrl,
        filename: exportResult.filename,
        expiresAt,
        exportId,
      };
    } catch (error) {
      throw this.createAPIError('EXPORT_FAILED', 'Failed to export resume', error);
    }
  }

  // Get user analytics
  async getUserAnalytics(userId: string, days: number = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const analytics = await resumeDB.getAnalytics(userId, { start: startDate, end: endDate });
      
      return {
        success: true,
        period: { start: startDate, end: endDate, days },
        ...analytics,
      };
    } catch (error) {
      throw this.createAPIError('ANALYTICS_FAILED', 'Failed to retrieve analytics', error);
    }
  }

  // Health check for database connectivity
  async healthCheck(): Promise<{ database: boolean; ai: boolean }> {
    try {
      const dbHealth = await resumeDB.healthCheck();
      const aiHealth = await ResumeAI.healthCheck();
      
      return {
        database: dbHealth,
        ai: aiHealth,
      };
    } catch (error) {
      return {
        database: false,
        ai: false,
      };
    }
  }

  // Helper Methods

  private detectDuplicateContent(data: ResumeData): string[] {
    const duplicates: string[] = [];
    
    // Check for duplicate skills
    const skillCounts = new Map<string, number>();
    data.skills.forEach(skill => {
      const count = skillCounts.get(skill) || 0;
      skillCounts.set(skill, count + 1);
      if (count > 0) {
        duplicates.push(`Duplicate skill: ${skill}`);
      }
    });

    // Check for duplicate responsibilities across work experience
    const responsibilities = data.workExperience.flatMap(exp => exp.responsibilities);
    const respCounts = new Map<string, number>();
    responsibilities.forEach(resp => {
      const count = respCounts.get(resp) || 0;
      respCounts.set(resp, count + 1);
      if (count > 0) {
        duplicates.push(`Duplicate responsibility: ${resp}`);
      }
    });

    return Array.from(new Set(duplicates));
  }

  private detectConflicts(data: ResumeData): string[] {
    const conflicts: string[] = [];
    
    // Check for date conflicts in work experience
    data.workExperience.forEach((exp, index) => {
      if (exp.startDate && exp.endDate && exp.endDate !== 'Present') {
        const start = new Date(exp.startDate);
        const end = new Date(exp.endDate);
        if (start > end) {
          conflicts.push(`Work experience ${index + 1}: Start date is after end date`);
        }
      }
    });

    // Check for education conflicts
    data.education.forEach((edu, index) => {
      if (edu.year) {
        const gradYear = parseInt(edu.year);
        const currentYear = new Date().getFullYear();
        if (gradYear > currentYear + 6) {
          conflicts.push(`Education ${index + 1}: Graduation year seems too far in the future`);
        }
      }
    });

    return Array.from(new Set(conflicts));
  }

  private calculateATSScore(data: ResumeData): number {
    let score = 0;
    
    // Basic completeness scoring
    if (data.fullName) score += 10;
    if (data.contact.email) score += 10;
    if (data.contact.phone) score += 10;
    if (data.summary) score += 15;
    if (data.skills.length > 0) score += 15;
    if (data.workExperience.length > 0) score += 20;
    if (data.education.length > 0) score += 10;
    
    // Keyword density (simplified)
    const textContent = [
      data.summary,
      ...data.skills,
      ...data.workExperience.flatMap(exp => exp.responsibilities),
    ].join(' ').toLowerCase();
    
    const keywords = ['experience', 'skills', 'development', 'management', 'leadership'];
    const keywordMatches = keywords.filter(keyword => textContent.includes(keyword)).length;
    score += keywordMatches * 2;

    return Math.min(score, 100);
  }

  private generateATSOptimizations(data: ResumeData): string[] {
    const optimizations: string[] = [];
    
    if (data.skills.length < 5) {
      optimizations.push('Add more relevant skills to improve keyword matching');
    }
    
    if (!data.summary || data.summary.length < 100) {
      optimizations.push('Expand professional summary with more details');
    }
    
    if (data.workExperience.length === 0) {
      optimizations.push('Add work experience section');
    }
    
    return optimizations;
  }

  private async generateAlternativeVersions(data: ResumeData) {
    const versions: any = {};
    
    // Skills-focused version
    versions.skillsFocused = {
      ...data,
      summary: data.summary + ' Specialized in technical skill application.',
    };
    
    // Experience-focused version
    versions.experienceFocused = {
      ...data,
      summary: data.summary + ' Proven track record of professional achievements.',
    };
    
    return versions;
  }

  private async extractPDFText(file: File): Promise<string> {
    try {
      // Simplified PDF text extraction - returns empty for now
      // PDF extraction requires server-side processing
      return '';
    } catch {
      return '';
    }
  }

  private async extractDocxText(file: File): Promise<string> {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await (mammoth as any).extractRawText({ buffer: Buffer.from(arrayBuffer) });
      return result?.value || '';
    } catch {
      return '';
    }
  }

  private async extractTextContent(file: File): Promise<string> {
    try {
      // Web File in Next.js routes supports .text()
      // Fallback to arrayBuffer if needed
      // @ts-ignore
      if (typeof file.text === 'function') {
        // @ts-ignore
        return await file.text();
      }
      const buf = Buffer.from(await file.arrayBuffer());
      return buf.toString('utf-8');
    } catch {
      return '';
    }
  }

  private calculateParsingConfidence(text: string, data: ResumeData): number {
    // Basic confidence calculation
    let confidence = 50;
    
    if (data.fullName) confidence += 10;
    if (data.contact.email) confidence += 10;
    if (data.skills.length > 0) confidence += 15;
    if (data.workExperience.length > 0) confidence += 15;
    
    return Math.min(confidence, 100);
  }

  private detectParsingIssues(text: string, data: ResumeData): string[] {
    const issues: string[] = [];
    
    if (!data.fullName) issues.push('Could not extract full name');
    if (!data.contact.email) issues.push('Could not extract email address');
    if (data.skills.length === 0) issues.push('No skills section found');
    
    return issues;
  }

  private async exportResume(data: ResumeData, format: string, template?: string): Promise<{
    content: Uint8Array;
    filename: string;
    downloadUrl: string;
  }> {
    // Mock implementation - would generate actual file content
    const content = new TextEncoder().encode(JSON.stringify(data, null, 2));
    const filename = `resume_${Date.now()}.${format}`;
    const downloadUrl = `/api/exports/${filename}`;
    
    return {
      content,
      filename,
      downloadUrl,
    };
  }

  private createAPIError(code: string, message: string, originalError?: any): APIError {
    return {
      success: false,
      error: {
        code,
        message,
        details: originalError?.message ? [originalError.message] : undefined,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
