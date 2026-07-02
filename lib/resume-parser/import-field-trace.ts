/**
 * TEMPORARY field-loss tracing for resume import pipeline.
 * Enable with IMPORT_FIELD_TRACE=1 (server env).
 * Logs only — does not modify data or parser logic.
 */

export type ImportTraceStageName =
  | '1_affinda_output'
  | '2_apilayer_output'
  | '3_hybrid_parser_output'
  | '4_text_recovery_output'
  | '5_merge_resume_data'
  | '6_normalize_extracted_resume_data'
  | '7_map_extracted_to_upload_profile'
  | '8_normalize_upload_profile'
  | '9_validate_and_repair_resume_extraction'
  | '10_reconcile_experience_header_fields'
  | '11_sanitize_experience_entry'
  | '12_sanitize_project_entry'
  | '13_normalize_skills_list'
  | '14_transform_import_data_to_builder'
  | '15_builder_form_data'
  | '16_template_render_input';

export function isImportFieldTraceEnabled(): boolean {
  const v = process.env.IMPORT_FIELD_TRACE;
  return v === '1' || v === 'true' || v === 'yes';
}

type ExperienceRow = {
  index: number;
  company: string;
  title: string;
  location: string;
  descriptionLength: number;
  achievementsCount: number;
  startDate: string;
  endDate: string;
  parserSource: string;
};

type ProjectRow = {
  name: string;
  description: string;
  technologies: string;
  parserSource: string;
};

type SkillRow = {
  skill: string;
  confidence: number;
  accepted: boolean;
  rejected: boolean;
  reason: string;
};

type FieldSnapshot = {
  fullName: string;
  headline: string;
  summary: string;
  skills: string[];
  languages: string[];
  educationCount: number;
  certificationsCount: number;
  projectsCount: number;
  experienceCount: number;
  experiences: ExperienceRow[];
  projects: ProjectRow[];
};

type StageRecord = {
  stage: ImportTraceStageName | string;
  parserSource: string;
  incoming: FieldSnapshot;
  outgoing: FieldSnapshot;
  dropped: string[];
  modified: string[];
  empty: string[];
  recovered: string[];
  experiences: ExperienceRow[];
  projects: ProjectRow[];
  skills: SkillRow[];
  notes: string[];
};

const TRACKED_SCALARS = [
  'fullName',
  'headline',
  'summary',
] as const;

const TRACKED_LISTS = [
  'skills',
  'languages',
  'education',
  'certifications',
  'projects',
  'experience',
] as const;

let activeReqId = 'unknown';
const stageHistory: StageRecord[] = [];
let lastSnapshot: FieldSnapshot | null = null;
const lossEvents: Array<{
  field: string;
  firstSeenAt: string;
  lostAt: string;
  functionName: string;
  condition: string;
  parserSource: string;
  overwrittenBy: string;
}> = [];

function preview(text: string, max = 120): string {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (!s) return '(empty)';
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function readString(data: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = data[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function readStringList(data: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const v = data[key];
    if (!Array.isArray(v)) continue;
    return v
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') {
          const rec = item as Record<string, unknown>;
          return String(rec.name ?? rec.language ?? rec.skill ?? rec.title ?? '').trim();
        }
        return '';
      })
      .filter(Boolean);
  }
  return [];
}

function readExperiences(data: Record<string, unknown>, parserSource: string): ExperienceRow[] {
  const list = (data.experience ??
    data.workExperience ??
    data['Work Experience'] ??
    data.Experience ??
    []) as unknown[];
  if (!Array.isArray(list)) return [];
  return list
    .filter((e) => e && typeof e === 'object')
    .map((e, index) => {
      const row = e as Record<string, unknown>;
      const achievements = Array.isArray(row.achievements) ? row.achievements : [];
      const description = String(row.description ?? row.Description ?? '');
      return {
        index,
        company: readString(row, ['company', 'Company', 'organization', 'Organization', 'employer', 'Employer']),
        title: readString(row, ['title', 'Title', 'position', 'Position', 'designation', 'job_title', 'jobTitle']),
        location: readString(row, ['location', 'Location']),
        descriptionLength: description.trim().length,
        achievementsCount: achievements.length,
        startDate: readString(row, ['startDate', 'start_date', 'StartDate']),
        endDate: readString(row, ['endDate', 'end_date', 'EndDate']),
        parserSource,
      };
    });
}

function readProjects(data: Record<string, unknown>, parserSource: string): ProjectRow[] {
  const list = (data.projects ?? data.Projects ?? []) as unknown[];
  if (!Array.isArray(list)) return [];
  return list
    .filter((p) => p && typeof p === 'object')
    .map((p) => {
      const row = p as Record<string, unknown>;
      const tech = row.technologies ?? row.Technologies ?? row.tech_stack ?? row.techStack ?? '';
      return {
        name: readString(row, ['name', 'title', 'projectName', 'ProjectName']),
        description: preview(String(row.description ?? row.Description ?? row.summary ?? ''), 200),
        technologies: Array.isArray(tech)
          ? tech.map((t) => String(t)).join(', ')
          : String(tech || ''),
        parserSource,
      };
    });
}

export function snapshotImportFields(data: unknown, parserSource = 'unknown'): FieldSnapshot {
  const rec =
    data && typeof data === 'object' ? (data as Record<string, unknown>) : ({} as Record<string, unknown>);

  const fullName = readString(rec, ['fullName', 'name', 'Name', 'full_name']) ||
    [readString(rec, ['firstName']), readString(rec, ['lastName'])].filter(Boolean).join(' ');

  const headline = readString(rec, [
    'headline',
    'jobTitle',
    'job_title',
    'designation',
    'profession',
    'title',
    'preferredJobType',
    'currentTitle',
  ]);

  const summary = readString(rec, ['summary', 'bio', 'objective', 'Summary', 'professional_summary']);

  const skills = readStringList(rec, ['skills', 'Skills', 'technicalSkills']);
  const languages = readStringList(rec, ['languages', 'Languages']);

  const education = rec.education ?? rec.Education;
  const certifications = rec.certifications ?? rec.Certifications;
  const projects = rec.projects ?? rec.Projects;
  const experience = rec.experience ?? rec.workExperience ?? rec['Work Experience'];

  return {
    fullName,
    headline,
    summary,
    skills,
    languages,
    educationCount: Array.isArray(education) ? education.length : 0,
    certificationsCount: Array.isArray(certifications) ? certifications.length : 0,
    projectsCount: Array.isArray(projects) ? projects.length : 0,
    experienceCount: Array.isArray(experience) ? experience.length : 0,
    experiences: readExperiences(rec, parserSource),
    projects: readProjects(rec, parserSource),
  };
}

function diffSnapshots(
  before: FieldSnapshot,
  after: FieldSnapshot,
  stage: string
): { dropped: string[]; modified: string[]; empty: string[]; recovered: string[] } {
  const dropped: string[] = [];
  const modified: string[] = [];
  const empty: string[] = [];
  const recovered: string[] = [];

  const scalarPairs: Array<[keyof FieldSnapshot, string]> = [
    ['fullName', 'Full Name'],
    ['headline', 'Headline'],
    ['summary', 'Summary'],
  ];

  for (const [key, label] of scalarPairs) {
    const b = String(before[key] || '').trim();
    const a = String(after[key] || '').trim();
    if (b && !a) {
      dropped.push(label);
      lossEvents.push({
        field: label,
        firstSeenAt: lastSnapshot ? 'prior_stage' : stage,
        lostAt: stage,
        functionName: stage,
        condition: 'scalar emptied',
        parserSource: 'n/a',
        overwrittenBy: 'n/a',
      });
    } else if (!b && a) {
      recovered.push(label);
    } else if (b && a && b !== a) {
      modified.push(label);
    } else if (!a) {
      empty.push(label);
    }
  }

  const listPairs: Array<[keyof FieldSnapshot, string]> = [
    ['skills', 'Skills'],
    ['languages', 'Languages'],
  ];

  for (const [key, label] of listPairs) {
    const b = before[key] as string[];
    const a = after[key] as string[];
    if (b.length > 0 && a.length === 0) {
      dropped.push(label);
      lossEvents.push({
        field: label,
        firstSeenAt: 'prior_stage',
        lostAt: stage,
        functionName: stage,
        condition: 'list emptied',
        parserSource: 'n/a',
        overwrittenBy: 'n/a',
      });
    } else if (b.length === 0 && a.length > 0) {
      recovered.push(label);
    } else if (b.length > 0 && a.length > 0 && b.length !== a.length) {
      modified.push(`${label} (${b.length}→${a.length})`);
    } else if (a.length === 0) {
      empty.push(label);
    }
  }

  const countPairs: Array<[keyof FieldSnapshot, string]> = [
    ['educationCount', 'Education'],
    ['certificationsCount', 'Certifications'],
    ['projectsCount', 'Projects'],
    ['experienceCount', 'Experience'],
  ];

  for (const [key, label] of countPairs) {
    const b = before[key] as number;
    const a = after[key] as number;
    if (b > 0 && a === 0) {
      dropped.push(label);
      lossEvents.push({
        field: label,
        firstSeenAt: 'prior_stage',
        lostAt: stage,
        functionName: stage,
        condition: 'count dropped to zero',
        parserSource: 'n/a',
        overwrittenBy: 'n/a',
      });
    } else if (b === 0 && a > 0) {
      recovered.push(label);
    } else if (b > 0 && a > 0 && b !== a) {
      modified.push(`${label} (${b}→${a})`);
    } else if (a === 0) {
      empty.push(label);
    }
  }

  // Company / designation tracking across experiences
  const beforeCompanies = before.experiences.filter((e) => e.company).length;
  const afterCompanies = after.experiences.filter((e) => e.company).length;
  if (beforeCompanies > afterCompanies) {
    dropped.push(`Company Name (${beforeCompanies}→${afterCompanies})`);
    lossEvents.push({
      field: 'Company Name',
      firstSeenAt: 'prior_stage',
      lostAt: stage,
      functionName: stage,
      condition: 'experience company slots reduced',
      parserSource: 'n/a',
      overwrittenBy: 'n/a',
    });
  }

  const beforeTitles = before.experiences.filter((e) => e.title).length;
  const afterTitles = after.experiences.filter((e) => e.title).length;
  if (beforeTitles > afterTitles) {
    dropped.push(`Designation (${beforeTitles}→${afterTitles})`);
  }

  return { dropped, modified, empty, recovered };
}

function logStageRecord(record: StageRecord): void {
  const label = `[import-field-trace:${activeReqId}]`;
  console.log(`${label} ═══ STAGE: ${record.stage} ═══`);
  console.log(`${label} Parser Source: ${record.parserSource}`);
  console.log(`${label} Incoming:`, {
    fullName: preview(record.incoming.fullName, 80),
    headline: preview(record.incoming.headline, 80),
    summary: preview(record.incoming.summary, 100),
    skills: record.incoming.skills.length,
    languages: record.incoming.languages.length,
    education: record.incoming.educationCount,
    certifications: record.incoming.certificationsCount,
    projects: record.incoming.projectsCount,
    experience: record.incoming.experienceCount,
  });
  console.log(`${label} Outgoing:`, {
    fullName: preview(record.outgoing.fullName, 80),
    headline: preview(record.outgoing.headline, 80),
    summary: preview(record.outgoing.summary, 100),
    skills: record.outgoing.skills.length,
    languages: record.outgoing.languages.length,
    education: record.outgoing.educationCount,
    certifications: record.outgoing.certificationsCount,
    projects: record.outgoing.projectsCount,
    experience: record.outgoing.experienceCount,
  });
  console.log(`${label} Dropped fields:`, record.dropped.length ? record.dropped : '(none)');
  console.log(`${label} Modified fields:`, record.modified.length ? record.modified : '(none)');
  console.log(`${label} Empty fields:`, record.empty.length ? record.empty : '(none)');
  console.log(`${label} Recovered fields:`, record.recovered.length ? record.recovered : '(none)');
  if (record.notes.length) {
    console.log(`${label} Notes:`, record.notes);
  }

  if (record.experiences.length) {
    console.log(`${label} Experience rows:`);
    for (const exp of record.experiences) {
      console.log(
        `${label}   [${exp.index}] company="${preview(exp.company, 60)}" title="${preview(exp.title, 60)}" location="${preview(exp.location, 40)}" descLen=${exp.descriptionLength} achievements=${exp.achievementsCount} start="${exp.startDate}" end="${exp.endDate}" source=${exp.parserSource}`
      );
    }
  }

  if (record.projects.length) {
    console.log(`${label} Project rows:`);
    for (const proj of record.projects) {
      console.log(
        `${label}   name="${preview(proj.name, 80)}" desc="${proj.description}" tech="${preview(proj.technologies, 80)}" source=${proj.parserSource}`
      );
    }
  }

  if (record.skills.length) {
    console.log(`${label} Skill decisions (sample up to 40):`);
    for (const sk of record.skills.slice(0, 40)) {
      console.log(
        `${label}   skill="${sk.skill}" confidence=${sk.confidence} accepted=${sk.accepted} rejected=${sk.rejected} reason="${sk.reason}"`
      );
    }
    if (record.skills.length > 40) {
      console.log(`${label}   … ${record.skills.length - 40} more skills omitted from log`);
    }
  }
}

export function beginImportFieldTrace(reqId: string): void {
  if (!isImportFieldTraceEnabled()) return;
  activeReqId = reqId;
  stageHistory.length = 0;
  lossEvents.length = 0;
  lastSnapshot = null;
  console.log(`[import-field-trace:${reqId}] TRACE STARTED`);
}

/** Trace a stage where only outgoing data exists (e.g. parser output). */
export function traceImportStageOutput(
  stage: ImportTraceStageName | string,
  data: unknown,
  parserSource: string,
  notes: string[] = []
): void {
  if (!isImportFieldTraceEnabled()) return;
  const outgoing = snapshotImportFields(data, parserSource);
  const incoming = lastSnapshot ?? snapshotImportFields({}, parserSource);
  const { dropped, modified, empty, recovered } = diffSnapshots(incoming, outgoing, stage);

  const record: StageRecord = {
    stage,
    parserSource,
    incoming,
    outgoing,
    dropped,
    modified,
    empty,
    recovered,
    experiences: outgoing.experiences,
    projects: outgoing.projects,
    skills: [],
    notes,
  };
  stageHistory.push(record);
  lastSnapshot = outgoing;
  logStageRecord(record);
}

/** Trace a stage with explicit before/after payloads. */
export function traceImportStageTransform(
  stage: ImportTraceStageName | string,
  before: unknown,
  after: unknown,
  parserSource: string,
  notes: string[] = []
): void {
  if (!isImportFieldTraceEnabled()) return;
  const incoming = snapshotImportFields(before, parserSource);
  const outgoing = snapshotImportFields(after, parserSource);
  const { dropped, modified, empty, recovered } = diffSnapshots(incoming, outgoing, stage);

  const record: StageRecord = {
    stage,
    parserSource,
    incoming,
    outgoing,
    dropped,
    modified,
    empty,
    recovered,
    experiences: outgoing.experiences,
    projects: outgoing.projects,
    skills: [],
    notes,
  };
  stageHistory.push(record);
  lastSnapshot = outgoing;
  logStageRecord(record);
}

export function traceExperienceReconcile(
  index: number,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  parserSource: string
): void {
  if (!isImportFieldTraceEnabled()) return;
  const b = snapshotImportFields({ experience: [before] }, parserSource).experiences[0];
  const a = snapshotImportFields({ experience: [after] }, parserSource).experiences[0];
  if (!b || !a) return;

  const notes: string[] = [];
  if (b.company && !a.company) {
    notes.push(`company cleared (was "${preview(b.company, 60)}")`);
    lossEvents.push({
      field: 'Company Name',
      firstSeenAt: 'experience_row',
      lostAt: '10_reconcile_experience_header_fields',
      functionName: 'reconcileExperienceHeaderFields',
      condition: 'company failed plausibility or was location/title',
      parserSource,
      overwrittenBy: 'n/a',
    });
  }
  if (b.title && !a.title) notes.push(`title cleared (was "${preview(b.title, 60)}")`);
  if (!b.company && a.company) notes.push(`company recovered ("${preview(a.company, 60)}")`);
  if (b.location && !a.location) notes.push('location cleared');
  if (!b.location && a.location) notes.push(`location set ("${preview(a.location, 40)}")`);

  const label = `[import-field-trace:${activeReqId}]`;
  console.log(
    `${label} [10_reconcile] exp[${index}] company="${preview(a.company, 60)}" title="${preview(a.title, 60)}" loc="${preview(a.location, 40)}" descLen=${a.descriptionLength}`
  );
  if (notes.length) console.log(`${label} [10_reconcile] exp[${index}] notes:`, notes);
}

export function traceSanitizeExperienceDropped(
  index: number,
  input: Record<string, unknown>,
  reason: string,
  parserSource: string
): void {
  if (!isImportFieldTraceEnabled()) return;
  const row = snapshotImportFields({ experience: [input] }, parserSource).experiences[0];
  lossEvents.push({
    field: 'Experience',
    firstSeenAt: 'experience_row',
    lostAt: '11_sanitize_experience_entry',
    functionName: 'sanitizeExperienceEntry',
    condition: reason,
    parserSource,
    overwrittenBy: 'n/a',
  });
  console.log(
    `[import-field-trace:${activeReqId}] [11_sanitize] DROPPED exp[${index}] company="${row?.company || ''}" title="${row?.title || ''}" reason="${reason}"`
  );
}

export function traceSanitizeProjectDropped(
  index: number,
  input: unknown,
  reason: string,
  parserSource: string
): void {
  if (!isImportFieldTraceEnabled()) return;
  lossEvents.push({
    field: 'Projects',
    firstSeenAt: 'project_row',
    lostAt: '12_sanitize_project_entry',
    functionName: 'sanitizeProjectEntry',
    condition: reason,
    parserSource,
    overwrittenBy: 'n/a',
  });
  console.log(
    `[import-field-trace:${activeReqId}] [12_sanitize_project] DROPPED project[${index}] reason="${reason}" input=${JSON.stringify(input).slice(0, 120)}`
  );
}

export function traceSkillDecisions(
  input: unknown[],
  output: string[],
  scoreFn: (skill: string) => number,
  minConfidence: number,
  parserSource: string
): void {
  if (!isImportFieldTraceEnabled()) return;
  const acceptedSet = new Set(output.map((s) => s.toLowerCase()));
  const rows: SkillRow[] = [];

  const tokens: string[] = [];
  for (const raw of input) {
    if (typeof raw === 'string') {
      raw
        .split(/[,;|•\n]+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .forEach((t) => tokens.push(t));
    } else if (raw && typeof raw === 'object') {
      const rec = raw as Record<string, unknown>;
      const name = rec.name ?? rec.skill ?? rec.Skill;
      if (name) tokens.push(String(name));
    }
  }

  for (const token of tokens) {
    const confidence = scoreFn(token);
    const accepted = confidence >= minConfidence && acceptedSet.has(token.toLowerCase());
    const rejected = !accepted;
    let reason = 'accepted';
    if (confidence < minConfidence) reason = `score ${confidence} < threshold ${minConfidence}`;
    else if (!acceptedSet.has(token.toLowerCase())) reason = 'deduped or canonicalized out';

    rows.push({
      skill: token,
      confidence,
      accepted,
      rejected,
      reason,
    });

    if (rejected && confidence >= 40) {
      lossEvents.push({
        field: 'Skills',
        firstSeenAt: 'skills_input',
        lostAt: '13_normalize_skills_list',
        functionName: 'normalizeSkillsList',
        condition: reason,
        parserSource,
        overwrittenBy: 'n/a',
      });
    }
  }

  const record: StageRecord = {
    stage: '13_normalize_skills_list',
    parserSource,
    incoming: lastSnapshot ?? snapshotImportFields({ skills: input }, parserSource),
    outgoing: snapshotImportFields({ skills: output }, parserSource),
    dropped: rows.filter((r) => r.rejected).map((r) => r.skill),
    modified: [],
    empty: output.length === 0 ? ['Skills'] : [],
    recovered: [],
    experiences: [],
    projects: [],
    skills: rows,
    notes: [`threshold=${minConfidence}`, `inputTokens=${tokens.length}`, `output=${output.length}`],
  };
  stageHistory.push(record);
  lastSnapshot = record.outgoing;
  logStageRecord(record);
}

export function flushImportFieldTraceReport(): void {
  if (!isImportFieldTraceEnabled()) return;
  const label = `[import-field-trace:${activeReqId}]`;

  console.log(`${label}`);
  console.log(`${label} ╔══════════════════════════════════════════════════════════════╗`);
  console.log(`${label} ║           IMPORT FIELD LOSS — FINAL TRACE REPORT            ║`);
  console.log(`${label} ╚══════════════════════════════════════════════════════════════╝`);

  console.log(`${label} Stages traced: ${stageHistory.length}`);
  for (const s of stageHistory) {
    console.log(`${label} • ${s.stage} | dropped=[${s.dropped.join(', ') || 'none'}] recovered=[${s.recovered.join(', ') || 'none'}]`);
  }

  console.log(`${label}`);
  console.log(`${label} ── Per-field loss events ──`);
  if (!lossEvents.length) {
    console.log(`${label} (no explicit loss events recorded — fields may have been empty at source)`);
  }
  for (const ev of lossEvents) {
    console.log(
      `${label} FIELD="${ev.field}" firstSeen="${ev.firstSeenAt}" lostAt="${ev.lostAt}" fn="${ev.functionName}" condition="${ev.condition}"`
    );
  }

  const first = stageHistory[0]?.outgoing;
  const last = stageHistory[stageHistory.length - 1]?.outgoing;
  if (first && last) {
    console.log(`${label}`);
    console.log(`${label} ── Pipeline summary (first stage → last stage) ──`);
    console.log(`${label} Full Name: "${preview(first.fullName, 60)}" → "${preview(last.fullName, 60)}"`);
    console.log(`${label} Headline: "${preview(first.headline, 60)}" → "${preview(last.headline, 60)}"`);
    console.log(`${label} Summary len: ${first.summary.length} → ${last.summary.length}`);
    console.log(`${label} Skills: ${first.skills.length} → ${last.skills.length}`);
    console.log(`${label} Experience: ${first.experienceCount} → ${last.experienceCount}`);
    console.log(`${label} Companies: ${first.experiences.filter((e) => e.company).length} → ${last.experiences.filter((e) => e.company).length}`);
    console.log(`${label} Projects: ${first.projectsCount} → ${last.projectsCount}`);
  }

  console.log(`${label}`);
  console.log(`${label} ── SINGLE ROOT CAUSE (heuristic from trace) ──`);
  const root = inferSingleRootCause();
  console.log(`${label} ${root}`);
  console.log(`${label} TRACE COMPLETE`);
}

function inferSingleRootCause(): string {
  const stages = stageHistory.map((s) => s.stage);
  const last = stageHistory[stageHistory.length - 1]?.outgoing;
  const first = stageHistory[0]?.outgoing;

  if (!stageHistory.length) {
    return 'Trace did not run — set IMPORT_FIELD_TRACE=1 and re-upload.';
  }

  const hasApilayer = stages.some((s) => String(s).includes('apilayer'));
  const hasAffinda = stages.some((s) => String(s).includes('affinda'));
  const hasHybrid = stages.some((s) => String(s).includes('hybrid'));
  const hasTextRecovery = stages.some((s) => String(s).includes('text_recovery'));

  if (!hasApilayer && hasAffinda && !hasHybrid) {
    return 'ROOT CAUSE: Parser cascade failed before ApiLayer/Hybrid — Affinda weak + downstream parsers unavailable; sparse source data entered mapping.';
  }

  if (last && first && last.skills.length === 0 && first.skills.length === 0) {
    return 'ROOT CAUSE: Skills never extracted at parser stage — all failures are upstream of mapping (provider cascade / fallback text extraction).';
  }

  if (lossEvents.some((e) => e.lostAt === '10_reconcile_experience_header_fields' && e.field === 'Company Name')) {
    return 'ROOT CAUSE: Company names lost in reconcileExperienceHeaderFields — parser assigned location/title/tech to company slot; plausibility filter cleared them without recovery.';
  }

  if (lossEvents.some((e) => e.lostAt === '11_sanitize_experience_entry')) {
    return 'ROOT CAUSE: Experience rows dropped in sanitizeExperienceEntry — header/body validation rejected sparse or garbage rows.';
  }

  if (lossEvents.some((e) => e.lostAt === '12_sanitize_project_entry')) {
    return 'ROOT CAUSE: Projects dropped in sanitizeProjectEntry — missing name/description or misclassified as job title.';
  }

  if (lossEvents.some((e) => e.lostAt === '13_normalize_skills_list')) {
    return 'ROOT CAUSE: Skills rejected in normalizeSkillsList — confidence below threshold or classified as location/company/title fragment.';
  }

  if (last && last.experienceCount > 0 && last.experiences.filter((e) => e.company).length === 0) {
    return 'ROOT CAUSE: Experience count preserved but Company Name empty — parser mis-assignment + reconcile cleared invalid company values with no description recovery.';
  }

  if (last && last.projectsCount === 0) {
    return 'ROOT CAUSE: Projects empty at render input — parser never produced projects OR transformProjectsArray/sanitizeProjectEntry filtered all rows.';
  }

  if (last && !last.summary) {
    return 'ROOT CAUSE: Summary empty — suspect-summary gate, section-bleed trim, or parser cascade returned no summary section.';
  }

  return 'ROOT CAUSE: Inspect per-stage dropped fields above — loss spread across parser cascade failure and multi-layer sanitization.';
}
