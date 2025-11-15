/**
 * Keyword Suggestions Utility
 * Provides context-aware keyword suggestions based on experience level and field type
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
 * Get keyword suggestions based on experience level and field type
 */
export function getKeywordSuggestions(
  experienceLevel: ExperienceLevel | undefined,
  fieldType: 'skill' | 'summary' | 'description' | 'achievement',
  currentValue: string = '',
  limit: number = 10
): KeywordSuggestion[] {
  const level = experienceLevel || 'mid';
  const suggestions: KeywordSuggestion[] = [];

  if (fieldType === 'skill') {
    // Technical skills
    TECHNICAL_SKILLS[level].forEach(skill => {
      if (!currentValue.toLowerCase().includes(skill.toLowerCase())) {
        suggestions.push({
          keyword: skill,
          category: 'technical',
          relevance: 0.9,
        });
      }
    });

    // Soft skills
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
    // Combine technical and soft skills for summary
    [...TECHNICAL_SKILLS[level].slice(0, 5), ...SOFT_SKILLS[level].slice(0, 3)].forEach(keyword => {
      if (!currentValue.toLowerCase().includes(keyword.toLowerCase())) {
        suggestions.push({
          keyword,
          category: keyword in TECHNICAL_SKILLS[level] ? 'technical' : 'soft',
          relevance: 0.85,
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
 * Get missing keywords based on experience level
 */
export function getMissingKeywords(
  experienceLevel: ExperienceLevel | undefined,
  currentSkills: string[],
  currentText: string = ''
): string[] {
  const level = experienceLevel || 'mid';
  const allText = [...currentSkills, currentText].join(' ').toLowerCase();
  const recommended = [...TECHNICAL_SKILLS[level], ...SOFT_SKILLS[level]];

  return recommended.filter(
    keyword => !allText.includes(keyword.toLowerCase())
  ).slice(0, 10);
}

