import {
  buildDynamicLayoutCss,
  computeDynamicLayoutPlan,
} from '@/lib/resume-builder/dynamic-layout-engine';

describe('adaptive layout rhythm', () => {
  it('uses relaxed rhythm for short resumes and clamps sidebar spacing', () => {
    const plan = computeDynamicLayoutPlan({
      summary: 'Short executive summary.',
      experience: [{ title: 'Lead', company: 'Acme', description: 'Shipped product.' }],
      skills: ['Strategy', 'Leadership'],
    });
    expect(plan.layoutRhythm).toBe('relaxed');
    expect(plan.sidebarInternalGap).toBeGreaterThanOrEqual(Math.round(14 * 0.8));
    expect(plan.sidebarInternalGap).toBeLessThanOrEqual(Math.round(14 * 1.2 * 1.35));
    expect(plan.skillGap).toBeGreaterThanOrEqual(4);
    expect(plan.skillGap).toBeLessThanOrEqual(12);
    expect(plan.descLineHeightMul).toBeLessThanOrEqual(1.232);
  });

  it('uses compact rhythm for content-heavy resumes', () => {
    const plan = computeDynamicLayoutPlan({
      summary: 'x '.repeat(90),
      experience: Array.from({ length: 8 }, (_, i) => ({
        title: `Role ${i}`,
        company: 'Co',
        description: 'Lead initiatives.\nDelivered outcomes.\nOwned roadmap.',
      })),
      skills: Array.from({ length: 22 }, (_, i) => `Expertise-${i}`),
      projects: Array.from({ length: 4 }, (_, i) => ({
        name: `Project ${i}`,
        description: 'Built platform.',
      })),
      certifications: Array.from({ length: 4 }, (_, i) => ({ name: `Cert ${i}` })),
      languages: [
        { language: 'English', proficiency: 'Native' },
        { language: 'Hindi', proficiency: 'Fluent' },
      ],
    });
    expect(plan.layoutRhythm).toBe('compact');
    expect(plan.sidebarInternalGap).toBeLessThanOrEqual(Math.round(14 * 1.05));
    expect(plan.sidebarInternalGap).toBeLessThanOrEqual(plan.sectionGap);
  });

  it('uses relaxed rhythm for sparse sidebar inventory', () => {
    const plan = computeDynamicLayoutPlan({
      summary: 'Brief overview of leadership impact.',
      experience: [
        { title: 'Director', company: 'Acme', description: 'Scaled org.' },
      ],
      skills: ['Strategy', 'Leadership'],
      education: [{ degree: 'MBA', school: 'Stanford' }],
    });
    expect(plan.layoutRhythm).toBe('relaxed');
    expect(plan.sidebarInternalGap).toBeGreaterThanOrEqual(Math.round(14 * 0.8));
  });

  it('stays balanced with medium experience counts', () => {
    const plan = computeDynamicLayoutPlan({
      summary: 'Seasoned operator with cross-functional delivery.',
      experience: Array.from({ length: 5 }, (_, i) => ({
        title: `Role ${i}`,
        company: 'Co',
        description: 'Delivered outcomes across squads.',
      })),
      skills: Array.from({ length: 8 }, (_, i) => `Capability-${i}`),
      projects: [{ name: 'Platform', description: 'Internal tools.' }],
    });
    expect(['compact', 'normal', 'relaxed']).toContain(plan.layoutRhythm);
    expect(plan.sidebarInternalGap).toBeGreaterThanOrEqual(Math.round(14 * 0.8));
    expect(plan.sidebarInternalGap).toBeLessThanOrEqual(Math.round(14 * 1.2 * 1.35));
  });

  it('never force-stretches experience cards via layout CSS', () => {
    const plan = computeDynamicLayoutPlan({
      summary: 'Summary text for spacing.',
      experience: [{ title: 'A', company: 'B', description: 'Work.' }],
      skills: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    });
    const css = buildDynamicLayoutCss(plan, { preservePremiumTypography: true });
    expect(css).toContain("data-dl-rhythm='relaxed'");
    expect(css).toMatch(/\.experience-item \{\s*[\s\S]*?flex: 0 0 auto !important/);
    expect(css).not.toMatch(
      /\.experience-item \{\s*[\s\S]*?flex: 1 1 auto !important/
    );
    expect(css).toContain('padding-top: var(--dl-exp-card-padding');
    expect(css).not.toMatch(
      /\.experience-item \{\s*padding: var\(--dl-exp-card-padding/
    );
  });
});
