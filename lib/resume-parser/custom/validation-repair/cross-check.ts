/**
 * Cross-section validation — detect misclassification across modules.
 */

import { skillDedupeKey } from '../skills-intelligence/aliases';
import type { CustomExtractedEducation } from '../education-extraction/types';
import type { CustomExtractedExperience } from '../experience-extraction/types';
import type { CustomExtractedProject } from '../project-extraction/types';
import type { IntelligentSkill } from '../skills-intelligence/types';
import type { RepairContext } from './types';
import { recordIssue } from './types';

function norm(s: string): string {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function crossCheckSections(
  experiences: CustomExtractedExperience[],
  projects: CustomExtractedProject[],
  educations: CustomExtractedEducation[],
  skills: IntelligentSkill[],
  ctx: RepairContext
): void {
  const companyNames = new Set(
    experiences.map((e) => norm(e.company)).filter((c) => c.length >= 3)
  );
  const institutionNames = new Set(
    educations.map((e) => norm(e.institution)).filter((i) => i.length >= 3)
  );
  const projectTitles = new Set(
    projects.map((p) => norm(p.title)).filter((t) => t.length >= 3)
  );
  const expDesignations = experiences.map((e) => norm(e.designation)).filter(Boolean);

  for (let i = 0; i < skills.length; i++) {
    const key = norm(skills[i].name);
    if (companyNames.has(key)) {
      recordIssue(ctx, {
        severity: 'warning',
        section: 'skills',
        index: i,
        code: 'company_as_skill',
        message: `Skill "${skills[i].name}" matches an experience company.`,
      });
    }
    if (institutionNames.has(key)) {
      recordIssue(ctx, {
        severity: 'warning',
        section: 'skills',
        index: i,
        code: 'institution_as_skill',
        message: `Skill "${skills[i].name}" matches an education institution.`,
      });
    }
  }

  for (let i = 0; i < projects.length; i++) {
    const title = norm(projects[i].title);
    if (!title) continue;

    if (companyNames.has(title)) {
      recordIssue(ctx, {
        severity: 'manual_review',
        section: 'projects',
        index: i,
        code: 'project_matches_company',
        message: `Project title matches experience company: "${projects[i].title}".`,
      });
    }

    if (expDesignations.includes(title)) {
      recordIssue(ctx, {
        severity: 'manual_review',
        section: 'projects',
        index: i,
        code: 'project_matches_designation',
        message: `Project title matches experience designation: "${projects[i].title}".`,
      });
    }
  }

  for (let i = 0; i < educations.length; i++) {
    const inst = norm(educations[i].institution);
    if (inst && companyNames.has(inst)) {
      recordIssue(ctx, {
        severity: 'manual_review',
        section: 'education',
        index: i,
        code: 'education_company_conflict',
        message: `Institution matches experience company: "${educations[i].institution}".`,
      });
    }
  }

  const skillKeys = new Set(skills.map((s) => skillDedupeKey(s.name)));
  for (let i = 0; i < experiences.length; i++) {
    const exp = experiences[i];
    const combined = `${exp.company} ${exp.designation}`.toLowerCase();
    let techHits = 0;
    for (const key of skillKeys) {
      if (key.length >= 3 && combined.includes(key)) techHits += 1;
    }
    if (techHits >= 4 && !exp.company) {
      recordIssue(ctx, {
        severity: 'manual_review',
        section: 'experience',
        index: i,
        code: 'experience_as_skill_list',
        message: 'Experience block may be misclassified skill list.',
      });
    }
  }

  for (let i = 0; i < projects.length; i++) {
    const title = projectTitles.has(norm(projects[i].title)) ? norm(projects[i].title) : '';
    if (!title) continue;
    const dupProject = projects.findIndex(
      (p, j) => j !== i && norm(p.title) === title && norm(p.github) === norm(projects[i].github)
    );
    if (dupProject >= 0 && dupProject < i) {
      recordIssue(ctx, {
        severity: 'warning',
        section: 'projects',
        index: i,
        code: 'cross_duplicate_project',
        message: `Project duplicates entry at index ${dupProject}.`,
      });
    }
  }
}
