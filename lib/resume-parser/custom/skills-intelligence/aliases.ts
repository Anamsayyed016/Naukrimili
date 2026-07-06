/**
 * Skill alias normalization — extends production canonicalizer with local aliases.
 */

import { canonicalizeSkillName } from '@/lib/resume-parser/import-sanitize';

/** Additional aliases not yet in import-sanitize SKILL_CANONICAL_ALIASES. */
const EXTENDED_ALIASES: Record<string, string> = {
  py: 'Python',
  python3: 'Python',
  'python 3': 'Python',
  js: 'JavaScript',
  expressjs: 'Express.js',
  'express js': 'Express.js',
  express: 'Express.js',
  next: 'Next.js',
  nextjs: 'Next.js',
  'next js': 'Next.js',
  reactjs: 'React',
  'react js': 'React',
  nodejs: 'Node.js',
  'node js': 'Node.js',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  git: 'Git',
  firebase: 'Firebase',
  aws: 'AWS',
  'rest api': 'REST API',
  mysql: 'MySQL',
  html: 'HTML',
  css: 'CSS',
  tailwind: 'Tailwind CSS',
  tailwindcss: 'Tailwind CSS',
  'tailwind css': 'Tailwind CSS',
  postgres: 'PostgreSQL',
  postgresql: 'PostgreSQL',
  mongo: 'MongoDB',
  k8s: 'Kubernetes',
  golang: 'Go',
  tf: 'TensorFlow',
  pytorch: 'PyTorch',
  scikitlearn: 'Scikit-learn',
  'scikit learn': 'Scikit-learn',
  ml: 'Machine Learning',
  'machine learning': 'Machine Learning',
  ai: 'Artificial Intelligence',
  'artificial intelligence': 'Artificial Intelligence',
  cicd: 'CI/CD',
  'ci/cd': 'CI/CD',
  'ci cd': 'CI/CD',
  vscode: 'VS Code',
  'vs code': 'VS Code',
};

const PLURAL_EQUIVALENTS: Record<string, string> = {
  containers: 'Docker',
  microservices: 'Microservices',
};

export function normalizeSkillAlias(raw: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';

  const fromProduction = canonicalizeSkillName(trimmed);
  const key = fromProduction.toLowerCase().replace(/\s+/g, ' ').trim();

  if (EXTENDED_ALIASES[key]) return EXTENDED_ALIASES[key];
  if (PLURAL_EQUIVALENTS[key]) return PLURAL_EQUIVALENTS[key];

  if (key.endsWith('js') && key.length > 2 && !key.includes('.')) {
    const base = key.slice(0, -2);
    if (EXTENDED_ALIASES[base]) return EXTENDED_ALIASES[base];
  }

  return fromProduction;
}

export function skillDedupeKey(name: string): string {
  return normalizeSkillAlias(name).toLowerCase().replace(/\s+/g, ' ').trim();
}
