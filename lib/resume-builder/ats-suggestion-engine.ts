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
    // Try multiple OpenAI key sources
    const openaiKey = process.env.OPENAI_API_KEY || 
                      process.env.OPENAI_KEY ||
                      null;
    
    if (openaiKey) {
      try {
        this.openai = new OpenAI({ 
          apiKey: openaiKey,
          // Use latest model for better results
          defaultQuery: { 'model': process.env.OPENAI_MODEL || 'gpt-4o-mini' }
        });
        console.log('✅ OpenAI initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize OpenAI:', error);
        this.openai = null;
      }
    } else {
      this.openai = null;
      console.warn('⚠️ OPENAI_API_KEY not found. ATS suggestions will use Gemini or fallback.');
    }

    // Try multiple Gemini key sources
    const geminiKey = process.env.GEMINI_API_KEY || 
                      process.env.GOOGLE_AI_API_KEY ||
                      null;
    
    if (geminiKey) {
      try {
        this.gemini = new GoogleGenerativeAI(geminiKey);
        console.log('✅ Gemini initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Gemini:', error);
        this.gemini = null;
      }
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
    // Use better model if available, fallback to gpt-4o-mini
    const model = process.env.OPENAI_MODEL || 
                  process.env.OPENAI_DEFAULT_MODEL || 
                  'gpt-4o-mini';

    const completion = await this.openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are an expert ATS resume strategist with 10+ years of experience. You understand what ATS systems scan for and how to optimize resumes for maximum visibility. Generate professional, ATS-optimized resume content that is industry-specific, role-aligned, and includes real keywords. Return ONLY valid JSON, no markdown, no explanations.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent, factual output
      max_tokens: 3000, // Increased for more comprehensive responses
      response_format: { type: 'json_object' },
      // Add top_p for better quality
      top_p: 0.9,
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
    // Use better Gemini model if available
    const modelName = process.env.GEMINI_MODEL || 
                      process.env.GOOGLE_AI_MODEL || 
                      'gemini-1.5-pro'; // Use Pro for better quality
    const model = this.gemini.getGenerativeModel({ 
      model: modelName,
      systemInstruction: 'You are an expert ATS resume strategist with 10+ years of experience. You understand what ATS systems scan for and how to optimize resumes for maximum visibility. Generate professional, ATS-optimized resume content that is industry-specific, role-aligned, and includes real keywords. Return ONLY valid JSON, no markdown, no explanations.'
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent, factual output
        maxOutputTokens: 3000, // Increased for more comprehensive responses
        responseMimeType: 'application/json',
        topP: 0.9,
        topK: 40,
      }
    });

    const response = result.response.text();
    if (!response) throw new Error('Empty response from Gemini');

    const parsed = JSON.parse(response);
    return this.validateAndNormalizeResponse(parsed);
  }

  /**
   * Build comprehensive prompt for AI with enhanced requirements
   */
  private buildPrompt(request: ATSSuggestionRequest, expLevel: string): string {
    const { job_title, industry, summary_input, skills_input, experience_input, education_input } = request;

    // Infer context if inputs are blank
    const inferredJob = job_title || this.inferJobTitle(industry, skills_input);
    const inferredIndustry = industry || this.inferIndustry(job_title, skills_input);

    // Build context analysis
    const hasExistingContent = !!(summary_input || skills_input || experience_input || education_input);
    const contextHint = hasExistingContent 
      ? 'User has provided some content. Enhance and complement it with ATS-optimized suggestions.'
      : 'User has blank inputs. Generate comprehensive, industry-standard suggestions based on job title and industry.';

    return `You are an expert ATS resume strategist and career coach. Generate REAL, industry-specific, ATS-optimized resume content.

TARGET PROFILE:
- Job Title: ${inferredJob || 'Not specified - infer from industry'}
- Industry: ${inferredIndustry || 'Not specified - infer from job title'}
- Experience Level: ${expLevel}
${contextHint}

EXISTING CONTENT (use as reference, enhance if present):
- Summary: ${summary_input || '(none - generate new)'}
- Skills: ${skills_input || '(none - generate new)'}
- Experience: ${experience_input || '(none - generate new)'}
- Education: ${education_input || '(none - generate new)'}

CRITICAL REQUIREMENTS - NO FAKE DATA:

1. SUMMARY (2-3 lines, 60-90 words):
   - Must be role-aligned and industry-specific
   - Include 3-5 real ATS keywords naturally
   - Use action-oriented language
   - Mention years of experience if ${expLevel === 'experienced' || expLevel === 'senior' ? 'applicable' : 'not applicable'}
   - Focus on value proposition and key strengths
   - NO generic phrases like "hardworking" or "team player" without context
   - NO lorem ipsum or placeholder text

2. SKILLS (8-14 items):
   - REAL technical skills, tools, software, frameworks, methodologies
   - Industry-standard technologies for ${inferredJob || 'this role'}
   - Mix of: Programming languages, frameworks, tools, platforms, methodologies
   - Examples for ${inferredJob || 'this role'}: ${this.getSkillExamples(inferredJob, inferredIndustry)}
   - NO generic skills like "Microsoft Office" unless relevant
   - NO fake technologies or made-up tools
   - Prioritize current industry standards

3. ATS_KEYWORDS (15-25 items):
   - REAL industry vocabulary and technical terms
   - Action verbs: Managed, Developed, Implemented, Optimized, Led, Executed, etc.
   - Industry-specific terminology for ${inferredIndustry || 'this industry'}
   - Technical terms relevant to ${inferredJob || 'this role'}
   - Certifications, methodologies, frameworks (if applicable)
   - NO generic words like "communication" or "teamwork"
   - Focus on keywords ATS systems actually scan for
   - Include both technical and business keywords

4. EXPERIENCE_BULLETS (3-6 items):
   - Use STAR format: Situation/Task → Action → Result
   - Include REALISTIC metrics (%, $, time saved, efficiency gains)
   - Job-title-specific achievements for ${inferredJob || 'this role'}
   - Industry-relevant accomplishments
   - Action verbs: Led, Developed, Implemented, Optimized, Increased, Reduced, etc.
   - Metrics examples: "increased efficiency by 25%", "reduced costs by $50K", "improved performance by 30%"
   - NO fake metrics that don't make sense
   - Each bullet should be specific and measurable
   - Format: "Action Verb + Task + Result with metric"

5. PROJECTS (1-2 items):
   - Real project titles relevant to ${inferredJob || 'this role'}
   - One-line description with technologies/tools used
   - Industry-appropriate project types
   - Include key technologies in description
   - NO placeholder project names

${expLevel.toUpperCase()} SPECIFIC RULES:
${this.getRoleSpecificRules(expLevel)}

INDUSTRY CONTEXT FOR ${inferredIndustry || 'General Industry'}:
${this.getIndustryContext(inferredIndustry, inferredJob)}

OUTPUT FORMAT (strict JSON only, no markdown):
{
  "summary": "Professional summary text here (2-3 lines)",
  "skills": ["Real Skill 1", "Real Skill 2", "Real Skill 3", ...],
  "ats_keywords": ["Real Keyword 1", "Real Keyword 2", "Real Keyword 3", ...],
  "experience_bullets": ["Real bullet point with metric", "Another real bullet point", ...],
  "projects": [
    {"title": "Real Project Title", "description": "One-line description with technologies"}
  ]
}

VALIDATION RULES:
- All content must be REAL and industry-appropriate
- NO lorem ipsum, placeholder text, or fake data
- Skills must be actual technologies/tools used in ${inferredJob || 'this role'}
- Keywords must be terms ATS systems actually scan for
- Metrics must be realistic and believable
- Projects must be relevant to the role and industry

CRITICAL: Return ONLY valid JSON. No markdown formatting, no code blocks, no explanations. Just pure JSON object.`;
  }

  /**
   * Get role-specific rules with enhanced guidance
   */
  private getRoleSpecificRules(expLevel: string): string {
    switch (expLevel.toLowerCase()) {
      case 'fresher':
        return `- Focus on internships, academic projects, foundational skills
- Avoid "5+ years experience" or senior-level terms
- Use entry-level technologies and tools
- Emphasize learning ability, academic achievements, and project work
- Include relevant coursework, certifications, or training programs
- Skills should reflect foundational knowledge, not advanced expertise
- Experience bullets should focus on academic projects, internships, or volunteer work
- Use metrics like "completed 5+ projects", "maintained 3.5+ GPA", "contributed to team of X"`;

      case 'student':
        return `- Focus on academic projects, coursework, and foundational tools
- Include relevant technologies learned in coursework
- Emphasize academic achievements, relevant coursework, and projects
- Include certifications, training programs, or online courses
- Experience bullets should highlight academic projects, internships, or part-time work
- Skills should reflect technologies and tools learned in academic setting
- Use metrics like "developed X projects", "completed coursework in Y", "achieved X GPA"`;

      case 'experienced':
        return `- Include measurable achievements with real metrics (%, $, time saved, efficiency gains)
- Use industry-standard tools, systems, frameworks, and methodologies
- Include cross-functional collaboration and stakeholder management
- Emphasize impact, results, and business value
- Skills should reflect 3-5 years of professional experience
- Experience bullets should show progression and increasing responsibility
- Use metrics like "increased efficiency by 25%", "reduced costs by $50K", "improved performance by 30%"
- Include leadership keywords if applicable (Led, Managed, Coordinated)`;

      case 'senior':
        return `- Include leadership, strategy, and optimization keywords
- Emphasize cross-functional impact, team management, and strategic initiatives
- Include high-level technical and business skills
- Show measurable impact on business outcomes
- Skills should reflect 7+ years of experience and leadership capabilities
- Experience bullets should demonstrate strategic thinking and organizational impact
- Use metrics like "led team of X", "drove revenue growth of Y%", "optimized processes saving $Z"
- Include executive-level keywords: Strategic Planning, Executive Leadership, Organizational Development`;

      default:
        return `- Generate appropriate content based on experience level
- Include relevant industry keywords and technical terms
- Focus on measurable achievements and impact
- Use realistic metrics and accomplishments`;
    }
  }

  /**
   * Get skill examples for job title and industry
   */
  private getSkillExamples(jobTitle: string, industry: string): string {
    const title = (jobTitle || '').toLowerCase();
    const ind = (industry || '').toLowerCase();

    // Tech roles
    if (title.includes('developer') || title.includes('engineer') || title.includes('programmer')) {
      if (title.includes('frontend') || title.includes('react') || title.includes('angular')) {
        return 'React, TypeScript, Next.js, Tailwind CSS, Redux, Jest, Webpack';
      }
      if (title.includes('backend') || title.includes('node') || title.includes('api')) {
        return 'Node.js, Express, Python, Django, REST APIs, PostgreSQL, MongoDB, Docker';
      }
      if (title.includes('full') || title.includes('fullstack')) {
        return 'React, Node.js, TypeScript, PostgreSQL, AWS, Docker, CI/CD';
      }
      return 'JavaScript, Python, Git, SQL, REST APIs, Docker, AWS, Agile';
    }

    // Data roles
    if (title.includes('data') || title.includes('analyst') || title.includes('scientist')) {
      return 'Python, SQL, Pandas, NumPy, Tableau, Power BI, Machine Learning, Data Visualization';
    }

    // Marketing roles
    if (title.includes('marketing') || title.includes('digital') || title.includes('seo')) {
      return 'Google Analytics, SEO, SEM, Social Media Marketing, Content Marketing, HubSpot, Mailchimp';
    }

    // Sales roles
    if (title.includes('sales') || title.includes('business development')) {
      return 'CRM (Salesforce), Lead Generation, Negotiation, Client Relations, Sales Forecasting';
    }

    // Finance roles
    if (title.includes('finance') || title.includes('accountant') || title.includes('analyst')) {
      return 'Financial Analysis, Excel, QuickBooks, SAP, Financial Modeling, Risk Management';
    }

    // HR roles
    if (title.includes('hr') || title.includes('human resources') || title.includes('recruiter')) {
      return 'Talent Acquisition, ATS (Applicant Tracking Systems), HRIS, Employee Relations, Performance Management';
    }

    // Generic professional
    return 'Industry-standard tools and technologies relevant to this role';
  }

  /**
   * Get industry-specific context
   */
  private getIndustryContext(industry: string, jobTitle: string): string {
    const ind = (industry || '').toLowerCase();
    const title = (jobTitle || '').toLowerCase();

    if (ind.includes('tech') || ind.includes('software') || ind.includes('it') || ind.includes('technology')) {
      return `Technology Industry Context:
- Common technologies: Cloud platforms (AWS, Azure, GCP), DevOps tools, CI/CD pipelines
- Methodologies: Agile, Scrum, DevOps, Microservices, API-first development
- Key ATS keywords: Software Development Life Cycle (SDLC), Version Control, Code Review, Automated Testing, Containerization
- Industry trends: Cloud-native, Serverless, AI/ML integration, Security-first development`;
    }

    if (ind.includes('finance') || ind.includes('banking') || ind.includes('financial')) {
      return `Finance Industry Context:
- Common tools: Financial modeling software, Trading platforms, Risk management systems
- Methodologies: Financial analysis, Risk assessment, Compliance, Regulatory reporting
- Key ATS keywords: Financial Analysis, Risk Management, Compliance, Financial Reporting, Portfolio Management, Regulatory Compliance
- Industry standards: GAAP, IFRS, SOX compliance, Financial modeling`;
    }

    if (ind.includes('health') || ind.includes('medical') || ind.includes('healthcare')) {
      return `Healthcare Industry Context:
- Common tools: Electronic Health Records (EHR), Medical billing systems, Healthcare analytics
- Methodologies: Patient care protocols, Healthcare compliance, Medical coding
- Key ATS keywords: HIPAA Compliance, Patient Care, Medical Records, Healthcare Administration, Clinical Operations
- Industry standards: HIPAA, HITECH, Medical coding (ICD-10, CPT)`;
    }

    if (ind.includes('retail') || ind.includes('e-commerce') || ind.includes('consumer')) {
      return `Retail/E-commerce Industry Context:
- Common tools: E-commerce platforms, Inventory management, CRM systems
- Methodologies: Supply chain management, Customer experience optimization, Digital marketing
- Key ATS keywords: E-commerce, Inventory Management, Customer Experience, Supply Chain, Digital Marketing, Sales Optimization
- Industry trends: Omnichannel retail, Personalization, Data-driven marketing`;
    }

    if (ind.includes('education') || ind.includes('edtech') || ind.includes('learning')) {
      return `Education Industry Context:
- Common tools: Learning Management Systems (LMS), Educational technology platforms
- Methodologies: Curriculum development, Instructional design, Student assessment
- Key ATS keywords: Curriculum Development, Instructional Design, Student Assessment, Educational Technology, Learning Management
- Industry standards: Educational standards compliance, Student data privacy`;
    }

    return `General Industry Context:
- Focus on industry-standard tools and methodologies
- Include relevant certifications and professional standards
- Emphasize compliance and best practices for this industry`;
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
   * Validate and normalize AI response with enhanced validation
   */
  private validateAndNormalizeResponse(parsed: any): ATSSuggestionResponse {
    // Clean and validate summary
    let summary = '';
    if (typeof parsed.summary === 'string') {
      summary = parsed.summary.trim();
      // Remove markdown code blocks if present
      summary = summary.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      // Validate summary length (60-120 words acceptable)
      const wordCount = summary.split(/\s+/).length;
      if (wordCount < 30 || wordCount > 150) {
        console.warn(`Summary word count (${wordCount}) outside recommended range, but keeping it`);
      }
      // Check for placeholder text
      if (this.containsPlaceholderText(summary)) {
        console.warn('Summary may contain placeholder text');
      }
    }

    // Clean and validate skills
    let skills: string[] = [];
    if (Array.isArray(parsed.skills)) {
      skills = parsed.skills
        .filter((s: any) => typeof s === 'string' && s.trim().length > 0)
        .map((s: string) => s.trim())
        .filter((s: string) => !this.containsPlaceholderText(s))
        .slice(0, 14);
    }

    // Clean and validate ATS keywords
    let ats_keywords: string[] = [];
    if (Array.isArray(parsed.ats_keywords)) {
      ats_keywords = parsed.ats_keywords
        .filter((k: any) => typeof k === 'string' && k.trim().length > 0)
        .map((k: string) => k.trim())
        .filter((k: string) => !this.containsPlaceholderText(k))
        .slice(0, 25);
    }

    // Clean and validate experience bullets
    let experience_bullets: string[] = [];
    if (Array.isArray(parsed.experience_bullets)) {
      experience_bullets = parsed.experience_bullets
        .filter((b: any) => typeof b === 'string' && b.trim().length > 0)
        .map((b: string) => b.trim())
        .filter((b: string) => !this.containsPlaceholderText(b))
        .slice(0, 6);
    }

    // Clean and validate projects
    let projects: Array<{ title: string; description: string }> = [];
    if (Array.isArray(parsed.projects)) {
      projects = parsed.projects
        .filter((p: any) => p && typeof p.title === 'string' && typeof p.description === 'string')
        .map((p: any) => ({
          title: p.title.trim(),
          description: p.description.trim()
        }))
        .filter((p: { title: string; description: string }) => 
          !this.containsPlaceholderText(p.title) && !this.containsPlaceholderText(p.description)
        )
        .slice(0, 2);
    }

    return {
      summary,
      skills,
      ats_keywords,
      experience_bullets,
      projects
    };
  }

  /**
   * Check if text contains placeholder or fake content
   */
  private containsPlaceholderText(text: string): boolean {
    const lowerText = text.toLowerCase();
    const placeholders = [
      'lorem ipsum',
      'placeholder',
      'example text',
      'sample text',
      'dummy text',
      'test data',
      'fake data',
      'xxx',
      'yyy',
      'zzz',
      '[insert',
      '[enter',
      '[add',
      'todo:',
      'tbd:',
      'to be determined'
    ];
    return placeholders.some(placeholder => lowerText.includes(placeholder));
  }
}

