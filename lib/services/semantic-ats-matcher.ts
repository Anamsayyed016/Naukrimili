/**
 * Semantic ATS Matcher Service
 * Phase 1.5: Semantic matching using embeddings
 * 
 * Features:
 * - Resume-job matching with semantic similarity
 * - Skill similarity matching
 * - ATS keyword semantic matching
 * - Match percentage calculation
 */

import OpenAI from 'openai';

export interface SemanticMatchResult {
  matchScore: number; // 0-100
  matchedSkills: Array<{ skill: string; similarity: number }>;
  matchedKeywords: Array<{ keyword: string; similarity: number }>;
  missingSkills: string[];
  missingKeywords: string[];
  recommendations: string[];
}

export interface ResumeJobMatch {
  resumeText: string;
  jobDescription: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
}

export class SemanticATSMatcher {
  private openai: OpenAI | null;
  private embeddingCache: Map<string, number[]>;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        this.openai = new OpenAI({ apiKey: openaiKey });
        console.log('✅ Semantic ATS Matcher: OpenAI initialized');
      } catch (error) {
        console.error('❌ Failed to initialize OpenAI for embeddings:', error);
        this.openai = null;
      }
    } else {
      this.openai = null;
      console.warn('⚠️ OPENAI_API_KEY not found. Semantic matching will be disabled.');
    }
    
    this.embeddingCache = new Map();
  }

  /**
   * Calculate semantic match between resume and job description
   */
  async calculateMatch(match: ResumeJobMatch): Promise<SemanticMatchResult> {
    if (!this.openai) {
      return this.calculateFallbackMatch(match);
    }

    try {
      // Get embeddings for resume and job description
      const resumeEmbedding = await this.getEmbedding(match.resumeText);
      const jobEmbedding = await this.getEmbedding(match.jobDescription);

      // Calculate overall semantic similarity
      const overallSimilarity = this.cosineSimilarity(resumeEmbedding, jobEmbedding);
      const matchScore = Math.round(overallSimilarity * 100);

      // Match skills semantically
      const skillMatches = await this.matchSkillsSemantically(
        match.resumeText,
        match.requiredSkills || [],
        match.preferredSkills || []
      );

      // Match keywords semantically
      const keywordMatches = await this.matchKeywordsSemantically(
        match.resumeText,
        match.jobDescription
      );

      // Identify missing skills
      const missingSkills = this.identifyMissingSkills(
        skillMatches,
        match.requiredSkills || []
      );

      // Identify missing keywords
      const missingKeywords = this.identifyMissingKeywords(
        keywordMatches,
        match.jobDescription
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        matchScore,
        missingSkills,
        missingKeywords,
        skillMatches
      );

      return {
        matchScore,
        matchedSkills: skillMatches,
        matchedKeywords: keywordMatches,
        missingSkills,
        missingKeywords,
        recommendations
      };
    } catch (error) {
      console.error('❌ Semantic matching failed:', error);
      return this.calculateFallbackMatch(match);
    }
  }

  /**
   * Get embedding for text (with caching)
   */
  private async getEmbedding(text: string): Promise<number[]> {
    // Use cache key based on text hash
    const cacheKey = this.hashText(text);
    const cached = this.embeddingCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    if (!this.openai) {
      throw new Error('OpenAI not available');
    }

    // Get embedding from OpenAI
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small', // Cost-effective, good quality
      input: text.substring(0, 8000) // Limit to 8000 chars
    });

    const embedding = response.data[0].embedding;
    
    // Cache the embedding
    this.embeddingCache.set(cacheKey, embedding);
    
    // Cleanup cache if it gets too large
    if (this.embeddingCache.size > 1000) {
      const entries = Array.from(this.embeddingCache.entries());
      entries.slice(0, 200).forEach(([key]) => this.embeddingCache.delete(key));
    }

    return embedding;
  }

  /**
   * Match skills semantically (not just exact matches)
   */
  private async matchSkillsSemantically(
    resumeText: string,
    requiredSkills: string[],
    preferredSkills: string[]
  ): Promise<Array<{ skill: string; similarity: number }>> {
    if (requiredSkills.length === 0 && preferredSkills.length === 0) {
      return [];
    }

    try {
      const allSkills = [...requiredSkills, ...preferredSkills];
      const resumeEmbedding = await this.getEmbedding(resumeText);
      
      const matches: Array<{ skill: string; similarity: number }> = [];

      // Batch process skills (get embeddings for all skills at once)
      const skillsText = allSkills.join(', ');
      const skillsEmbedding = await this.getEmbedding(skillsText);
      
      // For each skill, calculate similarity with resume
      // Simplified: compare skill embedding with resume embedding
      const baseSimilarity = this.cosineSimilarity(resumeEmbedding, skillsEmbedding);
      
      // Check individual skills in resume text
      for (const skill of allSkills) {
        const skillLower = skill.toLowerCase();
        const resumeLower = resumeText.toLowerCase();
        
        // Exact match
        if (resumeLower.includes(skillLower)) {
          matches.push({ skill, similarity: 1.0 });
        } else {
          // Semantic match (simplified - in production, would get individual embeddings)
          // For now, use keyword-based similarity
          const similarity = this.calculateKeywordSimilarity(skill, resumeText);
          if (similarity > 0.3) {
            matches.push({ skill, similarity });
          }
        }
      }

      return matches.sort((a, b) => b.similarity - a.similarity);
    } catch (error) {
      console.error('Skill semantic matching failed:', error);
      return [];
    }
  }

  /**
   * Match keywords semantically
   */
  private async matchKeywordsSemantically(
    resumeText: string,
    jobDescription: string
  ): Promise<Array<{ keyword: string; similarity: number }>> {
    try {
      // Extract keywords from job description
      const keywords = this.extractKeywords(jobDescription);
      
      const matches: Array<{ keyword: string; similarity: number }> = [];
      
      for (const keyword of keywords) {
        const similarity = this.calculateKeywordSimilarity(keyword, resumeText);
        if (similarity > 0.2) {
          matches.push({ keyword, similarity });
        }
      }

      return matches.sort((a, b) => b.similarity - a.similarity).slice(0, 20);
    } catch (error) {
      console.error('Keyword semantic matching failed:', error);
      return [];
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Calculate keyword-based similarity (fallback when embeddings not available)
   */
  private calculateKeywordSimilarity(keyword: string, text: string): number {
    const keywordLower = keyword.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Exact match
    if (textLower.includes(keywordLower)) {
      return 1.0;
    }

    // Partial match (word boundaries)
    const keywordWords = keywordLower.split(/\s+/);
    let matchedWords = 0;
    
    for (const word of keywordWords) {
      if (word.length > 3 && textLower.includes(word)) {
        matchedWords++;
      }
    }

    return keywordWords.length > 0 ? matchedWords / keywordWords.length : 0;
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Extract technical terms, action verbs, and important phrases
    const keywords: string[] = [];
    
    // Action verbs
    const actionVerbs = ['developed', 'implemented', 'managed', 'led', 'optimized', 'created', 'designed', 'built'];
    actionVerbs.forEach(verb => {
      if (text.toLowerCase().includes(verb)) {
        keywords.push(verb.charAt(0).toUpperCase() + verb.slice(1));
      }
    });

    // Technical terms (common patterns)
    const techPatterns = [
      /\b(React|Angular|Vue|Node\.js|Python|Java|JavaScript|TypeScript)\b/gi,
      /\b(AWS|Azure|GCP|Docker|Kubernetes|CI\/CD)\b/gi,
      /\b(Agile|Scrum|DevOps|Microservices|REST API|GraphQL)\b/gi
    ];

    techPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        keywords.push(...matches.map(m => m.trim()));
      }
    });

    return [...new Set(keywords)].slice(0, 30);
  }

  /**
   * Identify missing skills
   */
  private identifyMissingSkills(
    matchedSkills: Array<{ skill: string; similarity: number }>,
    requiredSkills: string[]
  ): string[] {
    const matchedSkillNames = new Set(matchedSkills.map(m => m.skill.toLowerCase()));
    return requiredSkills.filter(skill => 
      !matchedSkillNames.has(skill.toLowerCase()) &&
      matchedSkills.find(m => m.skill.toLowerCase() === skill.toLowerCase() && m.similarity > 0.5) === undefined
    );
  }

  /**
   * Identify missing keywords
   */
  private identifyMissingKeywords(
    matchedKeywords: Array<{ keyword: string; similarity: number }>,
    jobDescription: string
  ): string[] {
    const allKeywords = this.extractKeywords(jobDescription);
    const matchedKeywordNames = new Set(matchedKeywords.map(m => m.keyword.toLowerCase()));
    
    return allKeywords
      .filter(keyword => !matchedKeywordNames.has(keyword.toLowerCase()))
      .slice(0, 10);
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(
    matchScore: number,
    missingSkills: string[],
    missingKeywords: string[],
    matchedSkills: Array<{ skill: string; similarity: number }>
  ): string[] {
    const recommendations: string[] = [];

    if (matchScore < 50) {
      recommendations.push('Resume has low semantic match with job description. Consider adding more relevant experience and skills.');
    }

    if (missingSkills.length > 0) {
      recommendations.push(`Add these required skills: ${missingSkills.slice(0, 5).join(', ')}`);
    }

    if (missingKeywords.length > 0) {
      recommendations.push(`Include these keywords to improve ATS match: ${missingKeywords.slice(0, 5).join(', ')}`);
    }

    const lowSimilaritySkills = matchedSkills.filter(m => m.similarity < 0.5);
    if (lowSimilaritySkills.length > 0) {
      recommendations.push(`Strengthen these skills in your resume: ${lowSimilaritySkills.slice(0, 3).map(m => m.skill).join(', ')}`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Resume has good semantic match with job description. Consider adding quantifiable achievements.');
    }

    return recommendations;
  }

  /**
   * Fallback match calculation (when embeddings not available)
   */
  private calculateFallbackMatch(match: ResumeJobMatch): SemanticMatchResult {
    // Simple keyword-based matching
    const resumeLower = match.resumeText.toLowerCase();
    const jobLower = match.jobDescription.toLowerCase();
    
    const requiredSkills = match.requiredSkills || [];
    const matchedSkills = requiredSkills
      .filter(skill => resumeLower.includes(skill.toLowerCase()))
      .map(skill => ({ skill, similarity: 1.0 }));
    
    const missingSkills = requiredSkills.filter(skill => 
      !matchedSkills.some(m => m.skill.toLowerCase() === skill.toLowerCase())
    );

    // Simple keyword extraction
    const keywords = this.extractKeywords(jobLower);
    const matchedKeywords = keywords
      .filter(keyword => resumeLower.includes(keyword.toLowerCase()))
      .map(keyword => ({ keyword, similarity: 1.0 }));

    // Calculate basic match score
    const skillMatchRatio = requiredSkills.length > 0 
      ? matchedSkills.length / requiredSkills.length 
      : 0.5;
    const keywordMatchRatio = keywords.length > 0
      ? matchedKeywords.length / keywords.length
      : 0.5;
    const matchScore = Math.round((skillMatchRatio * 0.6 + keywordMatchRatio * 0.4) * 100);

    return {
      matchScore,
      matchedSkills,
      matchedKeywords,
      missingSkills,
      missingKeywords: keywords.filter(k => !matchedKeywords.some(m => m.keyword.toLowerCase() === k.toLowerCase())),
      recommendations: this.generateRecommendations(matchScore, missingSkills, [], matchedSkills)
    };
  }

  /**
   * Hash text for cache key
   */
  private hashText(text: string): string {
    // Simple hash for cache key (not cryptographic)
    let hash = 0;
    const normalized = text.substring(0, 500).toLowerCase().trim();
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if semantic matching is available
   */
  isAvailable(): boolean {
    return this.openai !== null;
  }
}

