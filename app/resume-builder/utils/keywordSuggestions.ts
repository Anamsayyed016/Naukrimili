/**
 * Keyword Suggestions Utility
 * Provides context-aware keyword suggestions based on experience level, job title, and field type
 */

import { ExperienceLevel } from '../types';

export interface KeywordSuggestion {
  keyword: string;
  category: 'technical' | 'soft' | 'industry' | 'action-verb' | 'achievement';
  relevance: number; // 0-1
  description?: string;
}

// Technical skills by experience level
const TECHNICAL_SKILLS: Record<ExperienceLevel, string[]> = {
  fresher: [
    'HTML', 'CSS', 'JavaScript', 'Python', 'Java', 'C++', 'SQL',
    'React', 'Node.js', 'Git', 'GitHub', 'VS Code', 'Microsoft Office',
    'Basic Programming', 'Data Structures', 'Algorithms'
  ],
  entry: [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
    'SQL', 'MongoDB', 'Express', 'REST APIs', 'Git', 'Docker',
    'AWS Basics', 'Agile', 'Scrum', 'Jira'
  ],
  mid: [
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python',
    'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS',
    'CI/CD', 'Microservices', 'GraphQL', 'System Design'
  ],
  senior: [
    'System Architecture', 'Cloud Computing', 'DevOps', 'Kubernetes',
    'Microservices', 'Distributed Systems', 'Performance Optimization',
    'Team Leadership', 'Mentoring', 'Technical Strategy', 'AWS', 'Azure',
    'Scalability', 'Security', 'CI/CD Pipelines'
  ],
  executive: [
    'Strategic Planning', 'Team Leadership', 'Budget Management',
    'Stakeholder Management', 'Business Strategy', 'Digital Transformation',
    'Organizational Development', 'Change Management', 'Vendor Management',
    'P&L Responsibility', 'M&A', 'Board Reporting'
  ],
};

// Soft skills by experience level
const SOFT_SKILLS: Record<ExperienceLevel, string[]> = {
  fresher: [
    'Communication', 'Teamwork', 'Problem Solving', 'Time Management',
    'Adaptability', 'Learning Agility', 'Attention to Detail', 'Work Ethic'
  ],
  entry: [
    'Communication', 'Collaboration', 'Problem Solving', 'Time Management',
    'Adaptability', 'Critical Thinking', 'Self-Motivation', 'Attention to Detail'
  ],
  mid: [
    'Leadership', 'Communication', 'Project Management', 'Problem Solving',
    'Mentoring', 'Cross-functional Collaboration', 'Strategic Thinking', 'Agile'
  ],
  senior: [
    'Leadership', 'Strategic Thinking', 'Team Management', 'Mentoring',
    'Stakeholder Management', 'Decision Making', 'Conflict Resolution', 'Innovation'
  ],
  executive: [
    'Executive Leadership', 'Strategic Vision', 'Board Relations', 'Change Management',
    'Organizational Development', 'Crisis Management', 'Public Speaking', 'Negotiation'
  ],
};

// Action verbs by experience level
const ACTION_VERBS: Record<ExperienceLevel, string[]> = {
  fresher: [
    'Assisted', 'Learned', 'Participated', 'Contributed', 'Supported',
    'Helped', 'Completed', 'Studied', 'Practiced', 'Collaborated'
  ],
  entry: [
    'Developed', 'Implemented', 'Created', 'Designed', 'Built',
    'Maintained', 'Collaborated', 'Assisted', 'Contributed', 'Improved'
  ],
  mid: [
    'Developed', 'Architected', 'Led', 'Implemented', 'Optimized',
    'Managed', 'Mentored', 'Delivered', 'Improved', 'Streamlined'
  ],
  senior: [
    'Architected', 'Led', 'Directed', 'Strategized', 'Transformed',
    'Scaled', 'Mentored', 'Optimized', 'Innovated', 'Delivered'
  ],
  executive: [
    'Directed', 'Strategized', 'Transformed', 'Led', 'Oversaw',
    'Orchestrated', 'Championed', 'Drove', 'Established', 'Pioneered'
  ],
};

// Industry keywords
const INDUSTRY_KEYWORDS = [
  'FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'SaaS', 'B2B', 'B2C',
  'Retail', 'Manufacturing', 'Logistics', 'Real Estate', 'Entertainment',
  'Gaming', 'Media', 'Advertising', 'Consulting', 'Banking', 'Insurance'
];

/**
 * Get keyword suggestions based on experience level, job title, and field type
 */
export function getKeywordSuggestions(
  experienceLevel: ExperienceLevel | undefined,
  fieldType: 'skill' | 'summary' | 'description' | 'achievement',
  currentValue: string = '',
  limit: number = 10,
  jobTitle?: string
): KeywordSuggestion[] {
  const level = experienceLevel || 'mid';
  const suggestions: KeywordSuggestion[] = [];
  const jobTitleLower = (jobTitle || '').toLowerCase();

  // Get job-title-specific skills
  const getJobTitleSkills = (): string[] => {
    // Teaching/Education
    if (jobTitleLower.includes('teacher') || jobTitleLower.includes('educator') || jobTitleLower.includes('tutor')) {
      return [
        'Teaching', 'Curriculum Development', 'Student Assessment', 'Classroom Management',
        'Lesson Planning', 'Educational Technology', 'Student Engagement', 'Differentiated Instruction',
        'Parent Communication', 'Assessment & Evaluation', 'Subject Expertise', 'Pedagogy'
      ];
    }
    
    // Software/Tech
    if (jobTitleLower.includes('developer') || jobTitleLower.includes('engineer') || jobTitleLower.includes('programmer') || jobTitleLower.includes('software')) {
      return TECHNICAL_SKILLS[level];
    }
    
    // Marketing
    if (jobTitleLower.includes('marketing') || jobTitleLower.includes('digital') || jobTitleLower.includes('seo')) {
      return [
        'Digital Marketing', 'SEO', 'Content Marketing', 'Social Media Marketing',
        'Google Analytics', 'Email Marketing', 'Campaign Management', 'Copywriting',
        'PPC Advertising', 'Marketing Automation', 'Brand Management', 'Market Research'
      ];
    }
    
    // Sales
    if (jobTitleLower.includes('sales') || jobTitleLower.includes('business development')) {
      return [
        'Sales', 'Negotiation', 'Lead Generation', 'CRM', 'Client Relationship Management',
        'Presentation Skills', 'Market Research', 'Closing Deals', 'Account Management',
        'Revenue Generation', 'Pipeline Management', 'Customer Acquisition'
      ];
    }
    
    // HR
    if (jobTitleLower.includes('hr') || jobTitleLower.includes('recruiter') || jobTitleLower.includes('talent')) {
      return [
        'Recruitment', 'Talent Acquisition', 'Interviewing', 'HR Policies',
        'Employee Relations', 'Onboarding', 'Performance Management', 'HRIS',
        'Compensation & Benefits', 'Training & Development', 'Labor Relations'
      ];
    }
    
    // Healthcare
    if (jobTitleLower.includes('doctor') || jobTitleLower.includes('nurse') || jobTitleLower.includes('medical')) {
      return [
        'Patient Care', 'Medical Knowledge', 'Clinical Skills', 'Diagnostics',
        'Treatment Planning', 'Healthcare Compliance', 'EMR Systems', 'Bedside Manner',
        'Medical Records', 'Patient Safety', 'Healthcare Protocols'
      ];
    }
    
    // Finance/Accounting
    if (jobTitleLower.includes('accountant') || jobTitleLower.includes('finance') || jobTitleLower.includes('audit')) {
      return [
        'Financial Analysis', 'Accounting', 'Tax Preparation', 'Auditing',
        'Financial Reporting', 'Budget Management', 'GAAP', 'QuickBooks',
        'Excel', 'Financial Planning', 'Risk Management'
      ];
    }
    
    // Default: return technical skills for tech roles, otherwise return generic
    return TECHNICAL_SKILLS[level];
  };

  if (fieldType === 'skill') {
    // Get job-title-specific skills first
    const jobTitleSkills = getJobTitleSkills();
    jobTitleSkills.forEach(skill => {
      if (!currentValue.toLowerCase().includes(skill.toLowerCase())) {
        suggestions.push({
          keyword: skill,
          category: 'technical',
          relevance: 0.95, // Higher relevance for job-title-specific skills
        });
      }
    });

    // Add general technical skills if not already present
    TECHNICAL_SKILLS[level].forEach(skill => {
      if (!currentValue.toLowerCase().includes(skill.toLowerCase()) && 
          !jobTitleSkills.includes(skill)) {
        suggestions.push({
          keyword: skill,
          category: 'technical',
          relevance: 0.7, // Lower relevance for generic skills
        });
      }
    });

    // Soft skills (always relevant)
    SOFT_SKILLS[level].forEach(skill => {
      if (!currentValue.toLowerCase().includes(skill.toLowerCase())) {
        suggestions.push({
          keyword: skill,
          category: 'soft',
          relevance: 0.8,
        });
      }
    });
  } else if (fieldType === 'summary') {
    // For summary, prioritize job-title-specific skills
    const jobTitleSkills = getJobTitleSkills();
    [...jobTitleSkills.slice(0, 5), ...SOFT_SKILLS[level].slice(0, 3)].forEach(keyword => {
      if (!currentValue.toLowerCase().includes(keyword.toLowerCase())) {
        suggestions.push({
          keyword,
          category: jobTitleSkills.includes(keyword) ? 'technical' : 'soft',
          relevance: jobTitleSkills.includes(keyword) ? 0.9 : 0.8,
        });
      }
    });
  } else if (fieldType === 'description' || fieldType === 'achievement') {
    // Action verbs for descriptions
    ACTION_VERBS[level].forEach(verb => {
      suggestions.push({
        keyword: verb,
        category: 'action-verb',
        relevance: 0.9,
        description: `Start your bullet point with "${verb}"`,
      });
    });
  }

  // Filter out already present keywords and sort by relevance
  return suggestions
    .filter(s => !currentValue.toLowerCase().includes(s.keyword.toLowerCase()))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

/**
 * Get industry-specific keywords
 */
export function getIndustryKeywords(limit: number = 5): KeywordSuggestion[] {
  return INDUSTRY_KEYWORDS.slice(0, limit).map(keyword => ({
    keyword,
    category: 'industry',
    relevance: 0.7,
  }));
}

/**
 * Extract keywords from text
 */
export function extractKeywords(text: string): string[] {
  const allKeywords = [
    ...Object.values(TECHNICAL_SKILLS).flat(),
    ...Object.values(SOFT_SKILLS).flat(),
    ...INDUSTRY_KEYWORDS,
  ];

  const found: string[] = [];
  const lowerText = text.toLowerCase();

  allKeywords.forEach(keyword => {
    if (lowerText.includes(keyword.toLowerCase())) {
      found.push(keyword);
    }
  });

  return [...new Set(found)];
}

/**
 * Get missing keywords based on experience level and job title
 */
export function getMissingKeywords(
  experienceLevel: ExperienceLevel | undefined,
  currentSkills: string[],
  currentText: string = '',
  jobTitle?: string
): string[] {
  const level = experienceLevel || 'mid';
  const allText = [...currentSkills, currentText].join(' ').toLowerCase();
  const jobTitleLower = (jobTitle || '').toLowerCase();
  
  // Get job-title-specific recommended keywords
  let recommended: string[] = [];
  
  // Teaching/Education
  if (jobTitleLower.includes('teacher') || jobTitleLower.includes('educator') || jobTitleLower.includes('tutor')) {
    recommended = [
      'Teaching', 'Curriculum Development', 'Student Assessment', 'Classroom Management',
      'Lesson Planning', 'Educational Technology', 'Student Engagement', 'Differentiated Instruction',
      'Parent Communication', 'Assessment & Evaluation', 'Subject Expertise', 'Pedagogy',
      ...SOFT_SKILLS[level]
    ];
  }
  // Software/Tech
  else if (jobTitleLower.includes('developer') || jobTitleLower.includes('engineer') || jobTitleLower.includes('programmer') || jobTitleLower.includes('software')) {
    recommended = [...TECHNICAL_SKILLS[level], ...SOFT_SKILLS[level]];
  }
  // Marketing
  else if (jobTitleLower.includes('marketing') || jobTitleLower.includes('digital') || jobTitleLower.includes('seo')) {
    recommended = [
      'Digital Marketing', 'SEO', 'Content Marketing', 'Social Media Marketing',
      'Google Analytics', 'Email Marketing', 'Campaign Management', 'Copywriting',
      'PPC Advertising', 'Marketing Automation', 'Brand Management', 'Market Research',
      ...SOFT_SKILLS[level]
    ];
  }
  // Sales
  else if (jobTitleLower.includes('sales') || jobTitleLower.includes('business development')) {
    recommended = [
      'Sales', 'Negotiation', 'Lead Generation', 'CRM', 'Client Relationship Management',
      'Presentation Skills', 'Market Research', 'Closing Deals', 'Account Management',
      'Revenue Generation', 'Pipeline Management', 'Customer Acquisition',
      ...SOFT_SKILLS[level]
    ];
  }
  // HR
  else if (jobTitleLower.includes('hr') || jobTitleLower.includes('recruiter') || jobTitleLower.includes('talent')) {
    recommended = [
      'Recruitment', 'Talent Acquisition', 'Interviewing', 'HR Policies',
      'Employee Relations', 'Onboarding', 'Performance Management', 'HRIS',
      'Compensation & Benefits', 'Training & Development', 'Labor Relations',
      ...SOFT_SKILLS[level]
    ];
  }
  // Healthcare
  else if (jobTitleLower.includes('doctor') || jobTitleLower.includes('nurse') || jobTitleLower.includes('medical')) {
    recommended = [
      'Patient Care', 'Medical Knowledge', 'Clinical Skills', 'Diagnostics',
      'Treatment Planning', 'Healthcare Compliance', 'EMR Systems', 'Bedside Manner',
      'Medical Records', 'Patient Safety', 'Healthcare Protocols',
      ...SOFT_SKILLS[level]
    ];
  }
  // Finance/Accounting
  else if (jobTitleLower.includes('accountant') || jobTitleLower.includes('finance') || jobTitleLower.includes('audit')) {
    recommended = [
      'Financial Analysis', 'Accounting', 'Tax Preparation', 'Auditing',
      'Financial Reporting', 'Budget Management', 'GAAP', 'QuickBooks',
      'Excel', 'Financial Planning', 'Risk Management',
      ...SOFT_SKILLS[level]
    ];
  }
  // Default: use technical and soft skills
  else {
    recommended = [...TECHNICAL_SKILLS[level], ...SOFT_SKILLS[level]];
  }

  return recommended.filter(
    keyword => !allText.includes(keyword.toLowerCase())
  ).slice(0, 10);
}


