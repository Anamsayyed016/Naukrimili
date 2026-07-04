/**
 * Self-repair Builder fields from canonical node pool.
 */

import { sanitizeFieldText, sanitizeExperienceCompanyValue } from '@/lib/resume-parser/import-sanitize';
import { bestNodeValue, findNodes } from './ingest';
import type { CanonicalFieldNode, CanonicalMappingReport } from './types';

function isEmpty(value: unknown): boolean {
  return !sanitizeFieldText(value, 4000);
}

export function recoverBuilderFromNodes(
  builder: Record<string, unknown>,
  nodes: CanonicalFieldNode[],
  report: CanonicalMappingReport
): Record<string, unknown> {
  const out = { ...builder };

  if (isEmpty(out.email)) {
    const v = bestNodeValue(nodes, ['EMAIL']);
    if (v) {
      out.email = v;
      report.recovered.push('identity:email');
    } else report.missing.push('identity:email');
  }

  if (isEmpty(out.phone)) {
    const v = bestNodeValue(nodes, ['PHONE']);
    if (v) {
      out.phone = v;
      report.recovered.push('identity:phone');
    }
  }

  if (isEmpty(out.location)) {
    const v = bestNodeValue(nodes, ['LOCATION', 'ADDRESS']);
    if (v) {
      out.location = v;
      report.recovered.push('identity:location');
    }
  }

  if (isEmpty(out.summary)) {
    const v = bestNodeValue(nodes, ['SUMMARY', 'OBJECTIVE', 'PROFILE']);
    if (v) {
      out.summary = v;
      out.bio = v;
      out.objective = v;
      report.recovered.push('identity:summary');
    }
  }

  const experiences = Array.isArray(out.experience) ? [...(out.experience as Record<string, unknown>[])] : [];
  const parents = findNodes(nodes, { types: ['EXPERIENCE'] }).sort((a, b) => a.position - b.position);

  parents.forEach((parent, index) => {
    if (!experiences[index] || typeof experiences[index] !== 'object') {
      experiences[index] = {};
    }
    const row = { ...experiences[index] } as Record<string, unknown>;

    if (isEmpty(row.company)) {
      const v = sanitizeExperienceCompanyValue(
        bestNodeValue(nodes, ['COMPANY', 'ORGANIZATION', 'EMPLOYER'], parent.id)
      );
      if (v) {
        row.company = v;
        row.Company = v;
        report.recovered.push(`experience[${index}]:company`);
      } else {
        report.missing.push(`experience[${index}]:company`);
      }
    }

    if (isEmpty(row.title) && isEmpty(row.position) && isEmpty(row.designation)) {
      const v = bestNodeValue(nodes, ['JOB_TITLE'], parent.id);
      if (v) {
        row.title = v;
        row.position = v;
        row.designation = v;
        report.recovered.push(`experience[${index}]:designation`);
      }
    }

    if (isEmpty(row.location)) {
      const v = bestNodeValue(nodes, ['LOCATION'], parent.id);
      if (v) {
        row.location = v;
        report.recovered.push(`experience[${index}]:location`);
      }
    }

    if (isEmpty(row.description)) {
      const v = bestNodeValue(nodes, ['RESPONSIBILITY'], parent.id);
      if (v) {
        row.description = v;
        report.recovered.push(`experience[${index}]:description`);
      }
    }

    const ach = findNodes(nodes, { types: ['ACHIEVEMENT'], parent: parent.id }).map((n) => n.value);
    if ((!Array.isArray(row.achievements) || (row.achievements as unknown[]).length === 0) && ach.length) {
      row.achievements = ach;
      report.recovered.push(`experience[${index}]:achievements`);
    }

    experiences[index] = row;
  });

  if (experiences.length > 0) {
    out.experience = experiences;
    out['Work Experience'] = experiences;
    out.Experience = experiences;
  }

  if (!Array.isArray(out.languages) || (out.languages as unknown[]).length === 0) {
    const langs = findNodes(nodes, { types: ['LANGUAGE'], section: 'languages' });
    if (langs.length > 0) {
      out.languages = langs.map((n) => ({ name: n.value, language: n.value, proficiency: '' }));
      out.Languages = out.languages;
      report.recovered.push(`languages:${langs.length}`);
    } else if (findNodes(nodes, { types: ['LANGUAGE'] }).length > 0) {
      report.missing.push('languages:not-mapped');
    }
  }

  if (!Array.isArray(out.achievements) || (out.achievements as unknown[]).length === 0) {
    const ach = findNodes(nodes, { types: ['ACHIEVEMENT'] }).filter((n) => !n.parent);
    if (ach.length > 0) {
      out.achievements = ach.map((n) => n.value);
      report.recovered.push(`achievements:${ach.length}`);
    }
  }

  return out;
}
