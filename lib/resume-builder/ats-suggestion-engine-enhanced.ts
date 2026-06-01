/**
 * Enhanced ATS-Friendly Auto-Suggestion Engine
 * Phase 1 AI Upgrades:
 * - Structured outputs with JSON schemas
 * - Chain-of-thought reasoning prompts
 * - Request deduplication
 * - Deeper context analysis
 * 
 * Backward compatible with existing ATSSuggestionEngine
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createHash } from 'crypto';
import { SemanticATSMatcher, SemanticMatchResult, ResumeJobMatch } from '@/lib/services/semantic-ats-matcher';

// Import existing types
export interface ATSSuggestionRequest {
  job_title: string;
  industry: string;
  experience_level: string;
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

// Request cache for deduplication
interface CachedResponse {
  response: ATSSuggestionResponse;
  timestamp: number;
  provider: string;
}

class RequestDeduplicationCache {
  private cache = new Map<string, CachedResponse>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  generateFingerprint(request: ATSSuggestionRequest): string {
    // Normalize and hash request for deduplication
    const normalized = {
      job_title: (request.job_title || '').toLowerCase().trim(),
      industry: (request.industry || '').toLowerCase().trim(),
      experience_level: (request.experience_level || '').toLowerCase().trim(),
      summary_input: (request.summary_input || '').substring(0, 100).toLowerCase().trim(),
      skills_input: (request.skills_input || '').toLowerCase().trim(),
      experience_input: (request.experience_input || '').substring(0, 100).toLowerCase().trim(),
      education_input: (request.education_input || '').substring(0, 100).toLowerCase().trim(),
    };
    
    const hashInput = JSON.stringify(normalized);
    return createHash('sha256').update(hashInput).digest('hex').substring(0, 16);
  }

  get(fingerprint: string): ATSSuggestionResponse | null {
    const cached = this.cache.get(fingerprint);
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.TTL) {
      this.cache.delete(fingerprint);
      return null;
    }
    
    console.log(`✅ Cache hit for request fingerprint: ${fingerprint} (age: ${Math.round(age / 1000)}s)`);
    return cached.response;
  }

  set(fingerprint: string, response: ATSSuggestionResponse, provider: string): void {
    this.cache.set(fingerprint, {
      response,
      timestamp: Date.now(),
      provider
    });
    
    // Cleanup old entries if cache gets too large
    if (this.cache.size > 1000) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      // Remove oldest 200 entries
      entries.slice(0, 200).forEach(([key]) => this.cache.delete(key));
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export class EnhancedATSSuggestionEngine {
  private openai: OpenAI | null;
  private gemini: GoogleGenerativeAI | null;
  private groqApiKey: string | null;
  private requestCache: RequestDeduplicationCache;
  private semanticMatcher: SemanticATSMatcher;

  constructor() {
    this.requestCache = new RequestDeduplicationCache();
    this.semanticMatcher = new SemanticATSMatcher();
    
    // Initialize providers (same as original)
    const openaiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || null;
    if (openaiKey) {
      try {
        this.openai = new OpenAI({ 
          apiKey: openaiKey,
          defaultQuery: { 'model': process.env.OPENAI_MODEL || 'gpt-4o-mini' }
        });
        console.log('✅ Enhanced ATS Engine: OpenAI initialized');
      } catch (error) {
        console.error('❌ Failed to initialize OpenAI:', error);
        this.openai = null;
      }
    } else {
      this.openai = null;
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || null;
    if (geminiKey) {
      try {
        this.gemini = new GoogleGenerativeAI(geminiKey);
        console.log('✅ Enhanced ATS Engine: Gemini initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Gemini:', error);
        this.gemini = null;
      }
    } else {
      this.gemini = null;
    }

    this.groqApiKey = process.env.GROQ_API_KEY || null;
  }

  /**
   * Generate suggestions with deduplication and enhanced AI
   */
  async generateSuggestions(request: ATSSuggestionRequest): Promise<ATSSuggestionResponse> {
    // Check cache first (deduplication)
    const fingerprint = this.requestCache.generateFingerprint(request);
    const cached = this.requestCache.get(fingerprint);
    if (cached) {
      return cached;
    }

    const expLevel = this.normalizeExperienceLevel(request.experience_level);
    
    // Try providers in order with enhanced prompts
    let result: ATSSuggestionResponse | null = null;
    let provider = 'fallback';

    if (this.openai) {
      try {
        result = await this.generateWithOpenAIEnhanced(request, expLevel);
        provider = 'openai';
        if (result && result.skills && result.skills.length > 0) {
          console.log('✅ OpenAI generated', result.skills.length, 'skills');
        }
      } catch (error: any) {
        console.warn('OpenAI generation failed, trying Groq:', error.message);
      }
    }

    if (!result && this.groqApiKey) {
      try {
        result = await this.generateWithGroqEnhanced(request, expLevel);
        provider = 'groq';
        if (result && result.skills && result.skills.length > 0) {
          console.log('✅ Groq generated', result.skills.length, 'skills');
        }
      } catch (error: any) {
        console.warn('Groq generation failed, trying Gemini:', error.message);
      }
    }

    if (!result && this.gemini) {
      try {
        result = await this.generateWithGeminiEnhanced(request, expLevel);
        provider = 'gemini';
        if (result && result.skills && result.skills.length > 0) {
          console.log('✅ Gemini generated', result.skills.length, 'skills');
        }
      } catch (error: any) {
        console.warn('Gemini generation failed, using fallback:', error.message);
      }
    }

    if (!result) {
      console.warn('⚠️ Using enhanced fallback suggestions (AI not available)');
      result = this.generateFallbackSuggestions(request, expLevel);
      provider = 'fallback';
    }

    // Cache the result
    if (result) {
      this.requestCache.set(fingerprint, result, provider);
    }

    return result || this.generateFallbackSuggestions(request, expLevel);
  }

  /**
   * Enhanced OpenAI generation with structured outputs and chain-of-thought
   */
  private async generateWithOpenAIEnhanced(
    request: ATSSuggestionRequest,
    expLevel: string
  ): Promise<ATSSuggestionResponse> {
    if (!this.openai) throw new Error('OpenAI not available');

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    
    // Check if model supports structured outputs (gpt-4o, gpt-4-turbo, gpt-4o-mini)
    const supportsStructuredOutputs = model.includes('gpt-4o') || model.includes('gpt-4-turbo');
    
    // Enhanced prompt with chain-of-thought reasoning
    const systemPrompt = this.buildEnhancedSystemPrompt(request, expLevel);
    const userPrompt = this.buildChainOfThoughtPrompt(request, expLevel);

    const completion = await this.openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
      top_p: 0.9,
      // Use structured outputs if supported
      ...(supportsStructuredOutputs ? {
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'ats_suggestion_response',
            schema: {
              type: 'object',
              properties: {
                summary: {
                  type: 'string',
                  description: 'Professional summary (80-120 words, 3-5 sentences)'
                },
                skills: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 8,
                  maxItems: 14,
                  description: 'Technical and professional skills'
                },
                ats_keywords: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 15,
                  maxItems: 25,
                  description: 'ATS-optimized keywords'
                },
                experience_bullets: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 3,
                  maxItems: 6,
                  description: 'Achievement-focused experience bullets with metrics'
                },
                projects: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      description: { type: 'string' }
                    },
                    required: ['title', 'description']
                  },
                  minItems: 1,
                  maxItems: 2
                }
              },
              required: ['summary', 'skills', 'ats_keywords', 'experience_bullets', 'projects'],
              additionalProperties: false
            }
          }
        } as any
      } : {
        response_format: { type: 'json_object' }
      })
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('Empty response from OpenAI');

    const parsed = JSON.parse(response);
    return this.validateAndNormalizeResponse(parsed);
  }

  /**
   * Enhanced Gemini generation with better prompts
   */
  private async generateWithGeminiEnhanced(
    request: ATSSuggestionRequest,
    expLevel: string
  ): Promise<ATSSuggestionResponse> {
    if (!this.gemini) throw new Error('Gemini not available');

    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
    const systemPrompt = this.buildEnhancedSystemPrompt(request, expLevel);
    const userPrompt = this.buildChainOfThoughtPrompt(request, expLevel);

    const model = this.gemini.getGenerativeModel({ 
      model: modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 3000,
        responseMimeType: 'application/json',
        topP: 0.9,
        topK: 40,
      }
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
    });

    const response = result.response.text();
    if (!response) throw new Error('Empty response from Gemini');

    const parsed = JSON.parse(response);
    return this.validateAndNormalizeResponse(parsed);
  }

  /**
   * Enhanced Groq generation
   */
  private async generateWithGroqEnhanced(
    request: ATSSuggestionRequest,
    expLevel: string
  ): Promise<ATSSuggestionResponse> {
    if (!this.groqApiKey) throw new Error('Groq not available');

    const prompt = this.buildChainOfThoughtPrompt(request, expLevel);
    const systemPrompt = this.buildEnhancedSystemPrompt(request, expLevel);
    const model = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
    const groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';

    const response = await fetch(groqApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
        top_p: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error('Empty response from Groq');
    }

    const cleanedResponse = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedResponse);
    return this.validateAndNormalizeResponse(parsed);
  }

  /**
   * Enhanced system prompt with deeper context awareness
   */
  private buildEnhancedSystemPrompt(request: ATSSuggestionRequest, expLevel: string): string {
    const { job_title, industry, skills_input, summary_input } = request;
    
    // Deep context analysis
    const inferredJob = job_title || this.inferJobTitle(industry, skills_input);
    const inferredIndustry = industry || this.inferIndustry(job_title, skills_input);
    const careerStage = this.analyzeCareerStage(expLevel, skills_input, summary_input);
    const skillLevel = this.analyzeSkillLevel(skills_input, expLevel);
    
    return `You are an expert ATS resume strategist and career coach with deep industry knowledge.

YOUR EXPERTISE:
- ATS system optimization (Taleo, Workday, Greenhouse, Lever, etc.)
- Industry-specific keyword research
- Career progression patterns
- Resume writing best practices
- Recruiter psychology

CURRENT USER PROFILE ANALYSIS:
- Job Title: ${inferredJob || 'To be inferred'}
- Industry: ${inferredIndustry || 'To be inferred'}
- Experience Level: ${expLevel}
- Career Stage: ${careerStage.stage} (${careerStage.reasoning})
- Skill Level: ${skillLevel.level} (${skillLevel.reasoning})

CONTEXT-AWARE INTELLIGENCE:
- Understand implicit skills from job title and industry
- Infer career progression from experience level
- Adapt language to career stage (entry vs senior)
- Match industry-specific terminology
- Consider regional variations (India vs US markets)

OUTPUT REQUIREMENTS:
- Return ONLY valid JSON matching the exact schema
- All content must be REAL, industry-appropriate, and ATS-optimized
- NO placeholder text, lorem ipsum, or fake data
- Professional, recruiter-friendly language`;
  }

  /**
   * Chain-of-thought prompt for better reasoning
   */
  private buildChainOfThoughtPrompt(request: ATSSuggestionRequest, expLevel: string): string {
    const { job_title, industry, summary_input, skills_input, experience_input, education_input } = request;
    
    const inferredJob = job_title || this.inferJobTitle(industry, skills_input);
    const inferredIndustry = industry || this.inferIndustry(job_title, skills_input);
    
    // Detect user typing state
    const skillsParts = skills_input ? skills_input.split(',').map(s => s.trim()) : [];
    const currentTyping = skillsParts.length > 0 ? skillsParts[skillsParts.length - 1] : '';
    const existingSkills = skillsParts.length > 1 ? skillsParts.slice(0, -1) : [];
    const isUserTyping = currentTyping.length > 0 && currentTyping.length < 50;

    return `Generate ATS-optimized resume content using this step-by-step reasoning process:

STEP 1: ANALYZE CONTEXT
- Job Title: ${inferredJob || 'Infer from industry/skills'}
- Industry: ${inferredIndustry || 'Infer from job title'}
- Experience Level: ${expLevel}
- Existing Content: ${summary_input || 'None'} | ${existingSkills.join(', ') || 'None'} | ${experience_input || 'None'}
${isUserTyping ? `- ⚠️ USER TYPING: "${currentTyping}" - Generate suggestions RELATED to this` : ''}

STEP 2: INFER REQUIREMENTS
- What skills are typically required for ${inferredJob} in ${inferredIndustry}?
- What ATS keywords do recruiters search for?
- What achievements are expected at ${expLevel} level?
- What projects demonstrate relevant expertise?

STEP 3: IDENTIFY GAPS
- Compare existing content with typical requirements
- Identify missing skills, keywords, or achievements
- Note areas needing enhancement

STEP 4: GENERATE CONTENT
- Create comprehensive summary (80-120 words, 3-5 sentences)
- Generate 8-14 relevant skills (${isUserTyping ? `prioritize skills related to "${currentTyping}"` : 'mix of technical and soft skills'})
- Extract 15-25 ATS keywords (industry-specific + action verbs)
- Write 3-6 experience bullets with metrics (STAR format)
- Suggest 1-2 relevant projects

STEP 5: VALIDATE QUALITY
- Ensure all content is REAL and industry-appropriate
- Verify ATS keyword density
- Check for quantifiable achievements
- Confirm professional language

OUTPUT FORMAT (JSON only):
{
  "summary": "Professional summary (80-120 words, 3-5 sentences)",
  "skills": ["Skill 1", "Skill 2", ...],
  "ats_keywords": ["Keyword 1", "Keyword 2", ...],
  "experience_bullets": ["Bullet 1 with metric", "Bullet 2 with metric", ...],
  "projects": [{"title": "Project Title", "description": "One-line description"}]
}`;
  }

  /**
   * Analyze career stage from context
   */
  private analyzeCareerStage(expLevel: string, skills: string, summary: string): { stage: string; reasoning: string } {
    const level = expLevel.toLowerCase();
    
    if (level.includes('fresher') || level.includes('student')) {
      return {
        stage: 'Entry Level',
        reasoning: 'Early career, focus on foundational skills and learning potential'
      };
    }
    
    if (level.includes('senior') || level.includes('lead') || level.includes('executive')) {
      return {
        stage: 'Senior Level',
        reasoning: 'Advanced career, emphasize leadership, strategy, and impact'
      };
    }
    
    // Infer from skills/summary if ambiguous
    const hasAdvancedSkills = skills.toLowerCase().includes('architect') || 
                              skills.toLowerCase().includes('lead') ||
                              skills.toLowerCase().includes('senior');
    
    if (hasAdvancedSkills) {
      return {
        stage: 'Mid-Senior Level',
        reasoning: 'Inferred from skills indicating advanced expertise'
      };
    }
    
    return {
      stage: 'Mid Level',
      reasoning: 'Professional with 3-7 years experience, focus on execution and growth'
    };
  }

  /**
   * Analyze skill level from context
   */
  private analyzeSkillLevel(skills: string, expLevel: string): { level: string; reasoning: string } {
    if (!skills || skills.trim().length === 0) {
      return {
        level: 'To be determined',
        reasoning: 'No skills provided, will infer from job title and industry'
      };
    }
    
    const skillCount = skills.split(',').length;
    const hasFrameworks = /react|angular|vue|django|spring|express/i.test(skills);
    const hasCloud = /aws|azure|gcp|docker|kubernetes/i.test(skills);
    const hasAdvanced = /architecture|design|lead|senior|expert/i.test(skills);
    
    if (hasAdvanced || hasCloud) {
      return {
        level: 'Advanced',
        reasoning: 'Skills indicate senior-level expertise with cloud/architecture knowledge'
      };
    }
    
    if (hasFrameworks && skillCount > 5) {
      return {
        level: 'Intermediate-Advanced',
        reasoning: 'Multiple frameworks and tools suggest solid technical foundation'
      };
    }
    
    return {
      level: 'Intermediate',
      reasoning: 'Standard professional skill set, appropriate for mid-level roles'
    };
  }

  // Helper methods (reuse from original implementation)
  private normalizeExperienceLevel(level: string): string {
    const normalized = level.toLowerCase().trim();
    if (normalized.includes('fresher') || normalized.includes('fresh')) return 'fresher';
    if (normalized.includes('student') || normalized.includes('intern')) return 'student';
    if (normalized.includes('senior') || normalized.includes('executive') || normalized.includes('lead')) return 'senior';
    if (normalized.includes('experience') || normalized.includes('mid') || normalized.includes('professional')) return 'experienced';
    return 'experienced';
  }

  private inferJobTitle(industry: string, skills: string): string {
    if (!industry && !skills) return '';
    const combined = `${industry} ${skills}`.toLowerCase();
    if (combined.includes('javascript') || combined.includes('react') || combined.includes('node')) return 'Software Developer';
    if (combined.includes('python') || combined.includes('django')) return 'Python Developer';
    if (combined.includes('java') || combined.includes('spring')) return 'Java Developer';
    if (combined.includes('sales') || combined.includes('customer')) return 'Sales Representative';
    if (combined.includes('marketing') || combined.includes('digital')) return 'Marketing Specialist';
    return '';
  }

  private inferIndustry(jobTitle: string, skills: string): string {
    if (!jobTitle && !skills) return '';
    const combined = `${jobTitle} ${skills}`.toLowerCase();
    if (combined.includes('software') || combined.includes('tech') || combined.includes('developer')) return 'Technology';
    if (combined.includes('finance') || combined.includes('banking')) return 'Finance';
    if (combined.includes('health') || combined.includes('medical')) return 'Healthcare';
    return '';
  }

  private validateAndNormalizeResponse(parsed: any): ATSSuggestionResponse {
    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
      skills: Array.isArray(parsed.skills) 
        ? parsed.skills.filter((s: any) => typeof s === 'string' && s.trim().length > 0).map((s: string) => s.trim()).slice(0, 14)
        : [],
      ats_keywords: Array.isArray(parsed.ats_keywords)
        ? parsed.ats_keywords.filter((k: any) => typeof k === 'string' && k.trim().length > 0).map((k: string) => k.trim()).slice(0, 25)
        : [],
      experience_bullets: Array.isArray(parsed.experience_bullets)
        ? parsed.experience_bullets.filter((b: any) => typeof b === 'string' && b.trim().length > 0).map((b: string) => b.trim()).slice(0, 6)
        : [],
      projects: Array.isArray(parsed.projects)
        ? parsed.projects
            .filter((p: any) => p && typeof p.title === 'string' && typeof p.description === 'string')
            .map((p: any) => ({ title: p.title.trim(), description: p.description.trim() }))
            .slice(0, 2)
        : []
    };
  }

  private generateFallbackSuggestions(request: ATSSuggestionRequest, expLevel: string): ATSSuggestionResponse {
    const jobTitle = request.job_title || this.inferJobTitle(request.industry, request.skills_input) || 'Professional';
    const industry = request.industry || this.inferIndustry(request.job_title, request.skills_input) || 'General';
    
    return {
      summary: `${this.getLevelText(expLevel)} ${jobTitle} with expertise in ${industry}. Proven track record of delivering results and driving success. Strong problem-solving skills and ability to work in fast-paced environments.`,
      skills: this.getBaseSkillsForJob(jobTitle, industry).slice(0, 12),
      ats_keywords: ['Professional Excellence', 'Quality Assurance', 'Best Practices', 'Team Collaboration', 'Problem Solving'].slice(0, 20),
      experience_bullets: [
        `Developed ${this.getTaskForJob(jobTitle)} resulting in improved efficiency by 25%`,
        `Implemented ${this.getTaskForJob(jobTitle)} leading to reduced costs by 20%`,
        `Led cross-functional team to deliver ${this.getTaskForJob(jobTitle)}`
      ],
      projects: [
        { title: `${industry} ${this.getProjectTypeForJob(jobTitle)}`, description: `Developed and implemented solution for ${industry} industry.` }
      ]
    };
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
    if (
      title.includes('makeup') ||
      title.includes('beauty') ||
      title.includes('bridal') ||
      title.includes('cosmet')
    ) {
      return [
        'Bridal Makeup',
        'Beauty Consultation',
        'Hair Styling',
        'Client Management',
        'Cosmetics',
        'Skin Care',
        'HD Makeup',
        'Event Makeup',
      ];
    }
    if (title.includes('teacher') || title.includes('educator') || title.includes('tutor')) {
      return [
        'Lesson Planning',
        'Classroom Management',
        'Student Assessment',
        'Curriculum Development',
        'Communication',
        'Educational Technology',
      ];
    }
    if (title.includes('accountant') || title.includes('accounting') || title.includes('finance')) {
      return ['Accounting', 'GST', 'Taxation', 'Tally', 'Financial Reporting', 'Excel', 'Bookkeeping', 'Auditing'];
    }
    if (title.includes('developer') || title.includes('engineer')) {
      return ['JavaScript', 'Python', 'Java', 'Git', 'SQL', 'REST APIs', 'Docker', 'AWS', 'Agile', 'Version Control'];
    }
    if (title.includes('data') || title.includes('analyst')) {
      return ['Python', 'SQL', 'Data Analysis', 'Machine Learning', 'Pandas', 'Tableau', 'Excel', 'Statistics'];
    }
    return ['Communication', 'Problem Solving', 'Time Management', 'Project Management', 'Analytical Thinking'];
  }

  private getTaskForJob(jobTitle: string): string {
    const title = jobTitle.toLowerCase();
    if (title.includes('developer') || title.includes('engineer')) return 'scalable software solutions';
    if (title.includes('manager')) return 'high-performing teams';
    return 'key initiatives';
  }

  private getProjectTypeForJob(jobTitle: string): string {
    const title = jobTitle.toLowerCase();
    if (title.includes('developer') || title.includes('engineer')) return 'Web Application';
    if (title.includes('data') || title.includes('analyst')) return 'Data Analysis';
    return 'Business Solution';
  }

  /**
   * Calculate semantic match between resume content and job description
   * Phase 1.5: Semantic ATS matching
   */
  async calculateSemanticMatch(
    resumeContent: {
      summary?: string;
      skills?: string[];
      experience?: string[];
      education?: string[];
    },
    jobDescription: string,
    requiredSkills?: string[]
  ): Promise<SemanticMatchResult> {
    // Build resume text from content
    const resumeText = [
      resumeContent.summary || '',
      resumeContent.skills?.join(', ') || '',
      resumeContent.experience?.join(' ') || '',
      resumeContent.education?.join(' ') || ''
    ].filter(Boolean).join(' ');

    const match: ResumeJobMatch = {
      resumeText,
      jobDescription,
      requiredSkills: requiredSkills || resumeContent.skills || []
    };

    return await this.semanticMatcher.calculateMatch(match);
  }

  /**
   * Enhance suggestions with semantic matching insights.
   * When userResumeForMatch is provided, semantic scores reflect the candidate's real resume (not AI output).
   */
  async generateSuggestionsWithSemanticInsights(
    request: ATSSuggestionRequest,
    jobDescription?: string,
    userResumeForMatch?: {
      summary?: string;
      skills?: string[];
      experience?: string[];
      education?: string[];
    }
  ): Promise<ATSSuggestionResponse & { semanticMatch?: SemanticMatchResult }> {
    // Generate base suggestions
    const suggestions = await this.generateSuggestions(request);

    // If job description provided, calculate semantic match
    if (jobDescription && this.semanticMatcher.isAvailable()) {
      try {
        const resumeForMatch = userResumeForMatch ?? {
          summary: request.summary_input || '',
          skills: request.skills_input
            ? request.skills_input.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
          experience: request.experience_input ? [request.experience_input] : [],
          education: request.education_input ? [request.education_input] : [],
        };

        const semanticMatch = await this.calculateSemanticMatch(
          resumeForMatch,
          jobDescription,
          resumeForMatch.skills
        );

        // Enhance suggestions based on semantic match
        if (semanticMatch.matchScore < 70) {
          // Add missing skills to suggestions
          const missingSkills = semanticMatch.missingSkills.slice(0, 3);
          suggestions.skills = [...new Set([...suggestions.skills, ...missingSkills])].slice(0, 14);

          // Add missing keywords to ATS keywords
          const missingKeywords = semanticMatch.missingKeywords.slice(0, 5);
          suggestions.ats_keywords = [...new Set([...suggestions.ats_keywords, ...missingKeywords])].slice(0, 25);
        }

        return {
          ...suggestions,
          semanticMatch
        };
      } catch (error) {
        console.warn('Semantic matching failed, returning base suggestions:', error);
      }
    }

    return suggestions;
  }
}

