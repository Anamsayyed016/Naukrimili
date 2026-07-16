const { readFileSync } = require('fs');

describe('column-flow-engine', () => {
  it('places locked Summary/Experience into configured left/right flows', () => {
    const { composeTwoColumnFlow } = require('@/lib/resume-builder/column-flow-engine');

    const htmlTemplate = readFileSync(
      './public/templates/soft-coral-executive/index.html',
      'utf8'
    );

    // Simulate a “sequential” baseline render where both locked sections start in main.
    const renderedHtml = `
      <div class="resume-container">
        <div class="sce-body">
          <main>
            <section class="sce-section">
              <h2 class="sce-section-title">Professional Summary</h2>
              <p class="summary-text">Brief summary text that is short.</p>
            </section>
            <section class="sce-section">
              <h2 class="sce-section-title">Experience</h2>
              <div class="experience-list">
                <div class="experience-item">
                  <div class="experience-header"><span class="company">Acme</span></div>
                  <div class="description"><ul><li>Built feature</li></ul></div>
                </div>
              </div>
            </section>
          </main>
          <aside>
          </aside>
        </div>
      </div>
    `;

    const out = composeTwoColumnFlow(renderedHtml, {
      htmlTemplate,
      templateId: 'soft-coral-executive',
    }).html;

    const mainMatch = /<main[^>]*>([\s\S]*?)<\/main>/i.exec(out);
    const sidebarMatch = /<aside[^>]*>([\s\S]*?)<\/aside>/i.exec(out);
    expect(mainMatch).not.toBeNull();
    expect(sidebarMatch).not.toBeNull();

    const mainInner = mainMatch![1];
    const sidebarInner = sidebarMatch![1];

    // Config says leftSections include summary, rightSections include experience.
    expect(mainInner).toContain('summary-text');
    expect(mainInner).not.toContain('experience-item');
    expect(sidebarInner).toContain('experience-item');
  });
});

