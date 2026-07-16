import {
  buildDynamicLayoutCss,
  computeDynamicLayoutPlan,
  estimateVisualBalancingScore,
  synthesizeMetricsFromRenderedHtml,
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
    expect(plan.sidebarInternalGap).toBeLessThanOrEqual(Math.ceil(14 * 1.2 * 1.4));
    expect(plan.skillGap).toBeGreaterThanOrEqual(4);
    expect(plan.skillGap).toBeLessThanOrEqual(12);
    expect(plan.descLineHeightMul).toBeLessThanOrEqual(1.32);
    expect(plan.sectionDensities.summary).toBe('relaxed');
    expect(plan.fontScale).toBe(1);
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
      education: [{ degree: 'MBA', school: 'School' }],
    });
    expect(plan.layoutRhythm).toBe('compact');
    expect(plan.sidebarInternalGap).toBeLessThanOrEqual(Math.round(14 * 1.05));
    expect(plan.sidebarInternalGap).toBeLessThanOrEqual(plan.sectionGap);
    expect(plan.sectionDensities.education).toBe('compact');
    expect(plan.sectionDensities.projects).toBe('compact');
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
    expect(plan.sidebarInternalGap).toBeLessThanOrEqual(Math.ceil(14 * 1.2 * 1.4));
  });

  it('never force-stretches experience cards via layout CSS', () => {
    const plan = computeDynamicLayoutPlan({
      summary: 'Summary text for spacing.',
      experience: [{ title: 'A', company: 'B', description: 'Work.' }],
      skills: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    });
    const css = buildDynamicLayoutCss(plan, { preservePremiumTypography: true });
    expect(css).toContain("data-dl-rhythm='relaxed'");
    expect(css).toContain('overflow: visible !important');
    expect(css).toMatch(/\.experience-item \{\s*[\s\S]*?flex: 0 0 auto !important/);
    expect(css).not.toMatch(
      /\.experience-item \{\s*[\s\S]*?flex: 1 1 auto !important/
    );
    expect(css).toContain('padding-top: var(--dl-exp-card-padding');
    expect(css).not.toMatch(
      /\.experience-item \{\s*padding: var\(--dl-exp-card-padding/
    );
  });

  it('reflows underfill with tighter measure and higher leading (not wider empty lines)', () => {
    const { computeTextReflowPlan } = require('@/lib/resume-builder/dynamic-layout-engine');
    const underfill = computeTextReflowPlan({
      remainingWhitespace: 280,
      pageFill: 0.62,
      summaryWords: 55,
      experienceTextUnits: 6,
      pageUnderfill: true,
      shouldCompress: false,
      layoutRhythm: 'relaxed',
      baseSummaryMaxCh: 68,
      baseContentMeasureCh: 72,
      baseDescLineHeightMul: 1.12,
    });
    const compress = computeTextReflowPlan({
      remainingWhitespace: 0,
      pageFill: 1.05,
      summaryWords: 90,
      experienceTextUnits: 18,
      pageUnderfill: false,
      shouldCompress: true,
      layoutRhythm: 'compact',
      baseSummaryMaxCh: 68,
      baseContentMeasureCh: 72,
      baseDescLineHeightMul: 1.12,
    });
    expect(underfill.summaryMaxCh).toBeLessThanOrEqual(68);
    expect(underfill.summaryMaxCh).toBeGreaterThanOrEqual(56);
    expect(underfill.descLineHeightMul).toBeGreaterThan(compress.descLineHeightMul);
    expect(underfill.summaryLineHeightMul).toBeGreaterThan(1.03);
    expect(compress.contentMeasureCh).toBeGreaterThanOrEqual(underfill.contentMeasureCh);
  });

  it('distributes underfill whitespace toward summary and experience', () => {
    const plan = computeDynamicLayoutPlan(
      {
        summary:
          'Results-driven professional with a track record of shipping reliable products and mentoring teams.',
        experience: [
          {
            title: 'Engineer',
            company: 'Acme',
            description:
              'Built customer-facing features across the funnel.\nPartnered with design on accessibility.',
          },
          {
            title: 'Developer',
            company: 'Beta',
            description: 'Owned API latency work and observability.',
          },
        ],
        projects: [{ name: 'Portal', description: 'Internal tooling.' }],
        education: [{ degree: 'B.S.', school: 'State U' }],
        skills: ['TypeScript', 'React', 'Node'],
      },
      {
        htmlTemplate: '<aside class="sidebar"></aside><main></main>',
        renderedHtml: `<div class="resume-container" style="height:620px">
          <aside class="sidebar">
            <section><span class="skill-tag">TypeScript</span></section>
            <section><div class="education-item">B.S.</div></section>
          </aside>
          <main>
            <section><p class="summary-text">Results-driven professional with a track record.</p></section>
            <section>
              <div class="experience-item"><div class="description"><p>Built features.</p></div></div>
              <div class="experience-item"><div class="description"><p>Owned APIs.</p></div></div>
            </section>
            <section><div class="project-item"><div class="description">Portal</div></div></section>
          </main>
        </div>`,
      }
    );

    expect(plan.layoutRhythm).toBe('relaxed');
    expect(plan.sectionDensities.summary).toBe('relaxed');
    expect(['relaxed', 'normal']).toContain(plan.sectionDensities.experience);
    expect(plan.sectionDensities.education).toBe('compact');
    expect(plan.sectionExtras.experience ?? 0).toBeGreaterThanOrEqual(
      plan.sectionExtras.education ?? 0
    );
    expect(plan.summaryMaxCh).toBeGreaterThanOrEqual(56);
    expect(plan.summaryMaxCh).toBeLessThanOrEqual(72);
    expect(plan.contentMeasureCh).toBeGreaterThanOrEqual(58);
    expect(plan.contentMeasureCh).toBeLessThanOrEqual(78);
    expect(plan.descLineHeightMul).toBeGreaterThan(1.12);
    expect(plan.visualBalancingScore).toBeGreaterThan(0.5);
    expect(plan.sidebarColumnBasisPct).toBeGreaterThanOrEqual(22);
    expect(plan.sidebarColumnBasisPct).toBeLessThanOrEqual(42);
  });

  it('keeps compact density for long resumes without inventing stretch', () => {
    const plan = computeDynamicLayoutPlan({
      summary: 'x '.repeat(120),
      experience: Array.from({ length: 7 }, (_, i) => ({
        title: `Role ${i}`,
        company: 'Co',
        description: Array.from({ length: 6 }, (_, j) => `Outcome ${j}.`).join('\n'),
      })),
      projects: Array.from({ length: 5 }, (_, i) => ({
        name: `P${i}`,
        description: 'Shipped module.',
      })),
      skills: Array.from({ length: 24 }, (_, i) => `Skill-${i}`),
      education: [
        { degree: 'MBA', school: 'School A' },
        { degree: 'B.S.', school: 'School B' },
      ],
      achievements: Array.from({ length: 4 }, (_, i) => `Award ${i}`),
    });
    expect(plan.layoutRhythm).toBe('compact');
    expect(plan.sectionDensities.projects).toBe('compact');
    expect(plan.fontScale).toBeLessThanOrEqual(1.02);
    const css = buildDynamicLayoutCss(plan);
    expect(css).toMatch(/flex: 0 0 auto !important/);
  });

  it('scores projected fill toward the professional band', () => {
    const metrics = synthesizeMetricsFromRenderedHtml(`
      <div class="resume-container">
        <main>
          <section><p class="summary-text">Brief</p></section>
          <section><div class="experience-item"><ul><li>One</li></ul></div></section>
        </main>
      </div>
    `);
    const plan = computeDynamicLayoutPlan(
      {
        summary: 'Brief',
        experience: [{ title: 'A', company: 'B', description: 'One' }],
      },
      { metrics }
    );
    const score = estimateVisualBalancingScore(metrics, plan);
    expect(score).toBe(plan.visualBalancingScore);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('handles missing optional sections without breaking density plan', () => {
    const noProjects = computeDynamicLayoutPlan({
      summary: 'Operator focused on delivery quality.',
      experience: [
        { title: 'Lead', company: 'Acme', description: 'Shipped roadmap.' },
        { title: 'IC', company: 'Beta', description: 'Owned services.' },
      ],
      skills: ['Go', 'SQL'],
      education: [{ degree: 'B.S.', school: 'State' }],
    });
    expect(noProjects.sectionDensities.summary).toBeDefined();
    expect(noProjects.sectionExtras.projects ?? 0).toBe(0);

    const noAchievements = computeDynamicLayoutPlan({
      summary: 'Builder.',
      experience: [{ title: 'Dev', company: 'Co', description: 'Code.' }],
      projects: [{ name: 'App', description: 'MVP.' }],
      skills: ['JS'],
    });
    expect(noAchievements.sectionDensities.achievements ?? 'compact').toBe('compact');
  });
});
