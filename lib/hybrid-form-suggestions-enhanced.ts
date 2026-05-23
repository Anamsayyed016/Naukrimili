/**
 * Enhanced Hybrid Form Suggestions Service
 * Phase 1 AI Upgrades:
 * - Request deduplication
 * - Enhanced prompt engineering with chain-of-thought
 * - Deeper context analysis
 * - Structured outputs where supported
 * 
 * Backward compatible with existing HybridFormSuggestions
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createHash } from 'crypto';
import {
  buildSuggestionCacheFingerprint,
  dedupeSuggestions,
  enhanceContextForRequest,
  finalizeSuggestionResponse,
  resolveDeterministicSuggestions,
  SUGGESTION_LIMIT_DEFAULT,
} from '@/lib/resume-builder/suggestion-orchestrator';
import { buildPromptContextBlock } from '@/lib/resume-builder/suggestion-context-engine';

export interface FormSuggestion {
  suggestions: string[];
  confidence: number;
  aiProvider: 'openai' | 'gemini' | 'groq' | 'fallback' | 'hybrid';
}

// Request cache for deduplication
interface CachedFormSuggestion {
  response: FormSuggestion;
  timestamp: number;
}

class FormRequestCache {
  private cache = new Map<string, CachedFormSuggestion>();
  private readonly TTL = 3 * 60 * 1000; // 3 minutes (shorter for form suggestions)

  generateFingerprint(field: string, value: string, context: any): string {
    if (context?.regenerate) {
      return createHash('sha256')
        .update(buildSuggestionCacheFingerprint(field, value, context))
        .digest('hex')
        .substring(0, 16);
    }
    const hashInput = buildSuggestionCacheFingerprint(field, value, context);
    return createHash('sha256').update(hashInput).digest('hex').substring(0, 16);
  }

  get(fingerprint: string): FormSuggestion | null {
    const cached = this.cache.get(fingerprint);
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > this.TTL) {
      this.cache.delete(fingerprint);
      return null;
    }
    
    console.log(`✅ Form cache hit: ${fingerprint} (age: ${Math.round(age / 1000)}s)`);
    return cached.response;
  }

  set(fingerprint: string, response: FormSuggestion): void {
    this.cache.set(fingerprint, {
      response,
      timestamp: Date.now()
    });
    
    // Cleanup if cache gets too large
    if (this.cache.size > 500) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      entries.slice(0, 100).forEach(([key]) => this.cache.delete(key));
    }
  }
}

export class EnhancedHybridFormSuggestions {
  private openai: OpenAI | null;
  private gemini: GoogleGenerativeAI | null;
  private groqApiKey: string | null;
  private requestCache: FormRequestCache;

  constructor() {
    this.requestCache = new FormRequestCache();
    
    // Initialize providers (same as original)
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.warn('⚠️ OPENAI_API_KEY not found. OpenAI form suggestions will be disabled.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({ apiKey: openaiKey });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found. Gemini form suggestions will be disabled.');
      this.gemini = null;
    } else {
      this.gemini = new GoogleGenerativeAI(geminiKey);
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      console.warn('⚠️ GROQ_API_KEY not found. Groq form suggestions will be disabled.');
      this.groqApiKey = null;
    } else {
      this.groqApiKey = groqKey;
    }
  }

  /**
   * Generate suggestions with deduplication and enhanced prompts
   */
  async generateSuggestions(field: string, value: string, context: any): Promise<FormSuggestion> {
    const ctx = enhanceContextForRequest(field, context || {}, {
      regenerate: !!context?.regenerate,
      excludeSuggestions: Array.isArray(context?.excludeSuggestions)
        ? context.excludeSuggestions
        : [],
    });
    const exclude = (ctx.excludeSuggestions as string[]) || [];

    // Check cache first (skip when regenerating)
    if (!ctx.regenerate) {
      const fingerprint = this.requestCache.generateFingerprint(field, value, ctx);
      const cached = this.requestCache.get(fingerprint);
      if (cached) {
        return cached;
      }
    }

    const deterministic = resolveDeterministicSuggestions(field, value, ctx);
    if (deterministic?.length && !this.openai && !this.gemini && !this.groqApiKey) {
      const only = dedupeSuggestions(deterministic, exclude, SUGGESTION_LIMIT_DEFAULT);
      return { suggestions: only, confidence: 55, aiProvider: 'fallback' };
    }

    console.log(`🔮 Generating enhanced suggestions for field: ${field}`);

    // Check if any AI providers are available
    if (!this.openai && !this.gemini && !this.groqApiKey) {
      console.log(`⚠️ No AI providers available for ${field}, using enhanced fallback`);
      const fallback = this.getEnhancedFallbackSuggestions(field, value, ctx);
      return this.finalizeSuggestions(field, value, ctx, fallback, deterministic, exclude);
    }

    // Try providers in parallel
    const promises: Promise<FormSuggestion>[] = [];

    if (this.openai) {
      promises.push(this.generateWithOpenAIEnhanced(field, value, ctx));
    }

    if (this.gemini) {
      promises.push(this.generateWithGeminiEnhanced(field, value, ctx));
    }

    if (this.groqApiKey) {
      promises.push(this.generateWithGroqEnhanced(field, value, ctx));
    }

    try {
      const results = await Promise.allSettled(promises);
      const successfulResults: FormSuggestion[] = [];

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          successfulResults.push(result.value);
        }
      });

      if (successfulResults.length === 0) {
        const fallback = this.getEnhancedFallbackSuggestions(field, value, ctx);
        return this.finalizeSuggestions(field, value, ctx, fallback, deterministic, exclude);
      }

      const finalResult = successfulResults.length > 1
        ? this.combineSuggestions(successfulResults)
        : successfulResults[0];

      return this.finalizeSuggestions(field, value, ctx, finalResult, deterministic, exclude);

    } catch (error) {
      console.error(`❌ Enhanced hybrid suggestions failed for ${field}:`, error);
      const fallback = this.getEnhancedFallbackSuggestions(field, value, ctx);
      return this.finalizeSuggestions(field, value, ctx, fallback, deterministic, exclude);
    }
  }

  private finalizeSuggestions(
    field: string,
    value: string,
    context: Record<string, unknown>,
    aiResult: FormSuggestion,
    deterministic: string[] | null,
    exclude: string[]
  ): FormSuggestion {
    const suggestions = finalizeSuggestionResponse(
      field,
      context,
      aiResult.suggestions,
      deterministic,
      exclude
    );

    const result: FormSuggestion = {
      suggestions:
        suggestions.length > 0
          ? suggestions
          : dedupeSuggestions(
              this.getEnhancedFallbackSuggestions(field, value, context).suggestions,
              exclude,
              field === 'summary' ? 8 : SUGGESTION_LIMIT_DEFAULT
            ),
      confidence: aiResult.confidence,
      aiProvider: aiResult.aiProvider,
    };

    if (!context.regenerate) {
      const fingerprint = this.requestCache.generateFingerprint(field, value, context);
      this.requestCache.set(fingerprint, result);
    }
    return result;
  }

  /**
   * Enhanced OpenAI generation with chain-of-thought prompts
   */
  private async generateWithOpenAIEnhanced(field: string, value: string, context: any): Promise<FormSuggestion> {
    if (!this.openai) throw new Error('OpenAI not available');

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const supportsStructuredOutputs = model.includes('gpt-4o') || model.includes('gpt-4-turbo');
    
    // Enhanced prompt with chain-of-thought
    const systemPrompt = this.buildEnhancedSystemPrompt(field, context);
    const userPrompt = this.buildChainOfThoughtPrompt(field, value, context);

    const completion = await this.openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens:
        field === 'summary' ? 2000 : field === 'project' || field === 'description' ? 900 : 600,
      temperature: context?.regenerate ? 0.88 : 0.55,
      ...(context?.regenerate ? { seed: Math.floor(Math.random() * 1_000_000_000) } : {}),
      // Use structured outputs if supported
      ...(supportsStructuredOutputs && field === 'summary' ? {
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'form_suggestions',
            schema: {
              type: 'object',
              properties: {
                suggestions: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 5,
                  maxItems: 8,
                  description: 'Array of professional summary suggestions'
                }
              },
              required: ['suggestions']
            }
          }
        } as any
      } : {})
    });

    let response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from OpenAI');

    response = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      let suggestions: string[] = [];
      
      try {
        const parsed = JSON.parse(response);
        if (Array.isArray(parsed)) {
          suggestions = parsed.filter((s: any) => typeof s === 'string' && s.trim().length > 0);
        } else if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
          suggestions = parsed.suggestions.filter((s: any) => typeof s === 'string' && s.trim().length > 0);
        } else if (typeof parsed === 'string') {
          suggestions = [parsed].filter(s => s.trim().length > 0);
        }
      } catch {
        const arrayMatch = response.match(/\[[\s\S]*?\]/);
        if (arrayMatch) {
          try {
            const parsed = JSON.parse(arrayMatch[0]);
            suggestions = Array.isArray(parsed) 
              ? parsed.filter((s: any) => typeof s === 'string' && s.trim().length > 0)
              : [];
          } catch (e) {
            console.warn('Failed to parse matched array:', e);
          }
        }
        
        if (suggestions.length === 0) {
          suggestions = response
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('//') && !line.startsWith('/*'))
            .map(line => line.replace(/^[-*•]\s*/, '').replace(/^["']|["']$/g, '').replace(/^[0-9]+\.\s*/, ''))
            .filter(line => line.length > 5);
        }
      }
      
      const uniqueSuggestions = Array.from(new Set(suggestions.map(s => s.trim())))
        .filter(s => s.length > 0);
      
      if (uniqueSuggestions.length === 0) {
        throw new Error('No valid suggestions extracted');
      }
      
      return {
        suggestions: uniqueSuggestions,
        confidence: 90, // Higher confidence with enhanced prompts
        aiProvider: 'openai'
      };
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      throw new Error('Failed to parse OpenAI response');
    }
  }

  /**
   * Enhanced Gemini generation
   */
  private async generateWithGeminiEnhanced(field: string, value: string, context: any): Promise<FormSuggestion> {
    if (!this.gemini) throw new Error('Gemini not available');

    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
    const systemPrompt = this.buildEnhancedSystemPrompt(field, context);
    const userPrompt = this.buildChainOfThoughtPrompt(field, value, context);

    const model = this.gemini.getGenerativeModel({ 
      model: modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: context?.regenerate ? 0.85 : 0.5,
        maxOutputTokens: field === 'summary' ? 2500 : 600,
        responseMimeType: 'application/json',
        topP: 0.8,
        topK: 30,
      }
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }]
    });

    let responseText = result.response.text();
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    if (!responseText) throw new Error('No response from Gemini');

    try {
      let suggestions: string[] = [];
      const parsed = JSON.parse(responseText);
      
      if (Array.isArray(parsed)) {
        suggestions = parsed.filter((s: any) => typeof s === 'string' && s.trim().length > 0);
      } else if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        suggestions = parsed.suggestions.filter((s: any) => typeof s === 'string' && s.trim().length > 0);
      }
      
      const uniqueSuggestions = Array.from(new Set(suggestions.map(s => s.trim())))
        .filter(s => s.length > 0);
      
      if (uniqueSuggestions.length === 0) {
        throw new Error('No valid suggestions extracted');
      }
      
      return {
        suggestions: uniqueSuggestions,
        confidence: 90,
        aiProvider: 'gemini'
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      throw new Error('Failed to parse Gemini response');
    }
  }

  /**
   * Enhanced Groq generation
   */
  private async generateWithGroqEnhanced(field: string, value: string, context: any): Promise<FormSuggestion> {
    if (!this.groqApiKey) throw new Error('Groq not available');

    const prompt = this.buildChainOfThoughtPrompt(field, value, context);
    const systemPrompt = this.buildEnhancedSystemPrompt(field, context);
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
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        max_tokens:
        field === 'summary' ? 2000 : field === 'project' || field === 'description' ? 900 : 600,
        temperature: context?.regenerate ? 0.85 : 0.5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let responseText = data.choices[0]?.message?.content;

    if (!responseText) throw new Error('No response from Groq');

    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      let suggestions: string[] = [];
      const parsed = JSON.parse(responseText);
      
      if (Array.isArray(parsed)) {
        suggestions = parsed.filter((s: any) => typeof s === 'string' && s.trim().length > 0);
      } else if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        suggestions = parsed.suggestions.filter((s: any) => typeof s === 'string' && s.trim().length > 0);
      }
      
      const uniqueSuggestions = Array.from(new Set(suggestions.map(s => s.trim())))
        .filter(s => s.length > 0);
      
      if (uniqueSuggestions.length === 0) {
        throw new Error('No valid suggestions extracted');
      }
      
      return {
        suggestions: uniqueSuggestions,
        confidence: 90,
        aiProvider: 'groq'
      };
    } catch (error) {
      console.error('Failed to parse Groq response:', error);
      throw new Error('Failed to parse Groq response');
    }
  }

  /**
   * Enhanced system prompt with deeper context
   */
  private buildEnhancedSystemPrompt(field: string, context: any): string {
    const jobTitle = context?.jobTitle || '';
    const industry = context?.industry || 'General';
    const experienceLevel = context?.experienceLevel || 'Mid-level';
    
    return `You are an expert career assistant providing REAL-TIME, DYNAMIC suggestions as users type.

YOUR EXPERTISE:
- Industry-specific terminology and best practices
- Career progression patterns
- ATS optimization strategies
- Professional writing standards

CURRENT CONTEXT:
- Field: ${field}
- Job Title: ${jobTitle || 'Not specified'}
- Industry: ${industry}
- Experience Level: ${experienceLevel}
- JD provided: ${(context?.jobDescription && String(context.jobDescription).length > 40) ? 'yes — align suggestions with jdSkills and jdKeywords in user message' : 'no'}

INTELLIGENCE REQUIREMENTS:
- Analyze user input character-by-character
- Infer implicit requirements from context
- Generate DISTINCT, non-redundant suggestions
- Adapt instantly to user's typing
- Use industry-specific language
- Ensure professional, recruiter-friendly output

OUTPUT REQUIREMENTS:
- Return ONLY valid JSON array of strings
- NO markdown, NO explanations, NO code blocks
- Each suggestion must be DISTINCT and immediately usable`;
  }

  /**
   * Chain-of-thought prompt for better reasoning
   */
  private buildChainOfThoughtPrompt(field: string, value: string, context: any): string {
    const baseContext = {
      jobType: context.jobType || 'Full-time',
      experienceLevel: context.experienceLevel || 'Mid-level',
      industry: context.industry || 'Technology',
      skills: context.skills || [],
      companyName: context.companyName || '',
      jobTitle: context.jobTitle || '',
    };

    const userContent = value || '';
    const hasUserContent = userContent.trim().length > 0;
    const excludeList = [
      ...((context.previousSuggestions as string[]) || []),
      ...((context.excludeSuggestions as string[]) || []),
    ];
    const variationHint = context.regenerate
      ? `\nREGENERATE (required): Style="${context.variationTone || 'alternate'}". Produce wholly NEW wording. Forbidden repeats: ${excludeList.slice(0, 8).map((s) => `"${String(s).slice(0, 60)}"`).join(', ')}`
      : '';
    const domainRule =
      context.suggestionDomain === 'resume-project'
        ? '\nCRITICAL: Resume PROJECT context only. NEVER write job postings, hiring ads, or "we are seeking" language.'
        : '';
    const contextBlock = buildPromptContextBlock(context);

    // Field-specific chain-of-thought prompts
    switch (field) {
      case 'summary':
        return `Generate professional summary suggestions using this reasoning:

STRUCTURED CONTEXT (use all fields):
${contextBlock}

STEP 1: ANALYZE CONTEXT
- Job Title: ${baseContext.jobTitle || 'Professional'}
- Experience: ${baseContext.experienceLevel}
- Industry: ${baseContext.industry}
- JD skills: ${(context.jdSkills || []).slice(0, 8).join(', ') || 'none'}
- User Input: "${userContent.substring(0, 200)}"

STEP 2: INFER REQUIREMENTS
- What value proposition is expected for this role?
- What key skills should be highlighted?
- What achievements are typical at this level?

STEP 3: GENERATE VARIATIONS
- Create 5-8 DISTINCT summary variations
- Each: 80-120 words, 3-5 sentences
- Build upon user input if provided
- Use professional, ATS-friendly language

STEP 4: VALIDATE
- Ensure each is complete and compelling
- Verify no redundancy between variations
- Check professional tone

Return JSON: {"suggestions": ["Summary 1", "Summary 2", ...]}${variationHint}${domainRule}`;

      case 'skills':
        return `Generate skill suggestions using this reasoning:

STRUCTURED CONTEXT:
${contextBlock}

STEP 1: ANALYZE
- User typing: "${userContent}"
- Job Title: ${baseContext.jobTitle}
- Industry: ${baseContext.industry}
- Existing skills: ${baseContext.skills.slice(0, 5).join(', ') || 'None'}

STEP 2: INFER RELATED SKILLS
- If user typed a framework → suggest ecosystem tools
- If user typed a language → suggest frameworks/libraries
- If user typed a tool → suggest complementary services

STEP 3: GENERATE
- 6 skills directly related to "${userContent}"
- Include commonly used together technologies
- Prioritize industry-standard tools
- NO confidence percentages or scores

Return JSON: {"suggestions": ["Skill 1", "Skill 2", ...]}${variationHint}`;

      case 'project':
        return `Generate project TITLE suggestions (short names only, 2-6 words each).

STRUCTURED CONTEXT:
${contextBlock}

CONTEXT:
- Job Title: ${baseContext.jobTitle || context.jobTitle || 'Software Developer'}
- User typing: "${userContent}"
- Existing projects: ${(context.existingProjects || []).join(', ') || 'None'}
- Skills: ${(context.skills || baseContext.skills || []).slice(0, 8).join(', ') || 'None'}

RULES:
- If input suggests job portal / recruitment / ATS / resume → suggest hiring-platform projects ONLY
- If input suggests ecommerce → cart, checkout, payments themes
- NEVER suggest unrelated domains (e.g. sales forecasting for a job portal)
- 6 DISTINCT titles, recruiter-friendly

Return JSON: {"suggestions": ["Title 1", ...]}${variationHint}${domainRule}`;

      case 'description': {
        const isProject = !!context.isProjectDescription;
        const projectName = context.currentProjectName || context.currentProjectName || userContent;
        const tech = (context.projectTechnologies || context.skills || []).slice(0, 6).join(', ');
        if (isProject) {
          return `Generate PROJECT DESCRIPTION bullet paragraphs (2-4 sentences each, ATS-friendly).

PROJECT NAME: "${projectName}"
TECH STACK: ${tech || 'infer from role'}
ROLE: ${baseContext.jobTitle}
USER DRAFT: "${userContent.substring(0, 400)}"

RULES:
- Descriptions MUST match the project domain (job portal → recruitment, ATS, resume builder)
- Mention concrete features: auth, APIs, dashboards, parsing, matching — as appropriate
- Use technologies from context when provided
- 6 DISTINCT descriptions; NO generic data-analytics filler unless project is analytics
- NO percentages or confidence scores

Return JSON: {"suggestions": ["Description 1", ...]}`;
        }
        return `Generate work experience / responsibility description suggestions.

ROLE: ${baseContext.jobTitle}
EXPERIENCE LEVEL: ${baseContext.experienceLevel}
USER INPUT: "${userContent}"

Return 6 ATS-friendly achievement-style bullets as JSON: {"suggestions": [...]}`;
      }

      case 'experience':
        return `Generate resume EXPERIENCE bullet suggestions (achievement bullets for candidate's own resume — NOT a job posting).

STRUCTURED CONTEXT:
${contextBlock}

- Role: ${baseContext.jobTitle}
- Level: ${baseContext.experienceLevel}
- User context: "${userContent.substring(0, 300)}"
- Skills: ${(context.skills || []).slice(0, 6).join(', ')}
- JD responsibilities to mirror: ${(context.jdResponsibilities || []).slice(0, 3).join(' | ') || 'infer from role'}

Return 6 DISTINCT achievement bullets (metrics where realistic). JSON: {"suggestions": [...]}${variationHint}`;

      case 'jobTitle':
      case 'title':
        return `Generate job title suggestions for someone typing "${userContent}" targeting role "${baseContext.jobTitle}".
Return 6 professional titles (e.g. Software Engineer, Full Stack Developer). JSON: {"suggestions": [...]}`;

      default:
        return `Generate ${field} suggestions for:
- User Input: "${userContent}"
- Context: ${JSON.stringify({ ...baseContext, projectName: context.currentProjectName, isProject: context.isProjectDescription })}

Return 6 DISTINCT, professional suggestions as JSON: {"suggestions": [...]}`;
    }
  }

  /**
   * Combine suggestions from multiple providers
   */
  private combineSuggestions(results: FormSuggestion[]): FormSuggestion {
    const allSuggestions = new Set<string>();
    let totalConfidence = 0;

    const sortedResults = results.sort((a, b) => {
      if (a.aiProvider === 'groq') return -1;
      if (b.aiProvider === 'groq') return 1;
      return 0;
    });

    sortedResults.forEach(result => {
      result.suggestions.forEach(suggestion => allSuggestions.add(suggestion));
      totalConfidence += result.confidence;
    });

    return {
      suggestions: Array.from(allSuggestions),
      confidence: Math.round(totalConfidence / results.length),
      aiProvider: 'hybrid'
    };
  }

  /**
   * Enhanced fallback - reuses original fallback logic for consistency
   */
  private getEnhancedFallbackSuggestions(field: string, value: string, context: any): FormSuggestion {
    const deterministic = resolveDeterministicSuggestions(field, value, context);
    if (deterministic?.length) {
      return { suggestions: deterministic, confidence: 50, aiProvider: 'fallback' };
    }
    return { suggestions: [], confidence: 30, aiProvider: 'fallback' };
  }
}

