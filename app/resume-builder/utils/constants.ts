/**
 * Resume Builder Constants
 */

export const TEMPLATE_OPTIONS = [
  {
    id: 'modern' as const,
    name: 'Modern',
    description: 'Clean, contemporary design perfect for tech and creative roles',
    preview: '/templates/modern-preview.png',
  },
  {
    id: 'minimal' as const,
    name: 'Minimal',
    description: 'Simple and elegant, ideal for all industries',
    preview: '/templates/minimal-preview.png',
  },
  {
    id: 'corporate' as const,
    name: 'Corporate',
    description: 'Professional and traditional, best for finance and business',
    preview: '/templates/corporate-preview.png',
  },
  {
    id: 'creative' as const,
    name: 'Creative',
    description: 'Bold and artistic, perfect for design and marketing roles',
    preview: '/templates/creative-preview.png',
  },
  {
    id: 'fresher-friendly' as const,
    name: 'Fresher-Friendly',
    description: 'Optimized for new graduates and entry-level positions',
    preview: '/templates/fresher-preview.png',
  },
  {
    id: 'executive' as const,
    name: 'Executive',
    description: 'Sophisticated design for leadership and senior roles',
    preview: '/templates/executive-preview.png',
  },
] as const;

export const EXPERIENCE_LEVELS = [
  { value: 'fresher', label: 'Fresher / New Graduate', description: 'No professional experience' },
  { value: 'entry', label: 'Entry Level (0-2 years)', description: 'Some internship or junior experience' },
  { value: 'mid', label: 'Mid Level (2-5 years)', description: 'Moderate professional experience' },
  { value: 'senior', label: 'Senior Level (5-10 years)', description: 'Extensive professional experience' },
  { value: 'executive', label: 'Executive (10+ years)', description: 'Leadership and management experience' },
] as const;

export const COLOR_SCHEMES = [
  { value: 'blue', label: 'Blue', class: 'text-blue-600' },
  { value: 'green', label: 'Green', class: 'text-green-600' },
  { value: 'purple', label: 'Purple', class: 'text-purple-600' },
  { value: 'gray', label: 'Gray', class: 'text-gray-600' },
  { value: 'navy', label: 'Navy', class: 'text-blue-800' },
  { value: 'teal', label: 'Teal', class: 'text-teal-600' },
] as const;

export const ACTION_VERBS = [
  'Achieved', 'Managed', 'Led', 'Developed', 'Implemented', 'Created', 'Designed',
  'Improved', 'Increased', 'Reduced', 'Optimized', 'Launched', 'Built', 'Established',
  'Collaborated', 'Coordinated', 'Executed', 'Streamlined', 'Transformed', 'Delivered'
];

export const COMMON_SKILLS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'AWS', 'Docker',
  'TypeScript', 'MongoDB', 'Express.js', 'HTML/CSS', 'REST APIs', 'Agile',
  'Problem Solving', 'Communication', 'Teamwork', 'Leadership', 'Project Management'
];

