/**
 * Enhanced AI Service
 * Uses OpenAI and Google Cloud APIs for better AI-powered features
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIEnhancementRequest {
  jobTitle?: string;
  industry?: string;
  experienceLevel?: string;
  currentContent?: string;
  enhancementType: 'summary' | 'skills' | 'experience' | 'keywords' | 'optimize';
}

export interface AIEnhancementResponse {
  enhanced: string;
  suggestions: string[];
  keywords: string[];
  confidence: number;
}

export class EnhancedAIService {
  private openai: OpenAI | null;
  private gemini: GoogleGenerativeAI | null;

  constructor() {
    // Initialize OpenAI with enhanced configuration
    const openaiKey = process.env.OPENAI_API_KEY || null;
    if (openaiKey) {
      try {
        this.openai = new OpenAI({ 
          apiKey: openaiKey,
        });
        console.log('✅ Enhanced AI Service: OpenAI initialized');
      } catch (error) {
        console.error('❌ Failed to initialize OpenAI:', error);
        this.openai = null;
      }
    } else {
      this.openai = null;
      console.warn('⚠️ OPENAI_API_KEY not found');
    }

    // Initialize Gemini
    const geminiKey = process.env.GEMINI_API_KEY || null;
    if (geminiKey) {
      try {
        this.gemini = new GoogleGenerativeAI(geminiKey);
        console.log('✅ Enhanced AI Service: Gemini initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Gemini:', error);
        this.gemini = null;
      }
    } else {
      this.gemini = null;
      console.warn('⚠️ GEMINI_API_KEY not found');
    }
  }

  /**
   * Enhance resume content using AI
   */
  async enhanceContent(request: AIEnhancementRequest): Promise<AIEnhancementResponse> {
    // Try OpenAI first, then Gemini, then fallback
    if (this.openai) {
      try {
        return await this.enhanceWithOpenAI(request);
      } catch (error) {
        console.warn('OpenAI enhancement failed, trying Gemini:', error);
      }
    }

    if (this.gemini) {
      try {
        return await this.enhanceWithGemini(request);
      } catch (error) {
        console.warn('Gemini enhancement failed:', error);
      }
    }

    // Fallback
    return {
      enhanced: request.currentContent || '',
      suggestions: [],
      keywords: [],
      confidence: 0.5,
    };
  }

  /**
   * Enhance with OpenAI
   */
  private async enhanceWithOpenAI(request: AIEnhancementRequest): Promise<AIEnhancementResponse> {
    if (!this.openai) throw new Error('OpenAI not available');

    const prompt = this.buildEnhancementPrompt(request);
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    const completion = await this.openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are an expert ATS resume optimizer. Enhance resume content to be more ATS-friendly, professional, and impactful. Return JSON with enhanced content, suggestions, and keywords.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('Empty response from OpenAI');

    const parsed = JSON.parse(response);
    return {
      enhanced: parsed.enhanced || request.currentContent || '',
      suggestions: parsed.suggestions || [],
      keywords: parsed.keywords || [],
      confidence: parsed.confidence || 0.8,
    };
  }

  /**
   * Enhance with Gemini
   */
  private async enhanceWithGemini(request: AIEnhancementRequest): Promise<AIEnhancementResponse> {
    if (!this.gemini) throw new Error('Gemini not available');

    const prompt = this.buildEnhancementPrompt(request);
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
    const model = this.gemini.getGenerativeModel({ model: modelName });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000,
        responseMimeType: 'application/json'
      }
    });

    const response = result.response.text();
    if (!response) throw new Error('Empty response from Gemini');

    const parsed = JSON.parse(response);
    return {
      enhanced: parsed.enhanced || request.currentContent || '',
      suggestions: parsed.suggestions || [],
      keywords: parsed.keywords || [],
      confidence: parsed.confidence || 0.8,
    };
  }

  /**
   * Build enhancement prompt
   */
  private buildEnhancementPrompt(request: AIEnhancementRequest): string {
    const { jobTitle, industry, experienceLevel, currentContent, enhancementType } = request;

    let instruction = '';
    switch (enhancementType) {
      case 'summary':
        instruction = 'Enhance this professional summary to be more ATS-friendly, include industry keywords, and make it more impactful.';
        break;
      case 'skills':
        instruction = 'Suggest additional relevant skills based on the job title and industry.';
        break;
      case 'experience':
        instruction = 'Enhance this experience description with action verbs, metrics, and ATS keywords.';
        break;
      case 'keywords':
        instruction = 'Extract and suggest ATS keywords relevant to this role and industry.';
        break;
      case 'optimize':
        instruction = 'Optimize this content for ATS systems while maintaining readability and professionalism.';
        break;
    }

    return `${instruction}

Context:
- Job Title: ${jobTitle || 'Not specified'}
- Industry: ${industry || 'Not specified'}
- Experience Level: ${experienceLevel || 'experienced'}

Current Content:
${currentContent || '(empty)'}

Return JSON format:
{
  "enhanced": "Enhanced version of the content",
  "suggestions": ["Suggestion 1", "Suggestion 2", ...],
  "keywords": ["Keyword 1", "Keyword 2", ...],
  "confidence": 0.85
}`;
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.openai !== null || this.gemini !== null;
  }
}

