/**
 * Hybrid Form Suggestions Service - Combines OpenAI and Gemini for form suggestions
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface FormSuggestion {
  suggestions: string[];
  confidence: number;
  aiProvider: 'openai' | 'gemini' | 'fallback';
}

export class HybridFormSuggestions {
  private openai: OpenAI | null;
  private gemini: GoogleGenerativeAI | null;

  constructor() {
    // Initialize OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.warn('⚠️ OPENAI_API_KEY not found. OpenAI form suggestions will be disabled.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        apiKey: openaiKey,
      });
    }

    // Initialize Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found. Gemini form suggestions will be disabled.');
      this.gemini = null;
    } else {
      this.gemini = new GoogleGenerativeAI(geminiKey);
    }
  }

  /**
   * Generate form suggestions using hybrid AI approach
   */
  async generateSuggestions(field: string, value: string, context: any): Promise<FormSuggestion> {
    console.log(`🔮 Generating suggestions for field: ${field}`);

    // Check if any AI providers are available
    if (!this.openai && !this.gemini) {
      console.log(`⚠️ No AI providers available for ${field}, using enhanced fallback`);
      return this.getEnhancedFallbackSuggestions(field, value, context);
    }

    // Try multiple approaches in parallel
    const promises: Promise<FormSuggestion>[] = [];

    // Add OpenAI suggestions if available
    if (this.openai) {
      promises.push(this.generateWithOpenAI(field, value, context));
    }

    // Add Gemini suggestions if available
    if (this.gemini) {
      promises.push(this.generateWithGemini(field, value, context));
    }

    try {
      // Use Promise.allSettled to get results from all providers
      const results = await Promise.allSettled(promises);
      
      const successfulResults: FormSuggestion[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulResults.push(result.value);
          console.log(`✅ AI provider ${index + 1} completed successfully for ${field}`);
        } else {
          console.error(`❌ AI provider ${index + 1} failed for ${field}:`, result.reason);
        }
      });

      if (successfulResults.length === 0) {
        console.log(`⚠️ All AI providers failed for ${field}, using enhanced fallback`);
        return this.getEnhancedFallbackSuggestions(field, value, context);
      }

      // If we have multiple successful results, combine them
      if (successfulResults.length > 1) {
        return this.combineSuggestions(successfulResults);
      }

      // Return the single successful result
      return successfulResults[0];

    } catch (error) {
      console.error(`❌ Hybrid suggestions failed for ${field}:`, error);
      return this.getEnhancedFallbackSuggestions(field, value, context);
    }
  }

  /**
   * Generate suggestions using OpenAI
   */
  private async generateWithOpenAI(field: string, value: string, context: any): Promise<FormSuggestion> {
    if (!this.openai) {
      throw new Error('OpenAI not available');
    }

    const prompt = this.getPromptForField(field, value, context);

    const completion = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI career assistant helping users complete their resume forms. Provide relevant, professional suggestions based on the field type and user input. Return only a JSON array of suggestions.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    try {
      const suggestions = JSON.parse(response);
      return {
        suggestions: Array.isArray(suggestions) ? suggestions : [suggestions],
        confidence: 85,
        aiProvider: 'openai'
      };
    } catch (parseError) {
      throw new Error('Failed to parse OpenAI response');
    }
  }

  /**
   * Generate suggestions using Gemini
   */
  private async generateWithGemini(field: string, value: string, context: any): Promise<FormSuggestion> {
    if (!this.gemini) {
      throw new Error('Gemini not available');
    }

    const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = this.getPromptForField(field, value, context);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    if (!responseText) {
      throw new Error('No response from Gemini');
    }

    try {
      const suggestions = JSON.parse(responseText);
      return {
        suggestions: Array.isArray(suggestions) ? suggestions : [suggestions],
        confidence: 80,
        aiProvider: 'gemini'
      };
    } catch (parseError) {
      throw new Error('Failed to parse Gemini response');
    }
  }

  /**
   * Combine suggestions from multiple AI providers
   */
  private combineSuggestions(results: FormSuggestion[]): FormSuggestion {
    const allSuggestions = new Set<string>();
    let totalConfidence = 0;

    results.forEach(result => {
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
   * Get prompt for specific field
   */
  private getPromptForField(field: string, value: string, context: any): string {
    const baseContext = {
      skills: context.skills || [],
      experience: context.experience || [],
      education: context.education || []
    };

    switch (field) {
      case 'skills':
        return `Based on the current skills: ${value}, and existing skills: ${baseContext.skills.join(', ')}, suggest 5-8 additional relevant technical skills for a software developer. Return as JSON array.`;
      
      case 'jobTitle':
        return `Based on the current job title: ${value}, and skills: ${baseContext.skills.join(', ')}, suggest 5 alternative job titles. Return as JSON array.`;
      
      case 'location':
        return `Based on the location: ${value}, suggest 5 similar cities or regions for job opportunities. Return as JSON array.`;
      
      case 'summary':
        return `Based on the current summary: ${value}, and skills: ${baseContext.skills.join(', ')}, suggest 3 improved professional summary statements. Return as JSON array.`;
      
      case 'expectedSalary':
        return `Based on the current salary expectation: ${value}, and job title: ${context.jobTitle || 'Software Developer'}, suggest 3 salary ranges. Return as JSON array.`;
      
      default:
        return `Based on the field "${field}" with value "${value}", suggest 5 relevant options. Return as JSON array.`;
    }
  }

  /**
   * Get enhanced fallback suggestions when AI is not available
   */
  private getEnhancedFallbackSuggestions(field: string, value: string, context: any): FormSuggestion {
    const baseContext = {
      skills: context.skills || [],
      experience: context.experience || [],
      education: context.education || []
    };

    const fallbackSuggestions: { [key: string]: string[] } = {
      skills: [
        'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript',
        'AWS', 'Docker', 'Git', 'SQL', 'MongoDB', 'Express.js',
        'Next.js', 'Vue.js', 'Angular', 'Java', 'C++', 'PHP',
        'Laravel', 'Django', 'Flask', 'Spring Boot', 'PostgreSQL',
        'Redis', 'GraphQL', 'REST API', 'Microservices', 'Kubernetes',
        'TensorFlow', 'PyTorch', 'Machine Learning', 'Data Science',
        'DevOps', 'CI/CD', 'Jenkins', 'GitLab', 'GitHub Actions'
      ],
      jobTitle: [
        'Software Engineer', 'Full Stack Developer', 'Frontend Developer',
        'Backend Developer', 'DevOps Engineer', 'Data Scientist',
        'Machine Learning Engineer', 'Product Manager', 'UI/UX Designer',
        'Mobile App Developer', 'Cloud Engineer', 'Security Engineer',
        'Solutions Architect', 'Technical Lead', 'Engineering Manager'
      ],
      location: [
        'Bangalore, India', 'Mumbai, India', 'Delhi, India',
        'Hyderabad, India', 'Pune, India', 'Chennai, India',
        'Kolkata, India', 'Ahmedabad, India', 'Gurgaon, India',
        'Noida, India', 'Remote', 'Hybrid', 'San Francisco, CA',
        'New York, NY', 'London, UK', 'Singapore', 'Dubai, UAE'
      ],
      summary: [
        'Experienced software developer with strong technical skills and passion for creating innovative solutions.',
        'Results-driven professional with expertise in modern technologies and proven track record of delivering high-quality projects.',
        'Passionate developer with excellent problem-solving abilities and strong communication skills.',
        'Detail-oriented software engineer with experience in full-stack development and agile methodologies.',
        'Creative and analytical developer with strong foundation in computer science and continuous learning mindset.',
        'Skilled professional with expertise in scalable web applications and cloud technologies.',
        'Innovative developer with strong background in AI/ML and data-driven solutions.'
      ],
      expectedSalary: [
        '5-8 LPA', '8-12 LPA', '12-18 LPA', '18-25 LPA', 
        '25-35 LPA', '35-50 LPA', '50+ LPA', 'Negotiable',
        'As per industry standards', 'Based on experience'
      ],
      preferredJobType: [
        'Full-time', 'Part-time', 'Contract', 'Freelance', 
        'Internship', 'Remote', 'Hybrid', 'On-site'
      ],
      linkedin: [
        'https://linkedin.com/in/yourname',
        'https://linkedin.com/in/yourusername',
        'https://www.linkedin.com/in/yourprofile'
      ],
      portfolio: [
        'https://yourname.dev',
        'https://yourname.github.io',
        'https://yourname.vercel.app',
        'https://yourname.netlify.app'
      ]
    };

    // Filter suggestions based on current value and context
    let suggestions = fallbackSuggestions[field] || ['Option 1', 'Option 2', 'Option 3'];
    
    // For skills, add context-aware suggestions
    if (field === 'skills' && baseContext.skills.length > 0) {
      const relatedSkills = this.getRelatedSkills(baseContext.skills);
      suggestions = [...new Set([...suggestions, ...relatedSkills])].slice(0, 15);
    }

    // For job titles, add context-aware suggestions
    if (field === 'jobTitle' && baseContext.skills.length > 0) {
      const skillBasedTitles = this.getSkillBasedJobTitles(baseContext.skills);
      suggestions = [...new Set([...suggestions, ...skillBasedTitles])].slice(0, 12);
    }

    return {
      suggestions: suggestions,
      confidence: 40,
      aiProvider: 'fallback'
    };
  }

  /**
   * Get related skills based on existing skills
   */
  private getRelatedSkills(existingSkills: string[]): string[] {
    const skillMap: { [key: string]: string[] } = {
      'JavaScript': ['TypeScript', 'Node.js', 'React', 'Vue.js', 'Angular', 'Express.js'],
      'Python': ['Django', 'Flask', 'FastAPI', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch'],
      'React': ['Next.js', 'Redux', 'Context API', 'Hooks', 'JSX', 'Styled Components'],
      'Node.js': ['Express.js', 'Socket.io', 'MongoDB', 'PostgreSQL', 'Redis'],
      'AWS': ['Docker', 'Kubernetes', 'Terraform', 'CloudFormation', 'Lambda'],
      'Java': ['Spring Boot', 'Spring MVC', 'Hibernate', 'Maven', 'Gradle'],
      'SQL': ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch']
    };

    const relatedSkills: string[] = [];
    existingSkills.forEach(skill => {
      const related = skillMap[skill] || [];
      relatedSkills.push(...related);
    });

    return [...new Set(relatedSkills)];
  }

  /**
   * Get job titles based on skills
   */
  private getSkillBasedJobTitles(skills: string[]): string[] {
    const skillToTitleMap: { [key: string]: string[] } = {
      'React': ['Frontend Developer', 'React Developer', 'UI Developer'],
      'Node.js': ['Backend Developer', 'Node.js Developer', 'API Developer'],
      'Python': ['Python Developer', 'Data Scientist', 'ML Engineer'],
      'AWS': ['Cloud Engineer', 'DevOps Engineer', 'Solutions Architect'],
      'Java': ['Java Developer', 'Backend Developer', 'Enterprise Developer'],
      'Docker': ['DevOps Engineer', 'Platform Engineer', 'Infrastructure Engineer']
    };

    const titles: string[] = [];
    skills.forEach(skill => {
      const relatedTitles = skillToTitleMap[skill] || [];
      titles.push(...relatedTitles);
    });

    return [...new Set(titles)];
  }

  /**
   * Get fallback suggestions when AI is not available (legacy method)
   */
  private getFallbackSuggestions(field: string, value: string): FormSuggestion {
    return this.getEnhancedFallbackSuggestions(field, value, {});
  }
}
