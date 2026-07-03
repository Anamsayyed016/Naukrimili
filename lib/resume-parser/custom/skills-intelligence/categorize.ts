/**
 * Semantic skill categorization.
 */

import type { SkillCategory } from './types';

interface CategoryRule {
  category: SkillCategory;
  patterns: RegExp[];
  confidence: number;
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'Programming Languages',
    patterns: [
      /^(python|javascript|typescript|java|kotlin|swift|go|golang|rust|c\+\+|c#|ruby|php|scala|r|matlab|perl|dart|objective-c)$/i,
      /\b(programming language)\b/i,
    ],
    confidence: 90,
  },
  {
    category: 'Frameworks',
    patterns: [
      /\b(react|angular|vue|django|flask|fastapi|spring|laravel|rails|next\.js|express\.js|nest\.js|\.net|asp\.net)\b/i,
    ],
    confidence: 88,
  },
  {
    category: 'Libraries',
    patterns: [/\b(pandas|numpy|redux|jquery|lodash|axios|tailwind css)\b/i],
    confidence: 82,
  },
  {
    category: 'Databases',
    patterns: [
      /\b(postgresql|mysql|mongodb|redis|dynamodb|elasticsearch|cassandra|sqlite|oracle db|mariadb|firebase)\b/i,
      /\b(database|sql|nosql)\b/i,
    ],
    confidence: 88,
  },
  {
    category: 'Cloud',
    patterns: [/\b(aws|azure|gcp|google cloud|cloud computing|s3|ec2|lambda)\b/i],
    confidence: 88,
  },
  {
    category: 'DevOps',
    patterns: [
      /\b(docker|kubernetes|k8s|terraform|ansible|jenkins|ci\/cd|github actions|gitlab ci|helm|argocd)\b/i,
    ],
    confidence: 86,
  },
  {
    category: 'Operating Systems',
    patterns: [/\b(linux|unix|windows server|ubuntu|centos|macos)\b/i],
    confidence: 84,
  },
  {
    category: 'Testing',
    patterns: [/\b(jest|cypress|selenium|junit|pytest|mocha|playwright|unit testing|tdd)\b/i],
    confidence: 84,
  },
  {
    category: 'Mobile',
    patterns: [/\b(react native|flutter|android|ios|swiftui|kotlin multiplatform|xamarin)\b/i],
    confidence: 85,
  },
  {
    category: 'AI',
    patterns: [/\b(tensorflow|pytorch|machine learning|deep learning|nlp|computer vision|llm|openai)\b/i],
    confidence: 86,
  },
  {
    category: 'Data Science',
    patterns: [/\b(pandas|numpy|scikit-learn|spark|hadoop|tableau|power bi|data analysis|statistics)\b/i],
    confidence: 84,
  },
  {
    category: 'Version Control',
    patterns: [/\b(git|github|gitlab|bitbucket|svn|mercurial)\b/i],
    confidence: 90,
  },
  {
    category: 'Soft Skills',
    patterns: [
      /\b(communication|leadership|teamwork|problem solving|critical thinking|time management|adaptability|collaboration|negotiation|presentation|analytics|reporting)\b/i,
      /\b(classroom management|lesson planning|curriculum design|patient care|financial analysis|case management|conflict resolution|stakeholder management|lead generation)\b/i,
    ],
    confidence: 80,
  },
  {
    category: 'Office Tools',
    patterns: [
      /\b(excel|word|powerpoint|power bi|google sheets|ms office|sharepoint|outlook|tally|quickbooks)\b/i,
      /\b(sap|gst|emr|auditing|bookkeeping|payroll)\b/i,
    ],
    confidence: 82,
  },
];

export function categorizeSkill(name: string): { category: SkillCategory; confidence: number } {
  const normalized = name.trim();
  if (!normalized) return { category: 'Other', confidence: 0 };

  let best: { category: SkillCategory; confidence: number } = {
    category: 'Other',
    confidence: 40,
  };

  for (const rule of CATEGORY_RULES) {
    for (const re of rule.patterns) {
      if (re.test(normalized)) {
        if (rule.confidence > best.confidence) {
          best = { category: rule.category, confidence: rule.confidence };
        }
      }
    }
  }

  return best;
}
