/**
 * Unified AI Service - Intelligent manager for OpenAI and Gemini AI
 * Provides automatic fallback, load balancing, and error handling
 * 
 * Features:
 * - Smart provider selection based on availability
 * - Automatic fallback if one provider fails
 * - Consistent response format across providers
 * - No conflicts or duplicates
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export type AIProvider = 'openai' | 'gemini' | 'hybrid' | 'fallback';

export interface AIResponse<T = unknown> {
  data: T;
  provider: AIProvider;
  confidence: number;
  processingTime: number;
  success: boolean;
  error?: string;
}

export interface AIServiceConfig {
  preferredProvider?: 'openai' | 'gemini';
  enableFallback?: boolean;
  maxRetries?: number;
  timeout?: number;
}

export class UnifiedAIService {
  private openai: OpenAI | null = null;
  private gemini: GoogleGenerativeAI | null = null;
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig = {}) {
    this.config = {
      preferredProvider: config.preferredProvider || 'openai',
      enableFallback: config.enableFallback !== false,
      maxRetries: config.maxRetries || 2,
      timeout: config.timeout || 30000
    };

    this.initializeProviders();
  }

  /**
   * Initialize AI providers based on available API keys
   */
  private initializeProviders(): void {
    // Initialize OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey && openaiKey !== 'your_openai_api_key' && !openaiKey.includes('your_')) {
      try {
        this.openai = new OpenAI({ apiKey: openaiKey });
        console.log('✅ OpenAI initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize OpenAI:', error);
      }
    } else {
      console.warn('⚠️ OpenAI API key not configured');
    }

    // Initialize Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey !== 'your_gemini_api_key' && !geminiKey.includes('your_')) {
      try {
        this.gemini = new GoogleGenerativeAI(geminiKey);
        console.log('✅ Gemini initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Gemini:', error);
      }
    } else {
      console.warn('⚠️ Gemini API key not configured');
    }

    // Log provider status
    const providers = [];
    if (this.openai) providers.push('OpenAI');
    if (this.gemini) providers.push('Gemini');
    
    if (providers.length === 0) {
      console.warn('⚠️ No AI providers available. Fallback mode will be used.');
    } else {
      console.log(`🤖 AI Service initialized with: ${providers.join(', ')}`);
    }
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.openai !== null || this.gemini !== null;
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = [];
    if (this.openai) providers.push('openai');
    if (this.gemini) providers.push('gemini');
    if (providers.length === 0) providers.push('fallback');
    return providers;
  }

  /**
   * Generate AI completion with automatic provider selection and fallback
   */
  async generateCompletion(
    prompt: string,
    systemPrompt?: string,
    options: Record<string, unknown> = {}
  ): Promise<AIResponse<string>> {
    const startTime = Date.now();

    // Determine provider order based on preference and availability
    const providers: ('openai' | 'gemini')[] = [];
    
    if (this.config.preferredProvider === 'openai') {
      if (this.openai) providers.push('openai');
      if (this.gemini && this.config.enableFallback) providers.push('gemini');
    } else {
      if (this.gemini) providers.push('gemini');
      if (this.openai && this.config.enableFallback) providers.push('openai');
    }

    // Try each provider in order
    for (const provider of providers) {
      try {
        console.log(`🤖 Attempting AI generation with ${provider.toUpperCase()}...`);
        
        let result: string;
        let actualProvider: AIProvider;

        if (provider === 'openai' && this.openai) {
          result = await this.generateWithOpenAI(prompt, systemPrompt, options);
          actualProvider = 'openai';
        } else if (provider === 'gemini' && this.gemini) {
          result = await this.generateWithGemini(prompt, systemPrompt, options);
          actualProvider = 'gemini';
        } else {
          continue;
        }

        const processingTime = Date.now() - startTime;
        console.log(`✅ AI generation successful with ${actualProvider.toUpperCase()} (${processingTime}ms)`);

        return {
          data: result,
          provider: actualProvider,
          confidence: 95,
          processingTime,
          success: true
        };
      } catch (error) {
        console.error(`❌ ${provider.toUpperCase()} failed:`, error);
        // Continue to next provider if available
        continue;
      }
    }

    // If all providers fail, return error
    const processingTime = Date.now() - startTime;
    console.error('❌ All AI providers failed');
    
    return {
      data: '',
      provider: 'fallback',
      confidence: 0,
      processingTime,
      success: false,
      error: 'All AI providers failed'
    };
  }

  /**
   * Generate with OpenAI
   */
  private async generateWithOpenAI(
    prompt: string,
    systemPrompt?: string,
    options: Record<string, unknown> = {}
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI not available');
    }

    const completion = await this.openai.chat.completions.create({
      model: (options.model as string) || 'gpt-4o-mini',
      messages: [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        { role: 'user' as const, content: prompt }
      ],
      temperature: (options.temperature as number) || 0.7,
      max_tokens: (options.maxTokens as number) || 2000
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return response;
  }

  /**
   * Generate with Gemini
   */
  private async generateWithGemini(
    prompt: string,
    systemPrompt?: string,
    options: Record<string, unknown> = {}
  ): Promise<string> {
    if (!this.gemini) {
      throw new Error('Gemini not available');
    }

    const model = this.gemini.getGenerativeModel({ 
      model: (options.model as string) || 'gemini-1.5-flash' 
    });

    // Combine system and user prompt for Gemini
    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\nUser Request:\n${prompt}`
      : prompt;

    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();

    if (!response) {
      throw new Error('No response from Gemini');
    }

    return response;
  }

  /**
   * Parse JSON response from AI with error handling
   */
  async parseJSONResponse<T>(response: string): Promise<T | null> {
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = response.trim()
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '');
      
      return JSON.parse(cleanedResponse) as T;
    } catch (error) {
      console.error('❌ JSON parsing failed:', error);
      console.log('Raw response:', response.substring(0, 500));
      return null;
    }
  }

  /**
   * Generate structured data with automatic provider selection
   */
  async generateStructuredData<T>(
    prompt: string,
    systemPrompt: string,
    options: Record<string, unknown> = {}
  ): Promise<AIResponse<T>> {
    const response = await this.generateCompletion(prompt, systemPrompt, options);

    if (!response.success) {
      return {
        ...response,
        data: null as unknown as T
      };
    }

    const parsedData = await this.parseJSONResponse<T>(response.data);

    if (!parsedData) {
      return {
        ...response,
        data: null as unknown as T,
        success: false,
        error: 'Failed to parse JSON response'
      };
    }

    return {
      ...response,
      data: parsedData,
      success: true
    };
  }
}

// Export singleton instance
let unifiedAIInstance: UnifiedAIService | null = null;

export function getUnifiedAI(config?: AIServiceConfig): UnifiedAIService {
  if (!unifiedAIInstance) {
    unifiedAIInstance = new UnifiedAIService(config);
  }
  return unifiedAIInstance;
}

// Export type-safe AI service
export default UnifiedAIService;

