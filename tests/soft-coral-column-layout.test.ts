import { readFileSync } from 'fs';
import { detectTemplateSectionShell } from '../lib/resume-builder/section-visibility';
import {
  computeDynamicLayoutPlanFromMetrics,
  synthesizeMetricsFromRenderedHtml,
  computeTemplateLayoutCapacity,
} from '../lib/resume-builder/dynamic-layout-engine';

describe('soft-coral column placement + gallery capacity', () => {
  const html = readFileSync(
    './public/templates/soft-coral-executive/index.html',
    'utf8'
  );

  it('detects Soft Coral sidebar placements from surrounding <aside>', () => {
    expect(detectTemplateSectionShell(html, 'SUMMARY').placement).toBe('sidebar');
    expect(detectTemplateSectionShell(html, 'SKILLS').placement).toBe('sidebar');
    expect(detectTemplateSectionShell(html, 'EDUCATION').placement).toBe('sidebar');
    expect(detectTemplateSectionShell(html, 'CERTIFICATIONS').placement).toBe(
      'sidebar'
    );
    expect(detectTemplateSectionShell(html, 'LANGUAGES').placement).toBe('sidebar');
    expect(detectTemplateSectionShell(html, 'EXPERIENCE').placement).toBe('main');
    expect(detectTemplateSectionShell(html, 'PROJECTS').placement).toBe('main');
    expect(detectTemplateSectionShell(html, 'HOBBIES').placement).toBe('sidebar');
  });

  it('does not zero sidebar basis when metrics show a sidebar but htmlTemplate is omitted', () => {
    const rendered = `
      <div class="resume-container sce-resume" data-dl-page-underfill="true">
        <div class="sce-body">
          <main class="sce-main"><section><div class="experience-item">Job</div></section></main>
          <aside class="sce-sidebar"><section><p class="summary-text">Hello summary text here</p></section>
            <section><span class="skill-tag">Go</span></section></aside>
        </div>
      </div>
    `;
    const metrics = synthesizeMetricsFromRenderedHtml(rendered);
    expect(metrics.sidebarHeight).toBeGreaterThan(0);

    const plan = computeDynamicLayoutPlanFromMetrics(metrics, {}, {});
    expect(plan.sidebarColumnBasisPct).toBeGreaterThanOrEqual(22);
    expect(plan.mainColumnBasisPct).toBeLessThan(100);
  });

  it('resolves Soft Coral capacity from templateId alone', () => {
    const capacity = computeTemplateLayoutCapacity('', 'soft-coral-executive');
    expect(capacity.hasSidebar).toBe(true);
    expect(capacity.isSingleColumn).toBe(false);
    expect(capacity.sidebarColumnBasisHint).toBeGreaterThan(0);
  });

  it('expands underfilled sidebar instead of widening main when experience dominates', () => {
    const experienceBlock = Array.from({ length: 5 }, (_, i) =>
      `<div class="experience-item"><div class="experience-header"><span class="company">Co${i}</span><h3>Role</h3></div>` +
        `<div class="description"><ul><li>Bullet one for role ${i}</li><li>Bullet two for role ${i}</li><li>Bullet three for role ${i}</li></ul></div></div>`
    ).join('');

    const rendered = `
      <div class="resume-container sce-resume" data-dl-page-underfill="true">
        <div class="sce-body">
          <main class="sce-main">
            <section><div class="experience-list">${experienceBlock}</div></section>
          </main>
          <aside class="sce-sidebar">
            <section><span class="skill-tag">Go</span><span class="skill-tag">React</span></section>
            <section><div class="education-item"><span class="institution">State U</span></div></section>
          </aside>
        </div>
      </div>
    `;
    const metrics = synthesizeMetricsFromRenderedHtml(rendered);
    const plan = computeDynamicLayoutPlanFromMetrics(metrics, {}, {
      htmlTemplate: html,
      templateId: 'soft-coral-executive',
      renderedHtml: rendered,
    });

    expect(plan.mainFlexGrow).toBeLessThanOrEqual(1.75);
    expect(plan.sidebarFlexGrow).toBeGreaterThanOrEqual(1.0);
    expect(plan.sidebarColumnBasisPct).toBeGreaterThanOrEqual(22);
    expect(plan.sidebarInternalGap).toBeGreaterThanOrEqual(plan.sectionGap * 0.75);
    // Sidebar width stays locked; extras may favor main-column absorb shares.
    expect(plan.sidebarColumnBasisPct).toBeLessThanOrEqual(42);
    expect(plan.mainColumnBasisPct + plan.sidebarColumnBasisPct).toBeGreaterThanOrEqual(90);
  });
});
