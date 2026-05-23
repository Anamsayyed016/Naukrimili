/**
 * Lightweight JD semantic extraction for inline resume suggestions (no separate AI call).
 */

export interface ParsedJobDescription {
  raw: string;
  skills: string[];
  technologies: string[];
  responsibilities: string[];
  atsKeywords: string[];
  actionVerbs: string[];
  seniority: string;
  industry: string;
  roleHints: string[];
}

const TECH_PATTERNS: RegExp[] = [
  /\b(React(?:\.js)?|Next\.js|Vue(?:\.js)?|Angular|Node\.js|Express(?:\.js)?)\b/gi,
  /\b(Python|Java(?:Script)?|TypeScript|Go|Golang|Rust|C\+\+|C#|PHP|Ruby|Swift|Kotlin)\b/gi,
  /\b(PostgreSQL|MySQL|MongoDB|Redis|DynamoDB|Elasticsearch|Firebase)\b/gi,
  /\b(AWS|Azure|GCP|Google Cloud|Docker|Kubernetes|Terraform|CI\/CD|Jenkins)\b/gi,
  /\b(REST(?:ful)? APIs?|GraphQL|gRPC|Microservices|Kafka|RabbitMQ)\b/gi,
  /\b(Machine Learning|Deep Learning|TensorFlow|PyTorch|NLP|Computer Vision)\b/gi,
  /\b(Agile|Scrum|DevOps|TDD|Jest|Cypress|Selenium)\b/gi,
  /\b(Figma|Sketch|Adobe XD|SEO|Google Analytics|Salesforce|SAP)\b/gi,
];

const ACTION_VERBS = [
  'develop', 'built', 'build', 'design', 'implement', 'lead', 'manage', 'optimize',
  'improve', 'deliver', 'create', 'architect', 'automate', 'integrate', 'deploy',
  'maintain', 'collaborate', 'analyze', 'drive', 'scale', 'mentor',
];

const SENIORITY_RULES: { pattern: RegExp; label: string }[] = [
  { pattern: /\b(senior|sr\.?|lead|principal|staff|architect)\b/i, label: 'senior' },
  { pattern: /\b(junior|jr\.?|entry[- ]?level|graduate|fresher|intern)\b/i, label: 'entry' },
  { pattern: /\b(mid[- ]?level|intermediate)\b/i, label: 'mid' },
  { pattern: /\b(\d+\+?\s*years?)\b/i, label: 'experienced' },
];

const INDUSTRY_RULES: { pattern: RegExp; label: string }[] = [
  { pattern: /\b(fintech|finance|banking|insurance)\b/i, label: 'Finance' },
  { pattern: /\b(healthcare|medical|pharma)\b/i, label: 'Healthcare' },
  { pattern: /\b(e[- ]?commerce|retail|marketplace)\b/i, label: 'E-commerce' },
  { pattern: /\b(edtech|education|learning)\b/i, label: 'Education' },
  { pattern: /\b(saas|b2b|enterprise)\b/i, label: 'SaaS' },
  { pattern: /\b(recruit|hiring|hr|talent|ats)\b/i, label: 'Recruitment' },
];

function uniqueStrings(items: string[], max = 24): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const s = raw.trim();
    if (!s || s.length < 2) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

function extractTechTerms(text: string): string[] {
  const found: string[] = [];
  for (const pattern of TECH_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) found.push(...matches.map((m) => m.trim()));
  }
  return found;
}

function extractResponsibilities(text: string): string[] {
  const chunks = text
    .split(/[\n•\-*;]+|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.length < 280);

  const withVerbs = chunks.filter((c) =>
    ACTION_VERBS.some((v) => new RegExp(`\\b${v}\\b`, 'i').test(c))
  );

  return uniqueStrings(withVerbs.length ? withVerbs : chunks.slice(0, 8), 10);
}

function inferSeniority(text: string): string {
  for (const { pattern, label } of SENIORITY_RULES) {
    if (pattern.test(text)) return label;
  }
  return 'experienced';
}

function inferIndustry(text: string): string {
  for (const { pattern, label } of INDUSTRY_RULES) {
    if (pattern.test(text)) return label;
  }
  return '';
}

function inferRoleHints(text: string): string[] {
  const hints: string[] = [];
  const roleMatch = text.match(
    /\b((?:senior |lead |principal )?(?:software|full[- ]?stack|front[- ]?end|back[- ]?end|data|devops|mobile|cloud|ml|ai)[\w\s]{0,30}(?:engineer|developer|architect|analyst|scientist))\b/gi
  );
  if (roleMatch) hints.push(...roleMatch.map((m) => m.trim()));
  return uniqueStrings(hints, 4);
}

/** Comma / "and" separated skill lists in JD */
function extractListedSkills(text: string): string[] {
  const listed: string[] = [];
  const listPatterns = [
    /(?:skills?|technologies?|tech stack|must have|requirements?)[:;]?\s*([^.!\n]{10,200})/gi,
    /(?:experience with|proficient in|knowledge of)\s+([^.!\n]{8,120})/gi,
  ];
  for (const pattern of listPatterns) {
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      const segment = m[1];
      segment.split(/[,;/]|(?:\s+and\s+)/i).forEach((part) => {
        const t = part.trim();
        if (t.length >= 2 && t.length <= 40) listed.push(t);
      });
    }
  }
  return listed;
}

export function parseJobDescription(jobDescription: string): ParsedJobDescription | null {
  const raw = (jobDescription || '').trim();
  if (raw.length < 40) return null;

  const technologies = extractTechTerms(raw);
  const listed = extractListedSkills(raw);
  const skills = uniqueStrings([...technologies, ...listed], 20);
  const responsibilities = extractResponsibilities(raw);
  const actionVerbs = uniqueStrings(
    ACTION_VERBS.filter((v) => new RegExp(`\\b${v}\\b`, 'i').test(raw)).map(
      (v) => v.charAt(0).toUpperCase() + v.slice(1)
    ),
    12
  );

  const atsKeywords = uniqueStrings(
    [
      ...skills,
      ...actionVerbs.slice(0, 6),
      ...responsibilities
        .flatMap((r) => extractTechTerms(r))
        .slice(0, 8),
    ],
    20
  );

  return {
    raw: raw.slice(0, 4000),
    skills,
    technologies: uniqueStrings(technologies, 16),
    responsibilities,
    atsKeywords,
    actionVerbs,
    seniority: inferSeniority(raw),
    industry: inferIndustry(raw),
    roleHints: inferRoleHints(raw),
  };
}
