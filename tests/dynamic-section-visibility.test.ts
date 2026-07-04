import {
  filterMeaningfulListItems,
  hasMeaningfulContent,
  isHeadingOnlyContent,
  isPlaceholderContent,
  pruneAndMergeDynamicSections,
} from '@/lib/resume-builder/dynamic-section-visibility';
import {
  DYNAMIC_SECTION_REGISTRY,
  getActiveDynamicSections,
} from '@/lib/resume-builder/dynamic-section-registry';
import { renderExtendedBuilderSections } from '@/lib/resume-builder/render-extended-sections';

describe('dynamic-section-visibility', () => {
  it('rejects placeholder and heading-only list items', () => {
    expect(isPlaceholderContent('N/A')).toBe(true);
    expect(isPlaceholderContent('Unknown')).toBe(true);
    expect(isHeadingOnlyContent('Technical Skills', 'Technical Skills')).toBe(true);
    expect(
      filterMeaningfulListItems(['Technical Skills', 'Python', 'N/A', ''], {
        sectionLabel: 'Technical Skills',
      })
    ).toEqual(['Python']);
  });

  it('hasMeaningfulContent returns false for empty sections', () => {
    expect(hasMeaningfulContent([], 'stringList', 'Volunteer Experience')).toBe(false);
    expect(hasMeaningfulContent(['Volunteer Experience'], 'stringList', 'Volunteer Experience')).toBe(false);
    expect(hasMeaningfulContent('', 'textarea', 'Declaration')).toBe(false);
    expect(hasMeaningfulContent(['Led regional sales team'], 'stringList', 'Professional Highlights')).toBe(true);
  });

  it('merges duplicate technical skills into standard skills section', () => {
    const result = pruneAndMergeDynamicSections(
      {
        skills: ['Python', 'React', 'Node'],
        technicalSkills: ['Python', 'React'],
        coreCompetencies: ['Python'],
        extendedSections: {
          technicalSkills: ['Python', 'React'],
          coreCompetencies: ['Python'],
        },
      },
      DYNAMIC_SECTION_REGISTRY
    );

    expect(result.skills).toEqual(['Python', 'React', 'Node']);
    expect(result.technicalSkills).toBeUndefined();
    expect(result.coreCompetencies).toBeUndefined();
    expect(getActiveDynamicSections(result)).toHaveLength(0);
  });

  it('keeps dynamic section when it adds unique values', () => {
    const result = pruneAndMergeDynamicSections(
      {
        skills: ['Python'],
        technicalSkills: ['Python', 'Kubernetes', 'Terraform'],
        extendedSections: {
          technicalSkills: ['Python', 'Kubernetes', 'Terraform'],
        },
      },
      DYNAMIC_SECTION_REGISTRY
    );

    expect(result.skills).toEqual(['Python', 'Kubernetes', 'Terraform']);
    expect(result.technicalSkills).toBeUndefined();
  });

  it('does not render empty dynamic sections in preview HTML', () => {
    const html = renderExtendedBuilderSections({
      skills: ['Java'],
      technicalSkills: ['Java'],
      volunteer: [],
      strengths: ['Strengths'],
      professionalHighlights: ['Closed $2M pipeline'],
      awards: [],
      extendedSections: {
        volunteer: [],
        strengths: ['Strengths'],
        professionalHighlights: ['Closed $2M pipeline'],
      },
    });

    expect(html).toMatch(/Professional Highlights/);
    expect(html).toMatch(/Closed \$2M pipeline/);
    expect(html).not.toMatch(/Volunteer Experience/);
    expect(html).not.toMatch(/Strengths/);
    expect(html).not.toMatch(/Technical Skills/);
  });
});
