/**
 * Self-validation: compare parser → canonical → builder layers before editor opens.
 * Mapping layer only — does not alter parser or export.
 */

import { ingestCanonicalNodes } from '@/lib/resume-builder/canonical-mapping/ingest';
import { runCanonicalBuilderMapping } from '@/lib/resume-builder/canonical-mapping';
import { readExtendedSections, DYNAMIC_SECTION_REGISTRY } from '@/lib/resume-builder/dynamic-section-registry';

export interface PipelineValidationIssue {
  layer: 'parser' | 'canonical' | 'builder' | 'extended';
  code: string;
  message: string;
  section?: string;
}

export interface PipelineValidationReport {
  ok: boolean;
  issues: PipelineValidationIssue[];
  counts: {
    parserNodes: number;
    builderExperience: number;
    builderSkills: number;
    extendedSections: number;
  };
}

function countNonEmpty(values: unknown): number {
  if (!Array.isArray(values)) return 0;
  return values.filter((v) => {
    if (typeof v === 'string') return v.trim().length > 0;
    if (v && typeof v === 'object') {
      return Object.values(v as Record<string, unknown>).some(
        (x) => typeof x === 'string' && x.trim().length > 0
      );
    }
    return false;
  }).length;
}

/**
 * Compare import profile against builder form state after canonical mapping.
 */
export function validateImportPipelineAlignment(
  importProfile: Record<string, unknown>,
  builderForm: Record<string, unknown>
): PipelineValidationReport {
  const issues: PipelineValidationIssue[] = [];
  const nodes = ingestCanonicalNodes(importProfile);
  const canonical = runCanonicalBuilderMapping({
    importProfile,
    builderDraft: builderForm,
  });

  const parserExp = Array.isArray(importProfile.experience) ? importProfile.experience.length : 0;
  const builderExp = Array.isArray(builderForm.experience) ? builderForm.experience.length : 0;
  const mappedExp = Array.isArray(canonical.builder.experience)
    ? (canonical.builder.experience as unknown[]).length
    : 0;

  if (parserExp > 0 && mappedExp < parserExp) {
    issues.push({
      layer: 'builder',
      code: 'experience-count-drop',
      message: `Experience entries reduced from ${parserExp} to ${mappedExp}`,
      section: 'experience',
    });
  }

  const parserSkills = countNonEmpty(importProfile.skills);
  const builderSkills = countNonEmpty(builderForm.skills);
  if (parserSkills > 0 && builderSkills === 0 && mappedExp === builderExp) {
    issues.push({
      layer: 'builder',
      code: 'skills-missing',
      message: 'Parser extracted skills but builder form has none',
      section: 'skills',
    });
  }

  for (const rejected of canonical.report.rejected) {
    issues.push({
      layer: 'canonical',
      code: 'node-rejected',
      message: rejected,
    });
  }

  const extended = readExtendedSections(builderForm);
  let extendedCount = 0;
  for (const spec of DYNAMIC_SECTION_REGISTRY) {
    const val = extended[spec.fieldKey];
    if (spec.kind === 'stringList' && countNonEmpty(val) > 0) extendedCount += 1;
    else if (spec.kind === 'recordList' && countNonEmpty(val) > 0) extendedCount += 1;
    else if (spec.kind === 'textarea' && typeof val === 'string' && val.trim()) extendedCount += 1;
    else if (spec.kind === 'keyValue' && val && typeof val === 'object') extendedCount += 1;
  }
  extendedCount += extended.extraSections.length;

  const awardNodes = nodes.filter((n) => n.type === 'AWARD').length;
  const pubNodes = nodes.filter((n) => n.type === 'PUBLICATION').length;
  const volNodes = nodes.filter((n) => n.type === 'VOLUNTEER').length;

  if (awardNodes > 0 && extended.awards.length === 0) {
    issues.push({
      layer: 'extended',
      code: 'awards-not-surfaced',
      message: `${awardNodes} award node(s) not present in extended sections`,
      section: 'awards',
    });
  }
  if (pubNodes > 0 && extended.publications.length === 0) {
    issues.push({
      layer: 'extended',
      code: 'publications-not-surfaced',
      message: `${pubNodes} publication node(s) not present in extended sections`,
      section: 'publications',
    });
  }
  if (volNodes > 0 && extended.volunteer.length === 0) {
    issues.push({
      layer: 'extended',
      code: 'volunteer-not-surfaced',
      message: `${volNodes} volunteer node(s) not present in extended sections`,
      section: 'volunteer',
    });
  }

  const parserLangs = Array.isArray(importProfile.languages) ? importProfile.languages : [];
  const builderLangs = Array.isArray(builderForm.languages) ? builderForm.languages : [];
  for (let i = 0; i < parserLangs.length; i++) {
    const src = parserLangs[i];
    if (!src || typeof src !== 'object') continue;
    const rec = src as Record<string, unknown>;
    const srcProf = String(rec.proficiency || rec.level || '').trim();
    const dst = builderLangs[i];
    if (!srcProf || !dst || typeof dst !== 'object') continue;
    const dstProf = String((dst as Record<string, unknown>).proficiency || '').trim();
    if (srcProf && !dstProf) {
      issues.push({
        layer: 'canonical',
        code: 'language-proficiency-lost',
        message: `Proficiency "${srcProf}" lost for language index ${i}`,
        section: 'languages',
      });
      break;
    }
  }

  const ledger = builderForm.mappingLedger as
    | { discarded?: number; mapped?: number; dynamic?: number; unsupported?: number }
    | undefined;
  if (ledger && typeof ledger.discarded === 'number' && ledger.discarded > 0) {
    issues.push({
      layer: 'builder',
      code: 'nodes-discarded',
      message: `${ledger.discarded} parser node(s) were discarded`,
    });
  }

  const highlightNodes = nodes.filter(
    (n) => n.type === 'SEMANTIC_SECTION' && /highlight/i.test(n.value)
  ).length;
  if (highlightNodes > 0 && extended.professionalHighlights.length === 0) {
    issues.push({
      layer: 'extended',
      code: 'highlights-not-surfaced',
      message: 'Professional highlights nodes not routed to builder',
      section: 'professionalHighlights',
    });
  }

  return {
    ok: issues.length === 0,
    issues,
    counts: {
      parserNodes: nodes.length,
      builderExperience: builderExp,
      builderSkills,
      extendedSections: extendedCount,
    },
  };
}
