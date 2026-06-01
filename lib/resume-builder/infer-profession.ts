/**
 * Single source of truth for inferring profession/role from parsed resume form data.
 * Used by import transformer, suggestion context, and optimization provider.
 */

export interface InferProfessionInput {
  jobTitle?: string;
  title?: string;
  headline?: string;
  designation?: string;
  profession?: string;
  summary?: string;
  skills?: string[];
  experience?: unknown[];
}

const NEUTRAL_FALLBACK = 'Professional';

type ProfessionRule = {
  label: string;
  patterns: RegExp[];
};

const PROFESSION_RULES: ProfessionRule[] = [
  {
    label: 'Makeup Artist',
    patterns: [
      /\bmakeup\b/i,
      /\bbeauty\b/i,
      /\bbridal\b/i,
      /\bcosmet/i,
      /\bsalon\b/i,
      /\besthetic/i,
      /\bhairstyl/i,
      /\bairbrush\b/i,
    ],
  },
  {
    label: 'Teacher',
    patterns: [
      /\bteacher\b/i,
      /\bteaching\b/i,
      /\beducator\b/i,
      /\btutor\b/i,
      /\bcurriculum\b/i,
      /\bclassroom\b/i,
      /\bacademic coordinator\b/i,
      /\blecturer\b/i,
    ],
  },
  {
    label: 'Accountant',
    patterns: [
      /\baccountant\b/i,
      /\baccounting\b/i,
      /\bbookkeep/i,
      /\btaxation\b/i,
      /\bfinancial analyst\b/i,
      /\baudit/i,
      /\bgst\b/i,
      /\btally\b/i,
    ],
  },
  {
    label: 'Nurse',
    patterns: [
      /\bnurse\b/i,
      /\bnursing\b/i,
      /\bpatient care\b/i,
      /\bmedical officer\b/i,
      /\bclinical\b/i,
      /\bhealthcare\b/i,
    ],
  },
  {
    label: 'Sales Executive',
    patterns: [
      /\bsales executive\b/i,
      /\bsales manager\b/i,
      /\bbusiness development\b/i,
      /\blead generation\b/i,
      /\brevenue\b/i,
      /\baccount executive\b/i,
    ],
  },
  {
    label: 'Software Developer',
    patterns: [
      /\bsoftware developer\b/i,
      /\bsoftware engineer\b/i,
      /\bfull stack\b/i,
      /\bfrontend developer\b/i,
      /\bbackend developer\b/i,
      /\breact\b/i,
      /\bnode\.?js\b/i,
      /\bjavascript\b/i,
      /\btypescript\b/i,
      /\bjava developer\b/i,
      /\bpython developer\b/i,
      /\bdevops\b/i,
    ],
  },
  {
    label: 'Data Analyst',
    patterns: [/\bdata analyst\b/i, /\bbusiness analyst\b/i, /\bdata science\b/i, /\banalytics\b/i],
  },
  {
    label: 'Marketing Manager',
    patterns: [/\bmarketing manager\b/i, /\bdigital marketing\b/i, /\bseo\b/i, /\bbrand manager\b/i],
  },
  {
    label: 'HR Executive',
    patterns: [/\bhr executive\b/i, /\bhuman resources\b/i, /\brecruiter\b/i, /\btalent acquisition\b/i],
  },
  {
    label: 'Graphic Designer',
    patterns: [/\bgraphic designer\b/i, /\bui\/ux\b/i, /\bvisual designer\b/i],
  },
];

function collectExperienceText(experience: unknown[]): string {
  const parts: string[] = [];
  for (const row of experience.slice(0, 4)) {
    if (!row || typeof row !== 'object') continue;
    const e = row as Record<string, unknown>;
    for (const key of ['title', 'position', 'Position', 'role', 'company', 'description', 'Description']) {
      const v = String(e[key] || '').trim();
      if (v) parts.push(v);
    }
  }
  return parts.join(' ');
}

function scoreProfession(text: string, rule: ProfessionRule): number {
  let score = 0;
  for (const p of rule.patterns) {
    if (p.test(text)) score += 2;
  }
  return score;
}

/**
 * Infer the most likely profession from resume fields (keyword scoring).
 * Returns explicit jobTitle when present; otherwise best match or "Professional".
 */
export function inferProfessionFromResume(input: InferProfessionInput): string {
  const explicit = String(
    input.jobTitle || input.title || input.headline || input.designation || input.profession || ''
  ).trim();
  if (explicit) return explicit;

  const summary = String(input.summary || '');
  const skillsText = (input.skills || []).join(' ');
  const experienceText = collectExperienceText(input.experience || []);
  const corpus = `${summary} ${skillsText} ${experienceText}`.trim();

  if (!corpus) return NEUTRAL_FALLBACK;

  let best = { label: NEUTRAL_FALLBACK, score: 0 };
  for (const rule of PROFESSION_RULES) {
    const score = scoreProfession(corpus, rule);
    if (score > best.score) {
      best = { label: rule.label, score };
    }
  }

  return best.score > 0 ? best.label : NEUTRAL_FALLBACK;
}

/** Map resume builder formData → infer input (no duplicate field lists elsewhere). */
export function resumeFormToInferInput(formData: Record<string, unknown>): InferProfessionInput {
  const skills = Array.isArray(formData.skills)
    ? (formData.skills as unknown[]).map((s) => String(s)).filter(Boolean)
    : [];

  return {
    jobTitle: String(formData.jobTitle || ''),
    title: String(formData.title || ''),
    headline: String(formData.headline || ''),
    designation: String(formData.designation || ''),
    profession: String(formData.profession || ''),
    summary: String(formData.summary || formData.bio || formData.objective || ''),
    skills,
    experience: Array.isArray(formData.experience) ? formData.experience : [],
  };
}

/** Resolved role for suggestions: explicit form title, else override, else inferred. */
export function resolveProfessionForSuggestions(
  formData: Record<string, unknown>,
  resolvedRoleOverride?: string
): string {
  const fromForm = String(formData.jobTitle || formData.title || '').trim();
  if (fromForm) return fromForm;
  const override = String(resolvedRoleOverride || '').trim();
  if (override) return override;
  return inferProfessionFromResume(resumeFormToInferInput(formData));
}

export function isTechnologyProfession(role: string): boolean {
  return /developer|engineer|software|programmer|devops|data scientist|full stack/i.test(role);
}
