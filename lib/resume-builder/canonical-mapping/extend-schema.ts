/**
 * Route unmapped canonical nodes into extended Builder schema buckets.
 */

import { DYNAMIC_SECTION_ROUTING } from './dictionary';
import { findNodes } from './ingest';
import type { CanonicalFieldNode, ExtendedBuilderSections } from './types';
import { emptyExtendedBuilderSections } from './types';
import { classifySectionHeading } from '@/lib/resume-builder/semantic-registry';
import { routeNodeToExtendedBucket } from '@/lib/resume-builder/semantic-routing';

export function extendBuilderSchema(
  builder: Record<string, unknown>,
  nodes: CanonicalFieldNode[]
): Record<string, unknown> {
  const extended: ExtendedBuilderSections = {
    ...emptyExtendedBuilderSections(),
    ...(typeof builder.extendedSections === 'object'
      ? (builder.extendedSections as ExtendedBuilderSections)
      : {}),
  };

  const additional = (builder.additionalResumeData || {}) as Record<string, unknown>;
  const mergeUnique = (arr: string[], items: string[]) => {
    const seen = new Set(arr.map((s) => s.toLowerCase()));
    for (const item of items) {
      const key = item.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        arr.push(item);
      }
    }
  };

  mergeUnique(extended.awards, findNodes(nodes, { types: ['AWARD'] }).map((n) => n.value));
  mergeUnique(extended.publications, findNodes(nodes, { types: ['PUBLICATION'] }).map((n) => n.value));
  mergeUnique(extended.patents, findNodes(nodes, { types: ['PATENT'] }).map((n) => n.value));
  mergeUnique(extended.volunteer, findNodes(nodes, { types: ['VOLUNTEER'] }).map((n) => n.value));

  const refParents = findNodes(nodes, { types: ['REFERENCE'] }).filter((n) =>
    /^references\[\d+\]$|additional\.references\[\d+\]$/.test(n.source)
  );
  for (const parent of refParents) {
    const children = nodes.filter((n) => n.parent === parent.id);
    const record: Record<string, unknown> = { name: parent.value };
    for (const child of children) {
      const field = child.source.split('.').pop() || '';
      if (field) record[field] = child.value;
    }
    const exists = extended.references.some(
      (r) => String(r.name || '').toLowerCase() === String(record.name || '').toLowerCase()
    );
    if (!exists) extended.references.push(record);
  }
  for (const ref of findNodes(nodes, { types: ['REFERENCE'] })) {
    if (ref.parent) continue;
    const text = ref.value.trim();
    if (!text) continue;
    const exists = extended.references.some(
      (r) => String(r.name || r).toLowerCase() === text.toLowerCase()
    );
    if (!exists) extended.references.push({ name: text });
  }
  mergeUnique(extended.memberships, findNodes(nodes, { types: ['MEMBERSHIP'] }).map((n) => n.value));
  mergeUnique(extended.training, findNodes(nodes, { types: ['TRAINING'] }).map((n) => n.value));
  mergeUnique(extended.research, findNodes(nodes, { types: ['RESEARCH'] }).map((n) => n.value));
  mergeUnique(
    extended.professionalHighlights,
    findNodes(nodes, { types: ['ACHIEVEMENT', 'SEMANTIC_SECTION'] })
      .filter((n) => /highlight/i.test(n.section) || /highlight/i.test(n.source))
      .map((n) => n.value)
  );
  mergeUnique(extended.strengths, findNodes(nodes, { types: ['STRENGTH'] }).map((n) => n.value));
  mergeUnique(
    extended.industryExpertise,
    findNodes(nodes, { types: ['INDUSTRY_EXPERTISE'] }).map((n) => n.value)
  );
  mergeUnique(
    extended.seminars,
    findNodes(nodes, { types: ['TRAINING', 'SEMANTIC_SECTION'] })
      .filter((n) => /seminar|conference/i.test(n.section + n.source))
      .map((n) => n.value)
  );
  mergeUnique(
    extended.professionalQualifications,
    findNodes(nodes, { types: ['CERTIFICATION', 'TRAINING', 'EDUCATION'] })
      .filter((n) => /qualification/i.test(n.section + n.source))
      .map((n) => n.value)
  );
  mergeUnique(
    extended.coreCompetencies,
    findNodes(nodes, { types: ['CORE_SKILL'] }).map((n) => n.value)
  );
  mergeUnique(
    extended.softSkills,
    findNodes(nodes, { types: ['SOFT_SKILL'] }).map((n) => n.value)
  );
  mergeUnique(
    extended.technicalSkills,
    findNodes(nodes, { types: ['TECHNICAL_SKILL', 'TOOLS', 'FRAMEWORK', 'DATABASE'] }).map((n) => n.value)
  );

  const sectionNodes = findNodes(nodes, { types: ['SEMANTIC_SECTION'] });
  for (const sec of sectionNodes) {
    const bodyNodes = nodes.filter(
      (n) =>
        n.parent === sec.id ||
        n.section === sec.value ||
        n.source.includes(sec.source.replace('.heading', '.body'))
    );
    const body = bodyNodes.map((n) => n.value).join('\n').trim() || sec.value;
    const classified = classifySectionHeading(sec.value);
    if (classified && classified.definition.builderTarget.kind === 'extended') {
      const fieldKey = classified.definition.builderTarget.field;
      if (fieldKey === 'declaration') {
        extended.declaration = body;
      } else if (fieldKey === 'personalDetails') {
        extended.personalDetails[sec.value] = body;
      } else if (Array.isArray((extended as Record<string, unknown>)[fieldKey])) {
        mergeUnique((extended as Record<string, string[]>)[fieldKey], body.split(/\n+/).filter(Boolean));
      }
      continue;
    }
    for (const route of DYNAMIC_SECTION_ROUTING) {
      if (!route.pattern.test(sec.value)) continue;
      const bucket = route.bucket;
      if (bucket === 'declaration') {
        extended.declaration = body || sec.value;
      } else if (bucket === 'personalDetails') {
        extended.personalDetails[sec.value] = body;
      } else if (Array.isArray((extended as Record<string, unknown>)[bucket])) {
        mergeUnique((extended as Record<string, string[]>)[bucket], body ? [body] : [sec.value]);
      }
      break;
    }
    if (!DYNAMIC_SECTION_ROUTING.some((r) => r.pattern.test(sec.value))) {
      if (!classified) {
        extended.extraSections.push({ heading: sec.value, body });
      }
    }
  }

  let routedExtended = extended;
  for (const node of nodes) {
    routedExtended = routeNodeToExtendedBucket(routedExtended, node);
  }
  Object.assign(extended, routedExtended);

  const mergedAdditional = {
    ...additional,
    awards: [...(Array.isArray(additional.awards) ? additional.awards : []), ...extended.awards],
    publications: [
      ...(Array.isArray(additional.publications) ? additional.publications : []),
      ...extended.publications,
    ],
    patents: [...(Array.isArray(additional.patents) ? additional.patents : []), ...extended.patents],
    volunteerWork: [
      ...(Array.isArray(additional.volunteerWork) ? additional.volunteerWork : []),
      ...extended.volunteer,
    ],
    memberships: [
      ...(Array.isArray(additional.memberships) ? additional.memberships : []),
      ...extended.memberships,
    ],
    achievements: Array.isArray(additional.achievements) ? additional.achievements : [],
    extraSections: [
      ...(Array.isArray(additional.extraSections) ? additional.extraSections : []),
      ...extended.extraSections,
    ],
  };

  return {
    ...builder,
    extendedSections: extended,
    additionalResumeData: mergedAdditional,
    awards: extended.awards,
    publications: extended.publications,
    patents: extended.patents,
    volunteer: extended.volunteer,
    memberships: extended.memberships,
    training: extended.training,
    internships: extended.internships,
    research: extended.research,
    references: extended.references,
    declaration: extended.declaration,
    professionalQualifications: extended.professionalQualifications,
    professionalHighlights: extended.professionalHighlights,
    coreCompetencies: extended.coreCompetencies,
    softSkills: extended.softSkills,
    technicalSkills: extended.technicalSkills,
    strengths: extended.strengths,
    industryExpertise: extended.industryExpertise,
    seminars: extended.seminars,
    unsupportedSections: extended.unsupportedSections,
  };
}
