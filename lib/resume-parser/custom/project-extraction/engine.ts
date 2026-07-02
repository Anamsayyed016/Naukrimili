/**
 * Project Extraction Engine — converts detected project section text into structured entries.
 */

import { partitionProjectBlocks } from './boundaries';
import { buildProjectFromBlock } from './fields';
import type { CanonicalProject, CustomExtractedProject } from './types';
import { filterValidProjects } from './validate';
import { toCanonicalProject } from './types';

export interface ProjectExtractionResult {
  projects: CustomExtractedProject[];
  canonical: CanonicalProject[];
  rejectedCount: number;
  blockCount: number;
}

export function extractProjectsFromSection(
  projectSectionText: string
): CustomExtractedProject[] {
  return extractProjectsWithMeta(projectSectionText).projects;
}

export function extractProjectsWithMeta(projectSectionText: string): ProjectExtractionResult {
  const blocks = partitionProjectBlocks(projectSectionText || '');
  const built = blocks.map(buildProjectFromBlock);
  const projects = filterValidProjects(built);

  return {
    projects,
    canonical: projects.map(toCanonicalProject),
    rejectedCount: built.length - projects.length,
    blockCount: blocks.length,
  };
}

export function extractCanonicalProjects(projectSectionText: string): CanonicalProject[] {
  return extractProjectsWithMeta(projectSectionText).canonical;
}
