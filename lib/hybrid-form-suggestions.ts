/**
 * Hybrid Form Suggestions Service - Combines OpenAI and Gemini for form suggestions
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface FormSuggestion {
  suggestions: string[];
  confidence: number;
  aiProvider: 'openai' | 'gemini' | 'fallback' | 'hybrid';
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

    // Use GPT-4o-mini for better quality and speed (upgraded from GPT-3.5-turbo)
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    
    const completion = await this.openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: `You are an AI career assistant helping users complete their resume forms. Provide relevant, professional suggestions based on the field type and user input. 
          
IMPORTANT RULES:
- For summary fields: Generate comprehensive 3-4 sentence summaries (80-120 words each)
- For project fields: Generate realistic project names relevant to the user's role and skills
- Always return ONLY a valid JSON array of strings, no markdown, no explanations, no code blocks
- Make suggestions dynamic and build upon user's current input
- Ensure suggestions are professional, relevant, and ready to use
- Be precise and context-aware - use the provided context (job title, skills, experience level) to generate highly relevant suggestions`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: field === 'summary' ? 1000 : 500, // Increased tokens for better quality
      temperature: 0.4, // Lower temperature for more relevant, focused suggestions (reduced from 0.8)
    });

    let response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Clean up response - remove markdown code blocks if present
    response = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      // Try to extract JSON array from response
      let suggestions: string[] = [];
      
      // First, try direct JSON parse
      try {
        const parsed = JSON.parse(response);
        suggestions = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // If direct parse fails, try to extract array from text
        const arrayMatch = response.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          suggestions = JSON.parse(arrayMatch[0]);
        } else {
          // Last resort: split by newlines and clean
          suggestions = response
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('//'))
            .map(line => line.replace(/^[-*]\s*/, '').replace(/^["']|["']$/g, ''))
            .filter(line => line.length > 5);
        }
      }
      
      // Ensure we have valid suggestions
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error('No valid suggestions extracted');
      }
      
      return {
        suggestions: suggestions,
        confidence: 85,
        aiProvider: 'openai'
      };
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
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

    // Use Gemini 1.5 Pro for better quality (upgraded from Flash)
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
    
    const model = this.gemini.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.4, // Lower temperature for more relevant suggestions (reduced from 0.8)
        maxOutputTokens: field === 'summary' ? 1200 : 600, // Increased tokens for better quality
        topP: 0.8, // Reduced from 0.9 for more focused results
        topK: 30, // Reduced from 40 for better relevance
      }
    });
    const prompt = this.getPromptForField(field, value, context);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();
    
    // Clean up response - remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    if (!responseText) {
      throw new Error('No response from Gemini');
    }

    try {
      // Try to extract JSON array from response
      let suggestions: string[] = [];
      
      // First, try direct JSON parse
      try {
        const parsed = JSON.parse(responseText);
        suggestions = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // If direct parse fails, try to extract array from text
        const arrayMatch = responseText.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          suggestions = JSON.parse(arrayMatch[0]);
        } else {
          // Last resort: split by newlines and clean
          suggestions = responseText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('//'))
            .map(line => line.replace(/^[-*]\s*/, '').replace(/^["']|["']$/g, ''))
            .filter(line => line.length > 5);
        }
      }
      
      // Ensure we have valid suggestions
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error('No valid suggestions extracted');
      }
      
      return {
        suggestions: suggestions,
        confidence: 85,
        aiProvider: 'gemini'
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
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
      jobType: context.jobType || 'Full-time',
      experienceLevel: context.experienceLevel || 'Mid-level',
      industry: context.industry || 'Technology',
      skills: context.skills || [],
      companyName: context.companyName || '',
      companyDescription: context.companyDescription || '',
      userInput: context.userInput || value || '',
      jobTitle: context.jobTitle || '', // Add jobTitle for context-aware prompts
      isProjectDescription: context.isProjectDescription || false, // Add project description flag
    };

    // Use userInput if available, otherwise use value
    const userContent = baseContext.userInput || value;
    const hasUserContent = userContent && userContent.trim().length > 0;

    switch (field) {
      case 'title':
        if (hasUserContent) {
          return `The user is typing a job title: "${userContent}". Analyze their input and suggest 5-8 alternative job titles that:
- Are relevant to what they're typing
- Match the industry: ${baseContext.industry}
- Fit the job type: ${baseContext.jobType}
- Are professional and commonly used
- Build upon or enhance their current input
Return ONLY a JSON array of strings, no other text.`;
        }
        return `Suggest 5-8 professional job titles for ${baseContext.industry} industry, ${baseContext.jobType} position, ${baseContext.experienceLevel} level. Return as JSON array.`;
      
      case 'description':
        // Check if this is a project description context (from projects section)
        const isProjectContext = context?.isProjectDescription || false;
        
        if (isProjectContext) {
          if (hasUserContent) {
            return `The user is writing a project description: "${userContent}". Suggest 3-5 improved project descriptions that:
- Describe what the project does and its key features
- Mention technologies used (if applicable)
- Highlight the project's purpose and impact
- Are concise but informative (1-2 sentences each)
- Are suitable for a resume portfolio
Return ONLY a JSON array of strings, no other text.`;
          }
          return `Suggest 3-5 professional project descriptions for a ${context.jobTitle || 'software developer'}. Each should be 1-2 sentences describing a project's purpose and features. Return as JSON array.`;
        }
        
        // Regular job/work description
        if (hasUserContent) {
          return `The user has written: "${userContent}". This is a work experience or job description they're creating. Analyze their content and suggest 3-5 improved, complete descriptions that:
- Enhance and expand on what they've written
- Use action verbs and quantify achievements
- Are professional and achievement-focused
- Include specific responsibilities and outcomes
- Match the role: ${context.jobTitle || 'professional'}, experience: ${baseContext.experienceLevel}
Return ONLY a JSON array of strings, no other text.`;
        }
        return `Suggest 3-5 professional work experience descriptions for a ${context.jobTitle || 'professional'}. Return as JSON array.`;
      
      case 'bullet':
        // For bullet points and one-line descriptions - shorter, concise suggestions
        if (context?.isProjectDescription) {
          return `${hasUserContent ? `The user is typing a one-line project description: "${userContent}". ` : ''}Based on the project context (job title: ${baseContext.jobTitle || 'software developer'}, skills: ${baseContext.skills?.slice(0, 3).join(', ') || 'various technologies'}), suggest 5-8 concise, one-line project descriptions that:
- Are brief and to the point (one sentence, 10-20 words)
- Highlight the project type and key technology
- Match the user's current input if provided
- Are professional and clear
- Examples: "E-commerce platform built with React and Node.js", "Real-time chat application using WebSockets and MongoDB", "Task management tool with drag-and-drop functionality"
Return ONLY a JSON array of one-line description strings, no markdown or code blocks.`;
        }
        // Regular bullet point for work experience
        return `${hasUserContent ? `The user is typing a bullet point: "${userContent}". ` : ''}Based on the job title "${baseContext.jobTitle || 'professional'}" and experience level "${baseContext.experienceLevel || 'mid-level'}", suggest 5-8 concise, action-oriented bullet points that:
- Start with strong action verbs (Developed, Implemented, Led, Optimized, etc.)
- Are one sentence long (10-20 words)
- Include quantifiable achievements when possible
- Are relevant to the role
- Build upon the user's current input
- Examples: "Developed RESTful APIs serving 10K+ daily requests", "Implemented responsive UI components improving user engagement by 30%", "Led a team of 5 developers in agile sprint planning"
Return ONLY a JSON array of bullet point strings, no markdown or code blocks.`;
      
      case 'requirements':
        if (hasUserContent) {
          return `The user has written requirements: "${userContent}". Analyze their input and suggest 5-8 enhanced job requirements that:
- Build upon what they've typed
- Are specific, measurable, and realistic
- Match the job type: ${baseContext.jobType}, experience: ${baseContext.experienceLevel}
- Include both technical and soft skills
- Are relevant to the industry: ${baseContext.industry}
Return ONLY a JSON array of strings, no other text.`;
        }
        return `Suggest 5-8 job requirements for ${baseContext.industry} industry, ${baseContext.jobType} position. Return as JSON array.`;
      
      case 'benefits':
        if (hasUserContent) {
          return `The user has mentioned: "${userContent}". Suggest 5-8 attractive benefits and perks that:
- Complement what they've written
- Are relevant to ${baseContext.industry} industry
- Appeal to ${baseContext.experienceLevel} candidates
- Include both standard and unique benefits
Return ONLY a JSON array of strings, no other text.`;
        }
        return `Suggest 5-8 benefits for ${baseContext.industry} industry. Return as JSON array.`;
      
      case 'skills':
        const existingSkills = baseContext.skills?.join(', ') || '';
        if (hasUserContent || existingSkills) {
          return `Based on: ${userContent || existingSkills}, and existing skills: ${existingSkills}, suggest 5-8 additional relevant skills for this role. Consider the industry: ${baseContext.industry}, job type: ${baseContext.jobType}. Return ONLY a JSON array of strings, no other text.`;
        }
        return `Suggest 5-8 relevant technical skills for ${baseContext.industry} industry. Return as JSON array.`;
      
      case 'bio':
        return `Based on the current bio: "${value}", and skills: ${context.skills?.join(', ') || 'various skills'}, and location: ${context.location || 'various locations'}, suggest 3-5 professional bio statements that highlight strengths, experience, and career goals. Make them concise (2-3 sentences each) and compelling. Return only a JSON array of strings, nothing else.`;
      
      case 'experience':
        return `Based on the current experience description: "${value}", and skills: ${context.skills?.join(', ') || 'various skills'}, suggest 3-5 professional work experience descriptions. Include years of experience, key achievements, and areas of expertise. Make them professional and specific. Return only a JSON array of strings, nothing else.`;
      
      case 'education':
        return `Based on the current education: "${value}", suggest 3-5 ways to describe educational background professionally. Include degree types, fields of study, and certifications. Return only a JSON array of strings, nothing else.`;
      
      case 'jobTitle':
        return `Based on the current job title: ${value}, and skills: ${baseContext.skills?.join(', ') || ''}, suggest 5 alternative job titles. Return as JSON array.`;
      
      case 'location':
        return `Based on the location: ${value}, suggest 5 similar cities or regions for job opportunities. Return as JSON array.`;
      
      case 'summary':
        const jobTitleContext = context.jobTitle ? `The user is a ${context.jobTitle}. ` : '';
        const experienceContext = baseContext.experienceLevel ? `Experience level: ${baseContext.experienceLevel}. ` : '';
        const skillsContext = baseContext.skills?.length > 0 ? `Key skills: ${baseContext.skills.slice(0, 5).join(', ')}. ` : '';
        const userInputContext = value && value.length > 10 ? `The user has started writing: "${value.substring(0, 200)}". ` : '';
        
        return `${jobTitleContext}${experienceContext}${skillsContext}${userInputContext}Generate 3-5 comprehensive professional summary statements (each should be 3-4 sentences, 80-120 words) that:
- Build upon and enhance what the user has written (if any)
- Highlight their experience level, key skills, and professional achievements
- Are specific, compelling, and tailored to their role as ${context.jobTitle || 'a professional'}
- Use professional language and action verbs
- Include quantifiable achievements if applicable
- Show progression and career goals
- Are ready to use in a professional resume

Each summary should be a complete, polished paragraph that tells a compelling professional story. Return ONLY a JSON array of strings, no other text or explanation.`;
      
      case 'project':
        const projectSkills = baseContext.skills?.slice(0, 5).join(', ') || 'various technologies';
        const projectUserInput = value && value.length > 0 ? `The user is typing: "${value}". ` : '';
        const projectJobTitle = context.jobTitle || 'software developer';
        
        return `${projectUserInput}Based on the job title "${projectJobTitle}", skills: ${projectSkills}, and experience level: ${baseContext.experienceLevel || 'mid-level'}, suggest 5-8 highly relevant project names that:
- Match the user's current input (if provided)
- Are appropriate for a ${projectJobTitle} at ${baseContext.experienceLevel || 'mid'} level
- Use technologies from: ${projectSkills}
- Are realistic, professional project names
- Include both web applications, mobile apps, and system projects
- Are commonly found in portfolios for this role
- Examples: "E-Commerce Platform", "Task Management App", "Real-time Chat Application", "Data Analytics Dashboard"

Return ONLY a JSON array of project name strings, no descriptions or explanations.`;
      
      case 'certification':
        return `Based on the current certification: "${value}", suggest 3-5 relevant professional certifications for a ${context.jobTitle || 'professional'}. Include industry-standard certifications. Return as JSON array.`;
      
      case 'language':
        return `Based on the current language: "${value}", suggest 3-5 commonly spoken languages for professional resumes. Return as JSON array.`;
      
      case 'achievement':
        return `Based on the current achievement: "${value}", suggest 3-5 professional achievement titles or descriptions for a ${context.jobTitle || 'professional'}. Return as JSON array.`;
      
      case 'internship':
        return `Based on the current internship description: "${value}", suggest 3-5 improved internship descriptions for a ${context.jobTitle || 'professional'}. Focus on learning outcomes and responsibilities. Return as JSON array.`;
      
      case 'company':
        if (hasUserContent) {
          return `The user is typing a company name: "${userContent}". Suggest 5-8 real, well-known company names that:
- Match or are similar to what they're typing
- Are actual companies (not generic patterns)
- Include both tech companies and other industries
- Are professional and recognizable
- Examples: Google, Microsoft, Amazon, TCS, Infosys, Accenture, etc.
Return ONLY a JSON array of company name strings, no other text.`;
        }
        return `Suggest 8-10 well-known company names across different industries (tech, consulting, finance, etc.). Return as JSON array.`;
      
      case 'position':
        if (hasUserContent) {
          return `The user is typing a job position: "${userContent}". Based on their job title "${context.jobTitle || 'professional'}", suggest 5-8 relevant job positions/titles that:
- Match what they're typing
- Are appropriate for their role: ${context.jobTitle || 'professional'}
- Include various seniority levels
- Are realistic job titles
- Examples: Software Engineer, Senior Developer, Team Lead, etc.
Return ONLY a JSON array of position strings, no other text.`;
        }
        return `Suggest 8-10 professional job positions/titles for a ${context.jobTitle || 'professional'}. Return as JSON array.`;
      
      case 'expectedSalary':
        return `Based on the current salary expectation: ${value}, and job title: ${context.jobTitle || 'Software Developer'}, suggest 3 salary ranges. Return as JSON array.`;
      
      default:
        return `Based on the field "${field}" with value "${value}", suggest 5 relevant professional options. Return only a JSON array of strings, nothing else.`;
    }
  }

  /**
   * Get enhanced fallback suggestions when AI is not available
   */
  private getEnhancedFallbackSuggestions(field: string, value: string, context: any): FormSuggestion {
    const baseContext = {
      jobType: context.jobType || 'Full-time',
      experienceLevel: context.experienceLevel || 'Mid-level',
      industry: context.industry || 'Technology',
      skills: context.skills || [],
      jobTitle: context.jobTitle || value || '',
      companyName: context.companyName || '',
      companyDescription: context.companyDescription || '',
      userInput: value || '',
      isProjectDescription: context.isProjectDescription || false, // Add project description flag
    };

    const userInput = (value || '').toLowerCase().trim();

    const fallbackSuggestions: { [key: string]: string[] } = {
      // DYNAMIC Job Title Suggestions based on keywords
      title: this.getDynamicTitleSuggestions(userInput, baseContext),
      description: this.getDynamicDescriptionSuggestions(userInput, baseContext),
      requirements: this.getDynamicRequirementsSuggestions(userInput, baseContext),
      // JOBSEEKER PROFILE FIELDS - Bio suggestions
      bio: [
        'Experienced professional with strong technical skills and passion for delivering exceptional results in dynamic environments.',
        'Results-driven expert with proven track record of success, excellent problem-solving abilities, and strong communication skills.',
        'Passionate about innovation and continuous learning, with expertise in modern technologies and collaborative team environments.',
        'Detail-oriented professional with strong analytical mindset, commitment to quality, and ability to thrive in fast-paced settings.',
        'Motivated individual with diverse skill set, adaptable nature, and dedication to achieving organizational goals.'
      ],
      // JOBSEEKER PROFILE FIELDS - Experience suggestions
      experience: [
        '0-1 years of hands-on experience with strong foundational knowledge and eagerness to learn and grow professionally.',
        '2-4 years of progressive professional experience delivering successful projects and driving measurable results.',
        '5-7 years of comprehensive experience with demonstrated expertise, leadership capabilities, and strategic thinking.',
        '8-10 years of senior-level experience leading teams, managing complex initiatives, and driving organizational success.',
        '10+ years of extensive experience across diverse domains with proven ability to mentor teams and shape strategic direction.'
      ],
      // JOBSEEKER PROFILE FIELDS - Education suggestions
      education: [
        'Bachelor of Technology (B.Tech) in Computer Science from recognized university with strong academic background.',
        'Master of Computer Applications (MCA) with specialization in software development and data structures.',
        'Bachelor of Engineering (B.E.) in Information Technology with coursework in web development and databases.',
        'Bachelor of Science (B.Sc) in Computer Science with additional certifications in modern technologies.',
        'Diploma in Software Engineering with practical project experience and industry-recognized certifications.'
      ],
      benefits: [
        'Competitive salary and performance bonuses',
        'Comprehensive health insurance coverage',
        'Flexible working hours and remote work options',
        'Professional development and training opportunities',
        'Stock options and equity participation',
        'Generous paid time off and vacation days',
        'Modern office environment with latest technology',
        'Team building activities and company events',
        'Mentorship programs and career growth opportunities',
        'Wellness programs and gym membership'
      ],
      // Dynamic skills based on job context
      skills: this.getDynamicSkillsSuggestions(userInput, baseContext),
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
      company: (() => {
        const userInput = (value || '').toLowerCase();
        const commonCompanies = [
          'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix', 'Adobe', 'Oracle',
          'IBM', 'Accenture', 'TCS', 'Infosys', 'Wipro', 'Cognizant', 'Tech Mahindra',
          'HCL Technologies', 'Capgemini', 'Deloitte', 'PwC', 'EY', 'KPMG', 'JP Morgan',
          'Goldman Sachs', 'Morgan Stanley', 'Salesforce', 'SAP', 'VMware', 'Intel', 'NVIDIA',
          'TCS', 'Infosys', 'Wipro', 'HCL', 'Tech Mahindra', 'Mindtree', 'L&T Infotech',
          'Mphasis', 'Zensar', 'Persistent Systems', 'Cybage', 'Hexaware', 'Genpact'
        ];
        
        if (userInput && userInput.length > 2) {
          return commonCompanies
            .filter(company => company.toLowerCase().includes(userInput))
            .slice(0, 8);
        }
        return commonCompanies.slice(0, 10);
      })(),
      position: (() => {
        const userInput = (value || '').toLowerCase();
        const jobTitle = (baseContext.jobTitle || '').toLowerCase();
        
        // Software/Tech positions
        if (jobTitle.includes('developer') || jobTitle.includes('engineer') || jobTitle.includes('software') || 
            userInput.includes('developer') || userInput.includes('engineer') || userInput.includes('python') || userInput.includes('java')) {
          const techPositions = [
            'Software Engineer', 'Full Stack Developer', 'Senior Software Developer',
            'Frontend Developer', 'Backend Engineer', 'DevOps Engineer',
            'Python Developer', 'Java Developer', 'React Developer', 'Node.js Developer',
            'Software Architect', 'Technical Lead', 'Engineering Manager'
          ];
          if (userInput && userInput.length > 2) {
            return techPositions
              .filter(pos => pos.toLowerCase().includes(userInput))
              .slice(0, 8);
          }
          return techPositions.slice(0, 8);
        }
        
        // Generic positions
        const commonPositions = [
          'Software Engineer', 'Product Manager', 'Data Scientist', 'Business Analyst',
          'Project Manager', 'Marketing Manager', 'Sales Executive', 'HR Manager',
          'Financial Analyst', 'Operations Manager', 'Quality Assurance Engineer',
          'UI/UX Designer', 'System Administrator', 'Network Engineer', 'Database Administrator'
        ];
        if (userInput && userInput.length > 2) {
          return commonPositions
            .filter(pos => pos.toLowerCase().includes(userInput))
            .slice(0, 8);
        }
        return commonPositions.slice(0, 8);
      })(),
      project: (() => {
        const jobTitle = (baseContext.jobTitle || '').toLowerCase();
        const userInput = (value || '').toLowerCase();
        const skills = baseContext.skills || [];
        
        // Software/Tech projects
        if (jobTitle.includes('developer') || jobTitle.includes('engineer') || jobTitle.includes('software') || 
            userInput.includes('app') || userInput.includes('platform') || userInput.includes('system')) {
          const techProjects = [
            'E-Commerce Platform', 'Task Management Application', 'Social Media Dashboard',
            'Real-time Chat Application', 'Weather Forecast App', 'Blog Platform',
            'Project Management Tool', 'Expense Tracker App', 'Recipe Sharing Platform',
            'Online Learning Management System', 'Hospital Management System', 'Inventory Management System',
            'Restaurant Booking System', 'Fitness Tracking App', 'Music Streaming Platform',
            'Job Portal Application', 'E-Learning Platform', 'Healthcare Management System'
          ];
          
          // Filter based on user input if provided
          if (userInput && userInput.length > 2) {
            return techProjects
              .filter(p => p.toLowerCase().includes(userInput) || userInput.includes(p.toLowerCase().split(' ')[0]))
              .slice(0, 8);
          }
          return techProjects.slice(0, 8);
        }
        
        // Data Science/Analytics projects
        if (jobTitle.includes('data') || jobTitle.includes('analyst') || skills.some(s => s.toLowerCase().includes('python') || s.toLowerCase().includes('data'))) {
          return [
            'Data Analytics Dashboard', 'Sales Forecasting Model', 'Customer Segmentation Analysis',
            'Stock Market Prediction System', 'Sentiment Analysis Tool', 'Recommendation Engine',
            'Fraud Detection System', 'Churn Prediction Model'
          ];
        }
        
        // Generic professional projects
        return [
          'Portfolio Website', 'Business Management System', 'Data Analysis Tool',
          'Content Management System', 'Customer Relationship Management', 'Employee Management System',
          'Document Management System', 'Event Management Platform'
        ];
      })(),
      summary: (() => {
        const jobTitle = (baseContext.jobTitle || '').toLowerCase();
        const userInput = (value || '').toLowerCase();
        
        // Teaching/Education
        if (jobTitle.includes('teacher') || jobTitle.includes('educator') || jobTitle.includes('tutor') || userInput.includes('teacher')) {
          return [
            'Dedicated and passionate educator with strong commitment to student success and innovative teaching methodologies.',
            'Experienced teacher with proven ability to create engaging learning environments and foster academic excellence.',
            'Results-oriented educator with expertise in curriculum development and student-centered instructional approaches.',
            'Compassionate teacher with excellent communication skills and ability to adapt teaching methods to diverse learning styles.',
            'Motivated educator with strong classroom management skills and passion for inspiring lifelong learning.'
          ];
        }
        
        // Software/Tech
        if (jobTitle.includes('developer') || jobTitle.includes('engineer') || jobTitle.includes('programmer') || jobTitle.includes('software')) {
          return [
            'Experienced software developer with strong technical skills and passion for creating innovative solutions.',
            'Results-driven professional with expertise in modern technologies and proven track record of delivering high-quality projects.',
            'Passionate developer with excellent problem-solving abilities and strong communication skills.',
            'Detail-oriented software engineer with experience in full-stack development and agile methodologies.',
            'Creative and analytical developer with strong foundation in computer science and continuous learning mindset.'
          ];
        }
        
        // Generic professional summaries based on job title
        if (baseContext.jobTitle) {
          return [
            `Experienced ${baseContext.jobTitle} with strong skills and passion for delivering exceptional results.`,
            `Results-driven ${baseContext.jobTitle} with proven track record of success and commitment to excellence.`,
            `Dedicated ${baseContext.jobTitle} with expertise in relevant field and ability to drive positive outcomes.`,
            `Motivated ${baseContext.jobTitle} with excellent communication skills and commitment to continuous improvement.`,
            `Passionate ${baseContext.jobTitle} with strong work ethic and ability to collaborate effectively in team environments.`
          ];
        }
        
        // Default software developer suggestions
        return [
          'Experienced software developer with strong technical skills and passion for creating innovative solutions.',
          'Results-driven professional with expertise in modern technologies and proven track record of delivering high-quality projects.',
          'Passionate developer with excellent problem-solving abilities and strong communication skills.',
          'Detail-oriented software engineer with experience in full-stack development and agile methodologies.',
          'Creative and analytical developer with strong foundation in computer science and continuous learning mindset.'
        ];
      })(),
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
    let suggestions = fallbackSuggestions[field] || [
      'Add more details to get personalized AI suggestions',
      'Try typing at least 10 characters for better recommendations',
      'Click the AI Enhance button for smart suggestions'
    ];
    
    // For job posting fields and project fields, filter based on current value
    if (['title', 'description', 'requirements', 'benefits', 'project'].includes(field)) {
      // Filter suggestions that are relevant to the current input
      if (value && value.length > 2) {
        const filteredSuggestions = suggestions.filter(suggestion => 
          suggestion.toLowerCase().includes(value.toLowerCase()) ||
          value.toLowerCase().includes(suggestion.toLowerCase()) ||
          this.calculateSimilarity(suggestion, value) > 0.3
        );
        
        if (filteredSuggestions.length > 0) {
          suggestions = filteredSuggestions;
        }
      }
      
      // Limit suggestions for better UX
      suggestions = suggestions.slice(0, 8); // More suggestions for projects
    }
    
    // For skills, add context-aware suggestions
    if (field === 'skills' && baseContext.skills?.length > 0) {
      const relatedSkills = this.getRelatedSkills(baseContext.skills);
      suggestions = [...new Set([...suggestions, ...relatedSkills])].slice(0, 15);
    }

    // For job titles, add context-aware suggestions
    if (field === 'jobTitle' && baseContext.skills?.length > 0) {
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
   * Calculate similarity between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Get fallback suggestions when AI is not available (legacy method)
   */
  private getFallbackSuggestions(field: string, value: string): FormSuggestion {
    return this.getEnhancedFallbackSuggestions(field, value, {});
  }

  /**
   * DYNAMIC: Get job title suggestions based on user keywords
   */
  private getDynamicTitleSuggestions(userInput: string, context: any): string[] {
    // BPO/Call Center/Customer Service
    if (userInput.includes('bpo') || userInput.includes('call center') || userInput.includes('customer service') || userInput.includes('customer support')) {
      return ['BPO Team Leader', 'Customer Service Representative', 'Call Center Manager', 'BPO Operations Manager', 'Technical Support Specialist', 'Customer Success Manager'];
    }
    // Teaching/Education
    if (userInput.includes('teacher') || userInput.includes('education') || userInput.includes('tutor') || userInput.includes('lecturer') || userInput.includes('instructor')) {
      return ['Primary Teacher', 'Secondary School Teacher', 'Subject Matter Expert', 'Online Tutor', 'Education Coordinator', 'Academic Instructor'];
    }
    // Marketing/Digital
    if (userInput.includes('marketing') || userInput.includes('digital') || userInput.includes('seo') || userInput.includes('content')) {
      return ['Digital Marketing Manager', 'Marketing Executive', 'SEO Specialist', 'Content Marketing Lead', 'Social Media Manager', 'Brand Manager'];
    }
    // Sales/BD
    if (userInput.includes('sales') || userInput.includes('business development') || userInput.includes('bd')) {
      return ['Sales Executive', 'Business Development Manager', 'Sales Manager', 'Account Manager', 'Sales Consultant', 'Regional Sales Head'];
    }
    // HR/Recruitment
    if (userInput.includes('hr') || userInput.includes('recruiter') || userInput.includes('talent') || userInput.includes('human resource')) {
      return ['HR Manager', 'Talent Acquisition Specialist', 'Recruitment Consultant', 'HR Executive', 'People Operations Manager', 'HR Business Partner'];
    }
    // Healthcare/Medical
    if (userInput.includes('doctor') || userInput.includes('nurse') || userInput.includes('medical') || userInput.includes('healthcare') || userInput.includes('physician')) {
      return ['Medical Officer', 'General Physician', 'Registered Nurse', 'Healthcare Specialist', 'Medical Consultant', 'Clinical Coordinator'];
    }
    // Finance/Accounting
    if (userInput.includes('accountant') || userInput.includes('finance') || userInput.includes('audit') || userInput.includes('tax')) {
      return ['Accountant', 'Finance Manager', 'Financial Analyst', 'Tax Consultant', 'Audit Executive', 'Senior Accountant'];
    }
    // Software/Tech
    if (userInput.includes('software') || userInput.includes('developer') || userInput.includes('engineer') || userInput.includes('programmer') || userInput.includes('tech')) {
      return ['Software Engineer', 'Full Stack Developer', 'Senior Software Developer', 'Backend Engineer', 'Frontend Developer', 'Technical Lead'];
    }
    // Generic dynamic based on user input
    if (userInput) {
      const capitalized = userInput.charAt(0).toUpperCase() + userInput.slice(1);
      return [`Senior ${capitalized}`, `${capitalized} Manager`, `${capitalized} Executive`, `${capitalized} Specialist`, `Lead ${capitalized}`, `${capitalized} Consultant`];
    }
    // Default tech fallback
    return ['Senior Software Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer'];
  }

  /**
   * DYNAMIC: Get job description suggestions
   */
  private getDynamicDescriptionSuggestions(userInput: string, context: any): string[] {
    const jobTitle = context.jobTitle || userInput || 'professional';
    const companyName = context.companyName || 'our company';
    const companyDesc = context.companyDescription || 'We are a growing organization';
    
    return [
      `${companyDesc}. We are seeking a talented ${jobTitle} to join our team. You will play a key role in our operations and contribute to our success.`,
      `Join ${companyName} as a ${jobTitle}. We are looking for someone who is passionate, skilled, and ready to make an impact. You will work with a dynamic team on exciting projects.`,
      `We are hiring a ${jobTitle} to strengthen our team. You will be responsible for key initiatives, collaborate with cross-functional teams, and drive results.`,
      `${companyName} is expanding! As a ${jobTitle}, you will have the opportunity to work on challenging projects, develop your skills, and grow your career with us.`,
      `Looking for a ${jobTitle} who can bring fresh ideas and energy to our organization. You will be part of a supportive environment focused on innovation and excellence.`
    ];
  }

  /**
   * DYNAMIC: Get requirements suggestions
   */
  private getDynamicRequirementsSuggestions(userInput: string, context: any): string[] {
    const jobTitle = context.jobTitle || userInput || 'this position';
    const experienceLevel = context.experienceLevel || 'Mid Level';
    const industry = context.industry || 'the field';
    const yearsMatch = experienceLevel.match(/(\d+)-(\d+)/);
    const minYears = yearsMatch ? yearsMatch[1] : '2';
    
    return [
      `Relevant degree or equivalent experience in ${industry}`,
      `${minYears}+ years of experience as a ${jobTitle} or similar role`,
      `Strong communication and interpersonal skills`,
      `Proven track record of delivering results in ${industry}`,
      `Ability to work independently and as part of a team`,
      `Problem-solving mindset with attention to detail`,
      `Familiarity with industry best practices and standards`,
      `Excellent organizational and time management skills`
    ];
  }

  /**
   * DYNAMIC: Get skills suggestions based on job keywords
   */
  private getDynamicSkillsSuggestions(userInput: string, context: any): string[] {
    const input = (userInput || context.jobTitle || '').toLowerCase();
    
    // BPO/Customer Service
    if (input.includes('bpo') || input.includes('customer service') || input.includes('call center')) {
      return ['Communication Skills', 'Customer Service', 'Problem Solving', 'CRM Software', 'Active Listening', 'Empathy', 'Multi-tasking', 'Conflict Resolution'];
    }
    // Teaching/Education
    if (input.includes('teacher') || input.includes('education') || input.includes('tutor')) {
      return ['Teaching', 'Curriculum Development', 'Student Assessment', 'Classroom Management', 'Communication', 'Subject Expertise', 'Educational Technology', 'Patience'];
    }
    // Marketing
    if (input.includes('marketing') || input.includes('digital') || input.includes('seo')) {
      return ['Digital Marketing', 'SEO', 'Content Marketing', 'Social Media', 'Google Analytics', 'Email Marketing', 'Campaign Management', 'Copywriting'];
    }
    // Sales
    if (input.includes('sales') || input.includes('business development')) {
      return ['Sales', 'Negotiation', 'Lead Generation', 'CRM', 'Client Relationship', 'Presentation Skills', 'Market Research', 'Closing Deals'];
    }
    // HR
    if (input.includes('hr') || input.includes('recruiter') || input.includes('talent')) {
      return ['Recruitment', 'Talent Acquisition', 'Interviewing', 'HR Policies', 'Employee Relations', 'Onboarding', 'Performance Management', 'HRIS'];
    }
    // Healthcare
    if (input.includes('doctor') || input.includes('nurse') || input.includes('medical')) {
      return ['Patient Care', 'Medical Knowledge', 'Clinical Skills', 'Diagnostics', 'Treatment Planning', 'Healthcare Compliance', 'EMR Systems', 'Bedside Manner'];
    }
    // Finance/Accounting
    if (input.includes('accountant') || input.includes('finance') || input.includes('audit')) {
      return ['Accounting', 'Financial Reporting', 'Taxation', 'Auditing', 'Excel', 'Tally', 'SAP', 'Budgeting', 'Financial Analysis'];
    }
    // Software/Tech
    if (input.includes('software') || input.includes('developer') || input.includes('engineer')) {
      return ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'Git', 'SQL', 'MongoDB'];
    }
    // Generic
    return ['Communication', 'Teamwork', 'Problem Solving', 'Time Management', 'Leadership', 'Adaptability'];
  }
}
