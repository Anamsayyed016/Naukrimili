/**
 * Technology mention detection within an experience block.
 */

const TECHNOLOGY_LEXICON = [
  'Python', 'Django', 'Flask', 'FastAPI', 'React', 'React.js', 'Next.js', 'Node.js', 'Node',
  'TypeScript', 'JavaScript', 'Java', 'Spring', 'Spring Boot', 'Kotlin', 'Go', 'Golang', 'Rust',
  'C#', '.NET', 'ASP.NET', 'PHP', 'Laravel', 'Ruby', 'Rails', 'Swift', 'Objective-C',
  'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'K8s', 'Terraform',
  'Redis', 'Kafka', 'RabbitMQ', 'PostgreSQL', 'MySQL', 'MongoDB', 'DynamoDB', 'Elasticsearch',
  'GraphQL', 'REST', 'gRPC', 'Microservices', 'CI/CD', 'Jenkins', 'GitHub Actions', 'GitLab CI',
  'Angular', 'Vue', 'Vue.js', 'Svelte', 'Tailwind', 'Bootstrap', 'HTML', 'CSS', 'SASS',
  'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Spark', 'Hadoop', 'Airflow', 'dbt',
  'Linux', 'Nginx', 'Apache', 'Jest', 'Cypress', 'Selenium', 'JUnit', 'Pytest',
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const TECH_PATTERNS = TECHNOLOGY_LEXICON.map((tech) => ({
  tech,
  re: new RegExp(`\\b${escapeRegex(tech)}\\b`, 'i'),
}));

export function extractTechnologiesFromText(text: string): string[] {
  if (!text || !text.trim()) return [];
  const found = new Set<string>();
  for (const { tech, re } of TECH_PATTERNS) {
    if (re.test(text)) found.add(tech);
  }
  return [...found].sort((a, b) => a.localeCompare(b));
}

export function extractTechnologiesFromBlock(
  description: string,
  bulletPoints: string[]
): string[] {
  const combined = [description, ...bulletPoints].join('\n');
  return extractTechnologiesFromText(combined);
}
