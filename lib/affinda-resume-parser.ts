/**
 * Affinda Resume Parser Service
 * Isolated service that integrates with existing AI fallback chain
 * Does NOT affect any existing code - purely additive
 */

// Import the standard ExtractedResumeData format used by other AI services
import type { ExtractedResumeData } from './enhanced-resume-ai';

export interface AffindaResponse {
  data?: {
    name?: { raw?: string; first?: string; last?: string };
    phones?: Array<{ rawPhone?: string }>;
    emails?: Array<string>;
    location?: { formatted?: string; city?: string; state?: string; country?: string };
    websites?: Array<{ url?: string; type?: string }>;
    summary?: string;
    skills?: Array<{ name?: string }>;
    workExperience?: Array<{
      organization?: string;
      jobTitle?: string;
      location?: { formatted?: string };
      dates?: { startDate?: string; endDate?: string };
      jobDescription?: string;
    }>;
    education?: Array<{
      organization?: string;
      accreditation?: { education?: string };
      grade?: { raw?: string };
      dates?: { completionDate?: string; startDate?: string };
      location?: { formatted?: string };
    }>;
    certifications?: Array<string>;
    languages?: Array<{ name?: string }>;
  };
}

export class AffindaResumeParser {
  private apiKey: string | null;
  private workspaceId: string | null;
  private apiUrl: string = 'https://api.affinda.com/v3/documents';

  constructor() {
    // Initialize with API key and workspace ID from environment
    this.apiKey = process.env.AFFINDA_API_KEY || null;
    this.workspaceId = process.env.AFFINDA_WORKSPACE_ID || null;
    
    if (!this.apiKey) {
      console.warn('⚠️ AFFINDA_API_KEY not found. Affinda parsing will be disabled.');
    } else if (!this.workspaceId) {
      console.warn('⚠️ AFFINDA_WORKSPACE_ID not found. Affinda parsing will be disabled.');
    } else {
      console.log('✅ Affinda Resume Parser initialized with workspace:', this.workspaceId);
    }
  }

  /**
   * Check if Affinda is available
   */
  isAvailable(): boolean {
    return this.apiKey !== null && this.apiKey.length > 0 && 
           this.workspaceId !== null && this.workspaceId.length > 0;
  }

  /**
   * Parse resume text/file using Affinda API
   * Returns data in standard ExtractedResumeData format for compatibility
   */
  async parseResume(fileBuffer: Buffer, fileName: string): Promise<ExtractedResumeData> {
    if (!this.apiKey) {
      throw new Error('Affinda API key not configured');
    }
    
    if (!this.workspaceId) {
      throw new Error('Affinda workspace ID not configured');
    }

    try {
      console.log('🔍 Parsing resume with Affinda API...');
      console.log('   - Workspace ID:', this.workspaceId);
      console.log('   - File:', fileName);
      
      // Create form data for file upload using native FormData (Edge runtime compatible)
      const FormData = globalThis.FormData;
      const blob = new Blob([fileBuffer], { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', blob, fileName);
      formData.append('workspace', this.workspaceId); // Add workspace ID
      formData.append('wait', 'true'); // Wait for processing to complete

      // Make API request to Affinda
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          // Don't set Content-Type, let fetch handle it for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Affinda API error: ${response.status} - ${errorText}`);
      }

      const affindaResult: AffindaResponse = await response.json();
      
      console.log('📊 Affinda parsing successful');
      
      // Transform Affinda format to our standard ExtractedResumeData format
      return this.transformAffindaToStandard(affindaResult);
      
    } catch (error: any) {
      console.error('❌ Affinda parsing failed:', error.message);
      throw error;
    }
  }

  /**
   * Transform Affinda response to standard ExtractedResumeData format
   * Ensures compatibility with existing transformation pipeline
   */
  private transformAffindaToStandard(affindaData: AffindaResponse): ExtractedResumeData {
    const data = affindaData.data || {};
    
    // Extract name
    const fullName = data.name?.raw || 
                     `${data.name?.first || ''} ${data.name?.last || ''}`.trim() || 
                     '';
    
    // Extract phone (first phone number if multiple)
    const phone = data.phones?.[0]?.rawPhone || '';
    
    // Extract email (first email if multiple)
    const email = data.emails?.[0] || '';
    
    // Extract location
    const location = data.location?.formatted || 
                    `${data.location?.city || ''}, ${data.location?.state || ''}, ${data.location?.country || ''}`.trim() ||
                    '';
    
    // Extract LinkedIn/Portfolio from websites
    let linkedin = '';
    let portfolio = '';
    if (data.websites) {
      for (const site of data.websites) {
        if (site.url) {
          if (site.url.includes('linkedin.com')) {
            linkedin = site.url;
          } else if (site.url.includes('github.com') || site.type === 'portfolio') {
            portfolio = site.url;
          }
        }
      }
    }
    
    // Extract skills
    const skills = (data.skills || [])
      .map(s => s.name)
      .filter((s): s is string => !!s);
    
    // Extract work experience
    const experience = (data.workExperience || []).map(exp => ({
      company: exp.organization || '',
      position: exp.jobTitle || '',
      location: exp.location?.formatted || '',
      startDate: exp.dates?.startDate || '',
      endDate: exp.dates?.endDate || '',
      current: !exp.dates?.endDate || exp.dates.endDate === 'current',
      description: exp.jobDescription || '',
      achievements: exp.jobDescription ? [exp.jobDescription] : [],
    }));
    
    // Extract education
    const education = (data.education || []).map(edu => ({
      institution: edu.organization || '',
      degree: edu.accreditation?.education || '',
      field: '', // Affinda doesn't separate field
      startDate: edu.dates?.startDate || '',
      endDate: edu.dates?.completionDate || '',
      gpa: edu.grade?.raw || '',
      description: edu.location?.formatted || '',
    }));
    
    // Extract certifications (already strings)
    const certifications = (data.certifications || []).map(cert => ({
      name: cert,
      issuer: '',
      date: '',
      url: '',
    }));
    
    // Extract languages
    const languages = (data.languages || [])
      .map(lang => lang.name)
      .filter((l): l is string => !!l);
    
    // Use summary from Affinda or generate one
    const summary = data.summary || 
                   (skills.length > 0 
                     ? `Experienced professional with expertise in ${skills.slice(0, 3).join(', ')}.`
                     : 'Professional with diverse experience and skills.');
    
    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence({
      fullName,
      email,
      phone,
      skills: skills.length,
      experience: experience.length,
      education: education.length,
    });
    
    console.log('✅ Affinda transformation complete:', {
      fullName: fullName || 'MISSING',
      email: email || 'MISSING',
      phone: phone || 'MISSING',
      skillsCount: skills.length,
      experienceCount: experience.length,
      educationCount: education.length,
      confidence,
    });
    
    return {
      fullName,
      email,
      phone,
      location,
      linkedin,
      portfolio,
      summary,
      skills,
      experience,
      education,
      projects: [], // Affinda doesn't extract projects separately
      certifications,
      languages,
      expectedSalary: '',
      preferredJobType: '',
      confidence,
      rawText: '', // Not available from Affinda API
    };
  }

  /**
   * Calculate confidence score based on data completeness
   */
  private calculateConfidence(data: {
    fullName: string;
    email: string;
    phone: string;
    skills: number;
    experience: number;
    education: number;
  }): number {
    let score = 0;
    
    if (data.fullName) score += 20;
    if (data.email) score += 20;
    if (data.phone) score += 15;
    if (data.skills > 0) score += 20;
    if (data.experience > 0) score += 15;
    if (data.education > 0) score += 10;
    
    return Math.min(score, 100);
  }
}

