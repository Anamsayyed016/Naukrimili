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
});
