/**
 * Technology detection scoped to a single project block.
 */

const TECHNOLOGY_LEXICON = [
  'React', 'React.js', 'ReactJS', 'Next.js', 'Vue', 'Vue.js', 'Angular', 'Svelte',
  'Python', 'Django', 'Flask', 'FastAPI', 'Node.js', 'Node', 'Express',
  'TypeScript', 'JavaScript', 'Java', 'Spring Boot', 'Spring', 'Kotlin', 'Go', 'Golang',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Kafka', 'Docker', 'AWS', 'Azure', 'GCP',
  'Firebase', 'Git', 'Tailwind CSS', 'Tailwind', 'Bootstrap', 'HTML', 'CSS', 'SASS',
  'GraphQL', 'REST', 'REST API', 'Microservices', 'Kubernetes', 'Terraform',
  'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Spark',
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const TECH_PATTERNS = TECHNOLOGY_LEXICON.map((tech) => ({
  tech,
  re: new RegExp(`\\b${escapeRegex(tech)}\\b`, 'i'),
}));

const TECH_STACK_LINE_RE =
  /^(?:tech(?:nologies)?|stack|tools?|built\s+with)\s*[:–-]\s*(.+)$/i;

const NARRATIVE_TECH_RE =
  /\b(?:built|developed|implemented|created|designed|using|with|via|through)\b[^.]{0,80}\b(?:with|using)\s+(.+)$/i;

function extractFromNarrative(text: string): string[] {
  const found: string[] = [];
  const match = text.match(NARRATIVE_TECH_RE);
  if (!match?.[1]) return found;

  const payload = match[1].replace(/[.!?]+$/, '').trim();
  const parts = payload.split(/\s+and\s+|,/i).map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const lex = TECH_PATTERNS.find(({ re }) => re.test(part));
    if (lex) found.push(lex.tech);
    else if (part.length >= 2 && part.length <= 30 && /^[A-Za-z0-9.#+\s-]+$/.test(part)) {
      found.push(part);
    }
  }
  return found;
}

export function parseExplicitTechLine(text: string): string[] {
  const trimmed = text.trim();
  if (/(?:github|gitlab|bitbucket)\.com/i.test(trimmed)) return [];
  const labeled = trimmed.match(TECH_STACK_LINE_RE);
  const payload = labeled?.[1] || trimmed;
  const parts = payload.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return [];

  const techLike = parts.every(
    (p) =>
      p.length <= 40 &&
      /^[A-Za-z0-9.#+\s()-]+$/.test(p) &&
      !/(?:github|gitlab|bitbucket)\.com/i.test(p)
  );
  return techLike ? parts : [];
}

export function extractTechnologiesFromText(text: string): string[] {
  if (!text?.trim()) return [];
  const scrubbed = text
    .replace(/(?:https?:\/\/)?(?:www\.)?(?:github|gitlab|bitbucket)\.com\/\S+/gi, ' ')
    .replace(/https?:\/\/\S+/gi, ' ');
  const found = new Set<string>();

  for (const { tech, re } of TECH_PATTERNS) {
    if (re.test(scrubbed)) found.add(tech);
  }

  for (const tech of extractFromNarrative(scrubbed)) {
    found.add(tech);
  }

  for (const part of parseExplicitTechLine(scrubbed)) {
    if (/\.com\b|https?:|\/\w+\//i.test(part)) continue;
    const match = TECH_PATTERNS.find(({ re }) => re.test(part));
    if (match) found.add(match.tech);
  }

  return [...found].sort((a, b) => a.localeCompare(b));
}

export function extractTechnologiesFromBlock(
  headerText: string,
  description: string,
  achievements: string[]
): string[] {
  const combined = [headerText, description, ...achievements].join('\n');
  const fromLexicon = extractTechnologiesFromText(combined);

  const commaLine = combined
    .split('\n')
    .flatMap((line) => parseExplicitTechLine(line));

  const merged = new Set([...fromLexicon, ...commaLine]);
  return [...merged].sort((a, b) => a.localeCompare(b));
}

export function lineHasTechStackSignal(text: string): boolean {
  return parseExplicitTechLine(text).length >= 2 || TECH_STACK_LINE_RE.test(text.trim());
}
