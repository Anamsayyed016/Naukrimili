/**
 * Job Categorization Service
 * Maps jobs into categories using keyword matching and AI-powered classification
 */

export interface JobCategory {
  id: string;
  name: string;
  keywords: string[];
  weight: number;
  parentCategory?: string;
}

export interface CategorizationResult {
  category: string;
  confidence: number;
  subcategories: string[];
  keywords: string[];
}

export class JobCategorizationService {
  private static instance: JobCategorizationService;
  private categories: JobCategory[] = [];

  public static getInstance(): JobCategorizationService {
    if (!JobCategorizationService.instance) {
      JobCategorizationService.instance = new JobCategorizationService();
    }
    return JobCategorizationService.instance;
  }

  constructor() {
    this.initializeCategories();
  }

  /**
   * Categorize a job based on title, description, and company
   */
  async categorizeJob(
    title: string,
    description: string,
    company: string,
    skills: string[] = []
  ): Promise<CategorizationResult> {
    const text = `${title} ${description} ${company} ${skills.join(' ')}`.toLowerCase();
    
    let bestMatch: { category: string; confidence: number; keywords: string[] } = {
      category: 'General',
      confidence: 0,
      keywords: []
    };

    // Score each category
    for (const category of this.categories) {
      const { score, matchedKeywords } = this.calculateCategoryScore(text, category);
      
      if (score > bestMatch.confidence) {
        bestMatch = {
          category: category.name,
          confidence: score,
          keywords: matchedKeywords
        };
      }
    }

    // Determine subcategories
    const subcategories = this.determineSubcategories(text, bestMatch.category);

    return {
      category: bestMatch.category,
      confidence: bestMatch.confidence,
      subcategories,
      keywords: bestMatch.keywords
    };
  }

  /**
   * Calculate category score based on keyword matching
   */
  private calculateCategoryScore(text: string, category: JobCategory): { score: number; matchedKeywords: string[] } {
    let score = 0;
    const matchedKeywords: string[] = [];

    for (const keyword of category.keywords) {
      const keywordLower = keyword.toLowerCase();
      
      // Exact match gets full weight
      if (text.includes(keywordLower)) {
        score += category.weight;
        matchedKeywords.push(keyword);
      }
      // Partial match gets half weight
      else if (this.hasPartialMatch(text, keywordLower)) {
        score += category.weight * 0.5;
        matchedKeywords.push(keyword);
      }
    }

    // Normalize score (max possible score is sum of all keyword weights)
    const maxScore = category.keywords.length * category.weight;
    const normalizedScore = maxScore > 0 ? Math.min(score / maxScore, 1) : 0;

    return { score: normalizedScore, matchedKeywords };
  }

  /**
   * Check for partial keyword matches (handles plurals, variations)
   */
  private hasPartialMatch(text: string, keyword: string): boolean {
    // Remove common suffixes for better matching
    const baseKeyword = keyword.replace(/(s|ing|ed|er|est)$/, '');
    const baseText = text.replace(/(s|ing|ed|er|est)\b/g, '');
    
    return baseText.includes(baseKeyword) && baseKeyword.length > 3;
  }

  /**
   * Determine subcategories based on specific keywords
   */
  private determineSubcategories(text: string, mainCategory: string): string[] {
    const subcategories: string[] = [];

    switch (mainCategory) {
      case 'Technology':
        if (text.includes('frontend') || text.includes('ui') || text.includes('react')) {
          subcategories.push('Frontend Development');
        }
        if (text.includes('backend') || text.includes('api') || text.includes('server')) {
          subcategories.push('Backend Development');
        }
        if (text.includes('full stack') || text.includes('fullstack')) {
          subcategories.push('Full Stack Development');
        }
        if (text.includes('mobile') || text.includes('ios') || text.includes('android')) {
          subcategories.push('Mobile Development');
        }
        if (text.includes('devops') || text.includes('deployment') || text.includes('ci/cd')) {
          subcategories.push('DevOps');
        }
        if (text.includes('data') || text.includes('analytics') || text.includes('machine learning')) {
          subcategories.push('Data Science');
        }
        break;

      case 'Healthcare':
        if (text.includes('nurse') || text.includes('nursing')) {
          subcategories.push('Nursing');
        }
        if (text.includes('doctor') || text.includes('physician')) {
          subcategories.push('Medical Practice');
        }
        if (text.includes('pharmacy') || text.includes('pharmacist')) {
          subcategories.push('Pharmacy');
        }
        if (text.includes('therapy') || text.includes('therapist')) {
          subcategories.push('Therapy');
        }
        break;

      case 'Finance':
        if (text.includes('accounting') || text.includes('accountant')) {
          subcategories.push('Accounting');
        }
        if (text.includes('banking') || text.includes('bank')) {
          subcategories.push('Banking');
        }
        if (text.includes('investment') || text.includes('portfolio')) {
          subcategories.push('Investment');
        }
        if (text.includes('insurance')) {
          subcategories.push('Insurance');
        }
        break;

      case 'Marketing':
        if (text.includes('digital') || text.includes('online')) {
          subcategories.push('Digital Marketing');
        }
        if (text.includes('content') || text.includes('writing')) {
          subcategories.push('Content Marketing');
        }
        if (text.includes('social media') || text.includes('social')) {
          subcategories.push('Social Media Marketing');
        }
        if (text.includes('seo') || text.includes('search engine')) {
          subcategories.push('SEO');
        }
        break;

      case 'Sales':
        if (text.includes('inside sales') || text.includes('telephone')) {
          subcategories.push('Inside Sales');
        }
        if (text.includes('outside sales') || text.includes('field sales')) {
          subcategories.push('Outside Sales');
        }
        if (text.includes('business development') || text.includes('bdr')) {
          subcategories.push('Business Development');
        }
        break;

      case 'Customer Service':
        if (text.includes('call center') || text.includes('phone')) {
          subcategories.push('Call Center');
        }
        if (text.includes('chat') || text.includes('email')) {
          subcategories.push('Online Support');
        }
        if (text.includes('technical support') || text.includes('tech support')) {
          subcategories.push('Technical Support');
        }
        break;
    }

    return subcategories;
  }

  /**
   * Initialize job categories with keywords and weights
   */
  private initializeCategories(): void {
    this.categories = [
      {
        id: 'technology',
        name: 'Technology',
        keywords: [
          'software', 'developer', 'programmer', 'engineer', 'tech', 'it', 'computer',
          'frontend', 'backend', 'full stack', 'mobile', 'web', 'application', 'system',
          'database', 'cloud', 'devops', 'data', 'analytics', 'machine learning', 'ai',
          'javascript', 'python', 'java', 'react', 'node', 'angular', 'vue', 'typescript',
          'sql', 'mongodb', 'postgresql', 'aws', 'azure', 'docker', 'kubernetes'
        ],
        weight: 1.0
      },
      {
        id: 'healthcare',
        name: 'Healthcare',
        keywords: [
          'health', 'medical', 'doctor', 'nurse', 'nursing', 'physician', 'healthcare',
          'hospital', 'clinic', 'pharmacy', 'pharmacist', 'therapy', 'therapist',
          'patient', 'care', 'treatment', 'diagnosis', 'medicine', 'clinical'
        ],
        weight: 1.0
      },
      {
        id: 'finance',
        name: 'Finance',
        keywords: [
          'finance', 'financial', 'banking', 'bank', 'investment', 'accounting',
          'accountant', 'trading', 'portfolio', 'insurance', 'credit', 'loan',
          'audit', 'tax', 'treasury', 'risk', 'compliance', 'fintech'
        ],
        weight: 1.0
      },
      {
        id: 'education',
        name: 'Education',
        keywords: [
          'education', 'teacher', 'teaching', 'professor', 'instructor', 'academic',
          'school', 'university', 'college', 'student', 'learning', 'curriculum',
          'training', 'tutor', 'mentor', 'educational', 'pedagogy'
        ],
        weight: 1.0
      },
      {
        id: 'marketing',
        name: 'Marketing',
        keywords: [
          'marketing', 'advertising', 'brand', 'promotion', 'campaign', 'digital marketing',
          'content', 'social media', 'seo', 'sem', 'ppc', 'email marketing',
          'public relations', 'pr', 'communications', 'creative', 'design'
        ],
        weight: 1.0
      },
      {
        id: 'sales',
        name: 'Sales',
        keywords: [
          'sales', 'selling', 'business development', 'account manager', 'sales representative',
          'inside sales', 'outside sales', 'field sales', 'retail', 'wholesale',
          'customer acquisition', 'lead generation', 'bdr', 'sdr'
        ],
        weight: 1.0
      },
      {
        id: 'hr',
        name: 'Human Resources',
        keywords: [
          'human resources', 'hr', 'recruitment', 'recruiter', 'talent', 'hiring',
          'people operations', 'employee relations', 'compensation', 'benefits',
          'training', 'development', 'onboarding', 'performance'
        ],
        weight: 1.0
      },
      {
        id: 'operations',
        name: 'Operations',
        keywords: [
          'operations', 'operational', 'logistics', 'supply chain', 'manufacturing',
          'production', 'quality', 'process', 'efficiency', 'optimization',
          'warehouse', 'inventory', 'procurement', 'vendor', 'supplier'
        ],
        weight: 1.0
      },
      {
        id: 'customer_service',
        name: 'Customer Service',
        keywords: [
          'customer service', 'customer support', 'support', 'help desk', 'call center',
          'bpo', 'customer care', 'client service', 'technical support', 'chat support',
          'phone support', 'email support', 'troubleshooting'
        ],
        weight: 1.0
      },
      {
        id: 'design',
        name: 'Design',
        keywords: [
          'design', 'designer', 'ui', 'ux', 'user interface', 'user experience',
          'graphic', 'visual', 'creative', 'art', 'illustration', 'branding',
          'web design', 'mobile design', 'product design', 'interaction design'
        ],
        weight: 1.0
      },
      {
        id: 'consulting',
        name: 'Consulting',
        keywords: [
          'consulting', 'consultant', 'advisory', 'strategy', 'management consulting',
          'business consulting', 'it consulting', 'financial consulting', 'analyst',
          'advisor', 'expert', 'specialist', 'professional services'
        ],
        weight: 1.0
      },
      {
        id: 'retail',
        name: 'Retail',
        keywords: [
          'retail', 'store', 'shop', 'sales associate', 'cashier', 'merchandise',
          'inventory', 'customer service', 'floor', 'manager', 'supervisor',
          'e-commerce', 'online retail', 'fashion', 'apparel'
        ],
        weight: 1.0
      },
      {
        id: 'hospitality',
        name: 'Hospitality',
        keywords: [
          'hospitality', 'hotel', 'restaurant', 'food service', 'catering',
          'tourism', 'travel', 'guest service', 'front desk', 'housekeeping',
          'chef', 'cook', 'server', 'waiter', 'bartender'
        ],
        weight: 1.0
      },
      {
        id: 'legal',
        name: 'Legal',
        keywords: [
          'legal', 'law', 'lawyer', 'attorney', 'paralegal', 'legal assistant',
          'compliance', 'regulatory', 'litigation', 'contract', 'corporate law',
          'criminal law', 'family law', 'immigration law'
        ],
        weight: 1.0
      },
      {
        id: 'general',
        name: 'General',
        keywords: [
          'administrative', 'admin', 'assistant', 'coordinator', 'manager',
          'supervisor', 'director', 'executive', 'office', 'clerk', 'receptionist'
        ],
        weight: 0.5
      }
    ];
  }

  /**
   * Get all available categories
   */
  getCategories(): JobCategory[] {
    return this.categories;
  }

  /**
   * Add a new category
   */
  addCategory(category: JobCategory): void {
    this.categories.push(category);
  }

  /**
   * Update an existing category
   */
  updateCategory(categoryId: string, updates: Partial<JobCategory>): void {
    const index = this.categories.findIndex(cat => cat.id === categoryId);
    if (index !== -1) {
      this.categories[index] = { ...this.categories[index], ...updates };
    }
  }

  /**
   * Remove a category
   */
  removeCategory(categoryId: string): void {
    this.categories = this.categories.filter(cat => cat.id !== categoryId);
  }
}
