/**
 * ATS-Friendly Auto-Suggestion Engine for Resume Builder
 * Generates dynamic, role-specific, ATS-optimized suggestions
 * Works even with blank inputs by inferring from context
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ATSSuggestionRequest {
  job_title: string;
  industry: string;
  experience_level: string; // 'fresher' | 'experienced' | 'student' | 'senior'
  summary_input: string;
  skills_input: string;
  experience_input: string;
  education_input: string;
}

export interface ATSSuggestionResponse {
  summary: string;
  skills: string[];
  ats_keywords: string[];
  experience_bullets: string[];
  projects: Array<{ title: string; description: string }>;
}

export class ATSSuggestionEngine {
  private openai: OpenAI | null;
  private gemini: GoogleGenerativeAI | null;

  constructor() {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    } else {
      this.openai = null;
      console.warn('⚠️ OPENAI_API_KEY not found. ATS suggestions will use Gemini or fallback.');
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      this.gemini = new GoogleGenerativeAI(geminiKey);
    } else {
      this.gemini = null;
      console.warn('⚠️ GEMINI_API_KEY not found. ATS suggestions will use OpenAI or fallback.');
    }
  }

  /**
   * Generate comprehensive ATS-optimized suggestions
   */
  async generateSuggestions(request: ATSSuggestionRequest): Promise<ATSSuggestionResponse> {
    // Normalize experience level
    const expLevel = this.normalizeExperienceLevel(request.experience_level);
    
    // Try OpenAI first, then Gemini, then fallback
    if (this.openai) {
      try {
        return await this.generateWithOpenAI(request, expLevel);
      } catch (error) {
        console.warn('OpenAI generation failed, trying Gemini:', error);
      }
    }

    if (this.gemini) {
      try {
        return await this.generateWithGemini(request, expLevel);
      } catch (error) {
        console.warn('Gemini generation failed, using fallback:', error);
      }
    }

    // Fallback to rule-based suggestions
    return this.generateFallbackSuggestions(request, expLevel);
  }

  /**
   * Generate suggestions using OpenAI
   */
  private async generateWithOpenAI(
    request: ATSSuggestionRequest,
    expLevel: string
  ): Promise<ATSSuggestionResponse> {
    if (!this.openai) throw new Error('OpenAI not available');

    const prompt = this.buildPrompt(request, expLevel);
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const completion = await this.openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are an expert ATS resume strategist. Generate professional, ATS-optimized resume content. Return ONLY valid JSON, no markdown, no explanations.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('Empty response from OpenAI');

    const parsed = JSON.parse(response);
    return this.validateAndNormalizeResponse(parsed);
  }

  /**
   * Generate suggestions using Gemini
   */
  private async generateWithGemini(
    request: ATSSuggestionRequest,
    expLevel: string
  ): Promise<ATSSuggestionResponse> {
    if (!this.gemini) throw new Error('Gemini not available');

    const prompt = this.buildPrompt(request, expLevel);
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const model = this.gemini.getGenerativeModel({ model: modelName });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2000,
        responseMimeType: 'application/json'
      }
    });

    const response = result.response.text();
    if (!response) throw new Error('Empty response from Gemini');

    const parsed = JSON.parse(response);
    return this.validateAndNormalizeResponse(parsed);
  }

  /**
   * Build comprehensive prompt for AI
   */
  private buildPrompt(request: ATSSuggestionRequest, expLevel: string): string {
    const { job_title, industry, summary_input, skills_input, experience_input, education_input } = request;

    // Infer context if inputs are blank
    const inferredJob = job_title || this.inferJobTitle(industry, skills_input);
    const inferredIndustry = industry || this.inferIndustry(job_title, skills_input);

    return `Generate ATS-optimized resume suggestions for a ${expLevel} professional.

CONTEXT:
- Job Title: ${inferredJob || 'Not specified'}
- Industry: ${inferredIndustry || 'Not specified'}
- Experience Level: ${expLevel}
- Current Summary: ${summary_input || '(empty)'}
- Current Skills: ${skills_input || '(empty)'}
- Current Experience: ${experience_input || '(empty)'}
- Current Education: ${education_input || '(empty)'}

REQUIREMENTS:
1. SUMMARY: Generate a 2-3 line professional summary (60-90 words). Role-aligned, result-driven, include industry keywords.
2. SKILLS: Generate 8-14 job-title-specific skills. Include tools, software, methods, technical terms. Avoid generic skills.
3. ATS_KEYWORDS: Generate 15-25 pure keywords for ATS scanners. Include industry vocabulary, action verbs, technical terms.
4. EXPERIENCE_BULLETS: Generate 3-6 achievement bullets using format: "Action Verb → Task → Result with metric". Use estimated metrics if needed.
5. PROJECTS: Generate 1-2 projects with title and 1-line description. Include relevant tools/technologies.

${expLevel.toUpperCase()} SPECIFIC RULES:
${this.getRoleSpecificRules(expLevel)}

OUTPUT FORMAT (strict JSON only):
{
  "summary": "2-3 line professional summary here",
  "skills": ["Skill1", "Skill2", ...],
  "ats_keywords": ["Keyword1", "Keyword2", ...],
  "experience_bullets": ["Bullet point 1", "Bullet point 2", ...],
  "projects": [
    {"title": "Project Title", "description": "One-line description"}
  ]
}

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no explanations.`;
  }

  /**
   * Get role-specific rules
   */
  private getRoleSpecificRules(expLevel: string): string {
    switch (expLevel.toLowerCase()) {
      case 'fresher':
        return `- Focus on internships, academic projects, foundational skills
- Avoid "5+ years experience" terms
- Use soft tech + basic domain skills
- Emphasize learning ability and academic achievements`;

      case 'student':
        return `- Focus on academic projects + foundational tools
- Include extracurricular or internship-friendly terms
- Emphasize coursework and academic achievements
- Include relevant certifications or training`;

      case 'experienced':
        return `- Add measurable achievements (%, $, time saved)
- Use industry-specific tools, systems, frameworks
- Include cross-functional collaboration
- Emphasize impact and results`;

      case 'senior':
        return `- Add leadership, strategy, optimization keywords
- Include cross-functional impact and metrics
- Emphasize team management and strategic initiatives
- Include high-level technical and business skills`;

      default:
        return `- Generate appropriate content based on experience level
- Include relevant industry keywords
- Focus on measurable achievements`;
    }
  }

  /**
   * Generate fallback suggestions when AI is unavailable
   */
  private generateFallbackSuggestions(
    request: ATSSuggestionRequest,
    expLevel: string
  ): ATSSuggestionResponse {
    const jobTitle = request.job_title || this.inferJobTitle(request.industry, request.skills_input) || 'Professional';
    const industry = request.industry || this.inferIndustry(request.job_title, request.skills_input) || 'General';

    // Generate summary
    const summary = this.generateFallbackSummary(jobTitle, industry, expLevel);

    // Generate skills based on job title and industry
    const skills = this.generateFallbackSkills(jobTitle, industry, expLevel);

    // Generate ATS keywords
    const ats_keywords = this.generateFallbackKeywords(jobTitle, industry, expLevel);

    // Generate experience bullets
    const experience_bullets = this.generateFallbackBullets(jobTitle, industry, expLevel);

    // Generate projects
    const projects = this.generateFallbackProjects(jobTitle, industry, expLevel);

    return {
      summary,
      skills,
      ats_keywords,
      experience_bullets,
      projects
    };
  }

  /**
   * Generate fallback summary
   */
  private generateFallbackSummary(jobTitle: string, industry: string, expLevel: string): string {
    const levelText = this.getLevelText(expLevel);
    return `${levelText} ${jobTitle} with expertise in ${industry}. Proven track record of delivering results and driving success. Strong problem-solving skills and ability to work in fast-paced environments.`;
  }

  /**
   * Generate fallback skills
   */
  private generateFallbackSkills(jobTitle: string, industry: string, expLevel: string): string[] {
    const baseSkills = this.getBaseSkillsForJob(jobTitle, industry);
    const levelSkills = this.getLevelSkills(expLevel);
    return [...baseSkills, ...levelSkills].slice(0, 12);
  }

  /**
   * Generate fallback ATS keywords
   */
  private generateFallbackKeywords(jobTitle: string, industry: string, expLevel: string): string[] {
    const jobKeywords = this.getJobKeywords(jobTitle);
    const industryKeywords = this.getIndustryKeywords(industry);
    const actionVerbs = ['Managed', 'Developed', 'Implemented', 'Optimized', 'Streamlined', 'Executed', 'Led', 'Created'];
    const levelKeywords = this.getLevelKeywords(expLevel);
    
    return [...jobKeywords, ...industryKeywords, ...actionVerbs, ...levelKeywords].slice(0, 20);
  }

  /**
   * Generate fallback experience bullets
   */
  private generateFallbackBullets(jobTitle: string, industry: string, expLevel: string): string[] {
    const metrics = ['15%', '20%', '30%', '25%', '40%'];
    const actions = ['Developed', 'Implemented', 'Managed', 'Optimized', 'Streamlined'];
    const results = ['improved efficiency', 'reduced costs', 'increased productivity', 'enhanced performance', 'accelerated delivery'];

    return [
      `${actions[0]} ${this.getTaskForJob(jobTitle)} resulting in ${results[0]} by ${metrics[0]}`,
      `${actions[1]} ${this.getTaskForJob(jobTitle)} leading to ${results[1]} by ${metrics[1]}`,
      `${actions[2]} cross-functional team to deliver ${this.getTaskForJob(jobTitle)}`,
      `${actions[3]} processes that ${results[2]} by ${metrics[2]}`
    ];
  }

  /**
   * Generate fallback projects
   */
  private generateFallbackProjects(jobTitle: string, industry: string, expLevel: string): Array<{ title: string; description: string }> {
    return [
      {
        title: `${industry} ${this.getProjectTypeForJob(jobTitle)}`,
        description: `Developed and implemented ${this.getProjectTypeForJob(jobTitle)} solution for ${industry} industry.`
      },
      {
        title: `${jobTitle} Portfolio Project`,
        description: `Built comprehensive ${jobTitle.toLowerCase()} project demonstrating key skills and expertise.`
      }
    ];
  }

  // Helper methods for fallback generation

  private normalizeExperienceLevel(level: string): string {
    const normalized = level.toLowerCase().trim();
    if (normalized.includes('fresher') || normalized.includes('fresh')) return 'fresher';
    if (normalized.includes('student') || normalized.includes('intern')) return 'student';
    if (normalized.includes('senior') || normalized.includes('executive') || normalized.includes('lead')) return 'senior';
    if (normalized.includes('experience') || normalized.includes('mid') || normalized.includes('professional')) return 'experienced';
    return 'experienced'; // default
  }

  private inferJobTitle(industry: string, skills: string): string {
    if (!industry && !skills) return '';
    
    const combined = `${industry} ${skills}`.toLowerCase();
    
    // Tech roles
    if (combined.includes('javascript') || combined.includes('react') || combined.includes('node')) return 'Software Developer';
    if (combined.includes('python') || combined.includes('django') || combined.includes('flask')) return 'Python Developer';
    if (combined.includes('java') || combined.includes('spring')) return 'Java Developer';
    
    // Business roles
    if (combined.includes('sales') || combined.includes('customer')) return 'Sales Representative';
    if (combined.includes('marketing') || combined.includes('digital')) return 'Marketing Specialist';
    if (combined.includes('account') || combined.includes('finance')) return 'Accountant';
    
    return '';
  }

  private inferIndustry(jobTitle: string, skills: string): string {
    if (!jobTitle && !skills) return '';
    
    const combined = `${jobTitle} ${skills}`.toLowerCase();
    
    if (combined.includes('software') || combined.includes('tech') || combined.includes('developer')) return 'Technology';
    if (combined.includes('finance') || combined.includes('banking') || combined.includes('account')) return 'Finance';
    if (combined.includes('health') || combined.includes('medical')) return 'Healthcare';
    if (combined.includes('education') || combined.includes('teaching')) return 'Education';
    if (combined.includes('retail') || combined.includes('sales')) return 'Retail';
    
    return '';
  }

  private getLevelText(expLevel: string): string {
    switch (expLevel.toLowerCase()) {
      case 'fresher': return 'Recent graduate and aspiring';
      case 'student': return 'Dedicated student and';
      case 'experienced': return 'Experienced';
      case 'senior': return 'Senior';
      default: return 'Professional';
    }
  }

  private getBaseSkillsForJob(jobTitle: string, industry: string): string[] {
    const title = jobTitle.toLowerCase();
    const ind = industry.toLowerCase();
    
    // Tech skills
    if (title.includes('developer') || title.includes('engineer') || title.includes('programmer')) {
      return ['JavaScript', 'Python', 'Git', 'SQL', 'REST APIs', 'Problem Solving'];
    }
    
    // Business skills
    if (title.includes('sales') || title.includes('business')) {
      return ['Sales', 'CRM', 'Negotiation', 'Client Relations', 'Communication', 'Lead Generation'];
    }
    
    // Marketing skills
    if (title.includes('marketing') || title.includes('digital')) {
      return ['Digital Marketing', 'SEO', 'Social Media', 'Content Creation', 'Analytics', 'Campaign Management'];
    }
    
    // Generic professional skills
    return ['Communication', 'Teamwork', 'Problem Solving', 'Time Management', 'Microsoft Office', 'Project Management'];
  }

  private getLevelSkills(expLevel: string): string[] {
    switch (expLevel.toLowerCase()) {
      case 'fresher':
      case 'student':
        return ['Learning Agility', 'Adaptability', 'Eagerness to Learn'];
      case 'experienced':
        return ['Leadership', 'Strategic Planning', 'Process Improvement'];
      case 'senior':
        return ['Executive Leadership', 'Strategic Vision', 'Cross-functional Management', 'Business Strategy'];
      default:
        return [];
    }
  }

  private getJobKeywords(jobTitle: string): string[] {
    const title = jobTitle.toLowerCase();
    if (title.includes('developer') || title.includes('engineer')) {
      return ['Software Development', 'Code Review', 'Agile Methodology', 'Version Control', 'API Integration'];
    }
    if (title.includes('manager') || title.includes('lead')) {
      return ['Team Leadership', 'Project Management', 'Stakeholder Management', 'Resource Planning'];
    }
    return ['Professional Excellence', 'Quality Assurance', 'Best Practices'];
  }

  private getIndustryKeywords(industry: string): string[] {
    const ind = industry.toLowerCase();
    if (ind.includes('tech') || ind.includes('software')) {
      return ['Cloud Computing', 'DevOps', 'Microservices', 'CI/CD', 'Containerization'];
    }
    if (ind.includes('finance')) {
      return ['Financial Analysis', 'Risk Management', 'Compliance', 'Financial Reporting'];
    }
    return ['Industry Best Practices', 'Regulatory Compliance', 'Quality Standards'];
  }

  private getLevelKeywords(expLevel: string): string[] {
    switch (expLevel.toLowerCase()) {
      case 'fresher':
      case 'student':
        return ['Academic Excellence', 'Internship Experience', 'Project-Based Learning'];
      case 'experienced':
        return ['Process Optimization', 'Team Collaboration', 'Client Engagement'];
      case 'senior':
        return ['Strategic Planning', 'Executive Decision Making', 'Organizational Leadership'];
      default:
        return [];
    }
  }

  private getTaskForJob(jobTitle: string): string {
    const title = jobTitle.toLowerCase();
    if (title.includes('developer') || title.includes('engineer')) return 'scalable software solutions';
    if (title.includes('manager')) return 'high-performing teams';
    if (title.includes('sales')) return 'sales strategies';
    if (title.includes('marketing')) return 'marketing campaigns';
    return 'key initiatives';
  }

  private getProjectTypeForJob(jobTitle: string): string {
    const title = jobTitle.toLowerCase();
    if (title.includes('developer') || title.includes('engineer')) return 'Web Application';
    if (title.includes('data') || title.includes('analyst')) return 'Data Analysis';
    if (title.includes('marketing')) return 'Marketing Campaign';
    return 'Business Solution';
  }

  /**
   * Validate and normalize AI response
   */
  private validateAndNormalizeResponse(parsed: any): ATSSuggestionResponse {
    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
      skills: Array.isArray(parsed.skills) ? parsed.skills.filter((s: any) => typeof s === 'string').slice(0, 14) : [],
      ats_keywords: Array.isArray(parsed.ats_keywords) ? parsed.ats_keywords.filter((k: any) => typeof k === 'string').slice(0, 25) : [],
      experience_bullets: Array.isArray(parsed.experience_bullets) ? parsed.experience_bullets.filter((b: any) => typeof b === 'string').slice(0, 6) : [],
      projects: Array.isArray(parsed.projects) 
        ? parsed.projects
            .filter((p: any) => p && typeof p.title === 'string' && typeof p.description === 'string')
            .slice(0, 2)
            .map((p: any) => ({ title: p.title.trim(), description: p.description.trim() }))
        : []
    };
  }
}

