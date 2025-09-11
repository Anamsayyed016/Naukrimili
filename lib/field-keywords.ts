/**
 * FIELD-SPECIFIC KEYWORD SUGGESTION SYSTEM
 * Lead Engineer & Code Guardian - ATS-Optimized Keywords by Industry
 */

export interface FieldKeywords {
  field: string;
  category: string;
  keywords: {
    technical: string[];
    soft: string[];
    industry: string[];
    action: string[];
    tools: string[];
  };
  atsTips: string[];
  commonPhrases: string[];
}

export interface KeywordSuggestion {
  keyword: string;
  category: 'technical' | 'soft' | 'industry' | 'action' | 'tools';
  relevance: 'high' | 'medium' | 'low';
  description: string;
  example: string;
}

export class FieldKeywordManager {
  private static fields: FieldKeywords[] = [
    {
      field: 'Software Development',
      category: 'Technology',
      keywords: {
        technical: [
          'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'C++', 'C#',
          'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'Git', 'REST API',
          'GraphQL', 'Microservices', 'Agile', 'Scrum', 'DevOps', 'CI/CD', 'Machine Learning',
          'Artificial Intelligence', 'Data Structures', 'Algorithms', 'System Design'
        ],
        soft: [
          'Problem Solving', 'Team Collaboration', 'Code Review', 'Mentoring', 'Technical Writing',
          'Debugging', 'Performance Optimization', 'User Experience', 'Cross-functional Communication'
        ],
        industry: [
          'Software Engineering', 'Full Stack Development', 'Frontend Development', 'Backend Development',
          'Mobile Development', 'Web Development', 'Cloud Computing', 'Data Science', 'Cybersecurity'
        ],
        action: [
          'Developed', 'Implemented', 'Designed', 'Architected', 'Optimized', 'Deployed', 'Maintained',
          'Refactored', 'Debugged', 'Tested', 'Documented', 'Collaborated', 'Led', 'Mentored'
        ],
        tools: [
          'Visual Studio Code', 'IntelliJ IDEA', 'GitHub', 'GitLab', 'Jenkins', 'Jira', 'Confluence',
          'Postman', 'Figma', 'Slack', 'Trello', 'Docker Desktop', 'Kubernetes Dashboard'
        ]
      },
      atsTips: [
        'Include specific programming languages and frameworks',
        'Mention cloud platforms and deployment tools',
        'Highlight project impact with metrics',
        'Use action verbs to describe achievements',
        'Include relevant certifications and courses'
      ],
      commonPhrases: [
        'Developed scalable web applications',
        'Implemented RESTful APIs',
        'Optimized database performance',
        'Led cross-functional teams',
        'Mentored junior developers'
      ]
    },
    {
      field: 'Human Resources',
      category: 'Business',
      keywords: {
        technical: [
          'HRIS', 'ATS', 'Payroll Management', 'Benefits Administration', 'Performance Management',
          'Recruitment', 'Talent Acquisition', 'Employee Relations', 'Labor Law', 'Compliance',
          'Training & Development', 'Succession Planning', 'Compensation Analysis', 'HR Analytics'
        ],
        soft: [
          'Interpersonal Skills', 'Conflict Resolution', 'Communication', 'Leadership', 'Empathy',
          'Active Listening', 'Negotiation', 'Team Building', 'Cultural Sensitivity', 'Discretion'
        ],
        industry: [
          'Human Resources', 'Talent Management', 'Employee Engagement', 'Workforce Planning',
          'Organizational Development', 'HR Strategy', 'People Operations', 'HR Business Partner'
        ],
        action: [
          'Recruited', 'Hired', 'Trained', 'Developed', 'Managed', 'Coordinated', 'Implemented',
          'Analyzed', 'Streamlined', 'Improved', 'Facilitated', 'Resolved', 'Led', 'Collaborated'
        ],
        tools: [
          'Workday', 'BambooHR', 'ADP', 'SuccessFactors', 'LinkedIn Recruiter', 'Indeed',
          'Glassdoor', 'Slack', 'Microsoft Teams', 'Zoom', 'Excel', 'PowerBI', 'Tableau'
        ]
      },
      atsTips: [
        'Include specific HR systems and software',
        'Mention recruitment metrics and achievements',
        'Highlight employee engagement initiatives',
        'Use quantifiable results in descriptions',
        'Include relevant HR certifications'
      ],
      commonPhrases: [
        'Reduced time-to-hire by X%',
        'Improved employee retention',
        'Streamlined recruitment process',
        'Implemented new HR policies',
        'Led diversity and inclusion initiatives'
      ]
    },
    {
      field: 'Business Process Outsourcing (BPO)',
      category: 'Business',
      keywords: {
        technical: [
          'Process Optimization', 'Quality Assurance', 'Customer Service', 'Call Center Operations',
          'Data Entry', 'Back Office Support', 'Vendor Management', 'SLA Management', 'KPI Tracking',
          'CRM Systems', 'Ticketing Systems', 'Workflow Management', 'Automation', 'Six Sigma'
        ],
        soft: [
          'Customer Focus', 'Problem Solving', 'Communication', 'Patience', 'Multitasking',
          'Attention to Detail', 'Time Management', 'Adaptability', 'Teamwork', 'Stress Management'
        ],
        industry: [
          'Business Process Outsourcing', 'Customer Support', 'Technical Support', 'Data Processing',
          'Administrative Support', 'Call Center Operations', 'Back Office Services', 'Shared Services'
        ],
        action: [
          'Processed', 'Resolved', 'Handled', 'Managed', 'Coordinated', 'Analyzed', 'Improved',
          'Streamlined', 'Optimized', 'Monitored', 'Trained', 'Supported', 'Delivered', 'Exceeded'
        ],
        tools: [
          'Salesforce', 'Zendesk', 'Freshdesk', 'Jira', 'ServiceNow', 'Microsoft Office',
          'Google Workspace', 'Slack', 'Zoom', 'Teams', 'Excel', 'PowerBI', 'Tableau'
        ]
      },
      atsTips: [
        'Include specific metrics and KPIs',
        'Mention customer satisfaction scores',
        'Highlight process improvements',
        'Use action verbs for achievements',
        'Include relevant certifications'
      ],
      commonPhrases: [
        'Exceeded SLA targets by X%',
        'Improved customer satisfaction scores',
        'Reduced processing time',
        'Led team of X agents',
        'Implemented process improvements'
      ]
    },
    {
      field: 'Marketing & Digital Marketing',
      category: 'Marketing',
      keywords: {
        technical: [
          'SEO', 'SEM', 'Google Analytics', 'Facebook Ads', 'Google Ads', 'Email Marketing',
          'Content Marketing', 'Social Media Marketing', 'PPC', 'Conversion Optimization',
          'Marketing Automation', 'CRM', 'A/B Testing', 'Data Analysis', 'ROI Optimization'
        ],
        soft: [
          'Creative Thinking', 'Analytical Skills', 'Communication', 'Project Management',
          'Strategic Planning', 'Brand Management', 'Customer Focus', 'Innovation', 'Adaptability'
        ],
        industry: [
          'Digital Marketing', 'Brand Management', 'Content Strategy', 'Social Media Management',
          'Email Marketing', 'Performance Marketing', 'Growth Marketing', 'Marketing Analytics'
        ],
        action: [
          'Launched', 'Increased', 'Improved', 'Optimized', 'Developed', 'Executed', 'Analyzed',
          'Grew', 'Generated', 'Managed', 'Created', 'Implemented', 'Led', 'Collaborated'
        ],
        tools: [
          'Google Analytics', 'Google Ads', 'Facebook Business Manager', 'HubSpot', 'Mailchimp',
          'Hootsuite', 'Buffer', 'Canva', 'Adobe Creative Suite', 'Salesforce', 'Tableau'
        ]
      },
      atsTips: [
        'Include specific metrics and ROI',
        'Mention marketing tools and platforms',
        'Highlight campaign performance',
        'Use quantifiable results',
        'Include relevant certifications'
      ],
      commonPhrases: [
        'Increased conversion rate by X%',
        'Grew social media following by X%',
        'Generated $X in revenue',
        'Improved email open rates',
        'Launched successful campaigns'
      ]
    },
    {
      field: 'Finance & Accounting',
      category: 'Finance',
      keywords: {
        technical: [
          'Financial Analysis', 'Budgeting', 'Forecasting', 'Financial Modeling', 'Risk Management',
          'Auditing', 'Tax Preparation', 'Compliance', 'GAAP', 'IFRS', 'QuickBooks', 'SAP',
          'Excel Advanced', 'PowerBI', 'Tableau', 'Variance Analysis', 'Cost Accounting'
        ],
        soft: [
          'Analytical Thinking', 'Attention to Detail', 'Problem Solving', 'Communication',
          'Integrity', 'Time Management', 'Accuracy', 'Critical Thinking', 'Teamwork'
        ],
        industry: [
          'Financial Analysis', 'Accounting', 'Corporate Finance', 'Investment Banking',
          'Audit', 'Tax', 'Financial Planning', 'Risk Management', 'Treasury'
        ],
        action: [
          'Analyzed', 'Prepared', 'Reviewed', 'Reconciled', 'Forecasted', 'Budgeted',
          'Audited', 'Complied', 'Managed', 'Optimized', 'Streamlined', 'Implemented'
        ],
        tools: [
          'QuickBooks', 'SAP', 'Oracle', 'Excel', 'PowerBI', 'Tableau', 'Sage', 'Xero',
          'Workday', 'NetSuite', 'Microsoft Office', 'Google Workspace'
        ]
      },
      atsTips: [
        'Include specific financial metrics',
        'Mention accounting software expertise',
        'Highlight cost savings and improvements',
        'Use quantifiable financial results',
        'Include relevant certifications (CPA, CFA)'
      ],
      commonPhrases: [
        'Reduced costs by $X',
        'Improved financial reporting accuracy',
        'Streamlined accounting processes',
        'Managed budget of $X',
        'Identified cost savings opportunities'
      ]
    },
    {
      field: 'Healthcare & Medical',
      category: 'Healthcare',
      keywords: {
        technical: [
          'Patient Care', 'Medical Records', 'HIPAA Compliance', 'Electronic Health Records (EHR)',
          'Medical Coding', 'ICD-10', 'CPT', 'Clinical Documentation', 'Quality Assurance',
          'Healthcare Analytics', 'Telemedicine', 'Medical Devices', 'Pharmaceutical Knowledge'
        ],
        soft: [
          'Empathy', 'Compassion', 'Attention to Detail', 'Communication', 'Critical Thinking',
          'Problem Solving', 'Patience', 'Stress Management', 'Teamwork', 'Cultural Sensitivity'
        ],
        industry: [
          'Healthcare', 'Medical', 'Clinical', 'Patient Care', 'Healthcare Administration',
          'Medical Research', 'Pharmaceutical', 'Healthcare Technology', 'Public Health'
        ],
        action: [
          'Treated', 'Diagnosed', 'Cared', 'Managed', 'Coordinated', 'Documented', 'Analyzed',
          'Improved', 'Implemented', 'Monitored', 'Educated', 'Supported', 'Collaborated'
        ],
        tools: [
          'Epic', 'Cerner', 'Allscripts', 'Meditech', 'Microsoft Office', 'Google Workspace',
          'Slack', 'Zoom', 'Teams', 'Excel', 'PowerBI', 'Tableau'
        ]
      },
      atsTips: [
        'Include specific medical procedures and treatments',
        'Mention healthcare systems and software',
        'Highlight patient outcomes and improvements',
        'Use medical terminology appropriately',
        'Include relevant licenses and certifications'
      ],
      commonPhrases: [
        'Improved patient outcomes',
        'Reduced readmission rates',
        'Streamlined patient care processes',
        'Implemented quality improvement initiatives',
        'Maintained high patient satisfaction scores'
      ]
    }
  ];

  /**
   * Get keywords for a specific field
   */
  static getKeywordsForField(field: string): FieldKeywords | null {
    return this.fields.find(f => f.field.toLowerCase() === field.toLowerCase()) || null;
  }

  /**
   * Get all available fields
   */
  static getAllFields(): string[] {
    return this.fields.map(f => f.field);
  }

  /**
   * Get AI-powered keyword suggestions based on field and context
   */
  static getAISuggestions(field: string, context: string, currentKeywords: string[] = []): KeywordSuggestion[] {
    const fieldData = this.getKeywordsForField(field);
    if (!fieldData) return [];

    const suggestions: KeywordSuggestion[] = [];
    
    // Get high-relevance keywords based on context
    const allKeywords = [
      ...fieldData.keywords.technical,
      ...fieldData.keywords.soft,
      ...fieldData.keywords.industry,
      ...fieldData.keywords.action,
      ...fieldData.keywords.tools
    ];

    // Filter out already used keywords
    const availableKeywords = allKeywords.filter(keyword => 
      !currentKeywords.some(used => used.toLowerCase().includes(keyword.toLowerCase()))
    );

    // Create suggestions with relevance scoring
    availableKeywords.forEach(keyword => {
      let relevance: 'high' | 'medium' | 'low' = 'medium';
      
      // High relevance if keyword appears in context
      if (context.toLowerCase().includes(keyword.toLowerCase())) {
        relevance = 'high';
      }
      
      // High relevance for technical and action keywords
      if (fieldData.keywords.technical.includes(keyword) || fieldData.keywords.action.includes(keyword)) {
        relevance = 'high';
      }

      // Medium relevance for industry keywords
      if (fieldData.keywords.industry.includes(keyword)) {
        relevance = 'medium';
      }

      suggestions.push({
        keyword,
        category: this.getKeywordCategory(keyword, fieldData),
        relevance,
        description: this.getKeywordDescription(keyword, fieldData),
        example: this.getKeywordExample(keyword, fieldData)
      });
    });

    // Sort by relevance and return top suggestions
    return suggestions
      .sort((a, b) => {
        const relevanceOrder = { high: 3, medium: 2, low: 1 };
        return relevanceOrder[b.relevance] - relevanceOrder[a.relevance];
      })
      .slice(0, 20); // Return top 20 suggestions
  }

  /**
   * Get ATS optimization tips for a field
   */
  static getATSTips(field: string): string[] {
    const fieldData = this.getKeywordsForField(field);
    return fieldData?.atsTips || [];
  }

  /**
   * Get common phrases for a field
   */
  static getCommonPhrases(field: string): string[] {
    const fieldData = this.getKeywordsForField(field);
    return fieldData?.commonPhrases || [];
  }

  private static getKeywordCategory(keyword: string, fieldData: FieldKeywords): 'technical' | 'soft' | 'industry' | 'action' | 'tools' {
    if (fieldData.keywords.technical.includes(keyword)) return 'technical';
    if (fieldData.keywords.soft.includes(keyword)) return 'soft';
    if (fieldData.keywords.industry.includes(keyword)) return 'industry';
    if (fieldData.keywords.action.includes(keyword)) return 'action';
    if (fieldData.keywords.tools.includes(keyword)) return 'tools';
    return 'technical';
  }

  private static getKeywordDescription(keyword: string, fieldData: FieldKeywords): string {
    const descriptions: Record<string, string> = {
      'JavaScript': 'Programming language for web development',
      'Python': 'Versatile programming language for data science and web development',
      'React': 'Popular JavaScript library for building user interfaces',
      'Problem Solving': 'Ability to analyze and solve complex problems',
      'Team Collaboration': 'Working effectively with team members',
      'Customer Service': 'Providing support and assistance to customers',
      'Process Optimization': 'Improving business processes for efficiency',
      'SEO': 'Search Engine Optimization for improving website visibility',
      'Financial Analysis': 'Analyzing financial data to make business decisions',
      'Patient Care': 'Providing medical care and support to patients'
    };
    
    return descriptions[keyword] || `Professional skill in ${keyword}`;
  }

  private static getKeywordExample(keyword: string, fieldData: FieldKeywords): string {
    const examples: Record<string, string> = {
      'JavaScript': 'Developed interactive web applications using JavaScript',
      'Problem Solving': 'Resolved complex technical issues affecting 100+ users',
      'Customer Service': 'Maintained 95% customer satisfaction rating',
      'Process Optimization': 'Reduced processing time by 30% through process optimization',
      'SEO': 'Improved website traffic by 40% through SEO strategies',
      'Financial Analysis': 'Analyzed quarterly financial reports to identify cost savings',
      'Patient Care': 'Provided compassionate care to 50+ patients daily'
    };
    
    return examples[keyword] || `Applied ${keyword} skills to achieve measurable results`;
  }
}
