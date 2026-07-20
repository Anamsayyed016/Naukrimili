import {

  balanceTwoColumnLayout,

  detectTwoColumnLayout,

  FIXED_COLUMN_SECTIONS,

  FLEXIBLE_COLUMN_SECTIONS,

  injectSidebarBalanceIntoHtml,

} from '@/lib/resume-builder/column-balance-engine';



const twoColumnTemplate = `

  <div class="resume-container">

    <main>

      {{#if SUMMARY}}<section class="content-section"><p class="summary-text">{{SUMMARY}}</p></section>{{/if}}

      {{#if EXPERIENCE}}<section class="content-section"><div class="experience-list">{{EXPERIENCE}}</div></section>{{/if}}

      {{#if PROJECTS}}<section class="content-section"><div class="projects-list">{{PROJECTS}}</div></section>{{/if}}

      {{#if ACHIEVEMENTS}}<section class="content-section"><div class="achievements-list">{{ACHIEVEMENTS}}</div></section>{{/if}}

    </main>

    <aside class="sidebar">

      {{#if SKILLS}}<section class="sidebar-section"><div class="skills-list">{{SKILLS}}</div></section>{{/if}}

      {{#if EDUCATION}}<section class="sidebar-section"><div class="education-list">{{EDUCATION}}</div></section>{{/if}}

      {{#if LANGUAGES}}<section class="sidebar-section"><div class="languages-list">{{LANGUAGES}}</div></section>{{/if}}

    </aside>

  </div>

`;



function longMainShortSidebarHtml(): string {

  const experienceItems = Array.from({ length: 5 }, (_, i) => `

    <div class="experience-item">

      <div class="experience-header"><span class="company">Company ${i}</span><h3>Role</h3></div>

      <div class="description"><ul>

        ${Array.from({ length: 6 }, (_, j) => `<li>Impact bullet ${j} with enough text for height</li>`).join('')}

      </ul></div>

    </div>`).join('');



  return `

    <div class="resume-container">

      <main>

        <section class="content-section"><p class="summary-text">Senior engineer with deep product experience across platforms and teams.</p></section>

        <section class="content-section"><div class="experience-list">${experienceItems}</div></section>

        <section class="content-section">

          <div class="projects-list">

            <div class="project-item"><h3>Platform Rebuild</h3><ul><li>Migrated services</li><li>Cut cost 30%</li></ul></div>

            <div class="project-item"><h3>Analytics Hub</h3><ul><li>Realtime dashboards</li></ul></div>

          </div>

        </section>

        <section class="content-section">

          <div class="achievements-list">

            <div class="achievement-item"><h3>Patent filed</h3></div>

            <div class="achievement-item"><h3>Conference talk</h3></div>

          </div>

        </section>

      </main>

      <aside class="sidebar">

        <section class="sidebar-section"><div class="skills-list"><span class="skill-tag">React</span><span class="skill-tag">Node</span></div></section>

        <section class="sidebar-section"><div class="education-list"><div class="education-item"><span class="institution">MIT</span></div></div></section>

        <section class="sidebar-section"><div class="languages-list"><div class="language-item">English</div></div></section>

      </aside>

    </div>

  `;

}



describe('dynamic sidebar balancing engine', () => {

  it('detects two-column layouts', () => {

    expect(detectTwoColumnLayout(twoColumnTemplate)).toBe(true);

  });



  it('never treats education/skills/languages as flexible', () => {

    expect(FIXED_COLUMN_SECTIONS.has('education')).toBe(true);

    expect(FIXED_COLUMN_SECTIONS.has('skills')).toBe(true);

    expect(FIXED_COLUMN_SECTIONS.has('languages')).toBe(true);

    expect(FIXED_COLUMN_SECTIONS.has('experience')).toBe(true);

    expect(FLEXIBLE_COLUMN_SECTIONS.has('languages')).toBe(false);

    expect(FLEXIBLE_COLUMN_SECTIONS.has('education')).toBe(false);

    expect(FLEXIBLE_COLUMN_SECTIONS.has('projects')).toBe(true);

  });



  it('moves projects into underfilled sidebar for long main columns', () => {

    const rendered = longMainShortSidebarHtml();

    const result = balanceTwoColumnLayout(rendered, { htmlTemplate: twoColumnTemplate });



    expect(result.moved.length).toBeGreaterThan(0);

    expect(

      result.moved.every((m) =>

        ['projects', 'certifications', 'achievements', 'interests', 'references', 'extended'].includes(

          m.kind

        )

      )

    ).toBe(true);

    expect(result.moved.every((m) => m.from === 'main' && m.to === 'sidebar')).toBe(true);

    expect(result.html).toContain('data-column-balanced="true"');

    expect(result.html).toContain('data-injected="sidebar-balance"');



    const sideHtml = result.html.match(/<aside[\s\S]*?<\/aside>/i)?.[0] || '';

    const mainHtml = result.html.match(/<main[\s\S]*?<\/main>/i)?.[0] || '';

    expect(sideHtml).toMatch(/project-item|achievement-item/);

    expect(mainHtml).toContain('experience-item');

    expect(mainHtml).toContain('summary-text');

    expect(sideHtml).toContain('skill-tag');

    expect(sideHtml).toContain('language-item');

    expect((result.html.match(/project-item/g) || []).length).toBe(2);

  });



  it('does not move when sidebar already adequately fills main height', () => {

    const rendered = `

      <div class="resume-container">

        <main>

          <section><p class="summary-text">Short summary for a compact resume.</p></section>

          <section><div class="experience-list"><div class="experience-item"><span class="company">Acme</span><ul><li>One</li></ul></div></div></section>

          <section><div class="projects-list"><div class="project-item"><h3>App</h3><ul><li>Built it</li></ul></div></div></section>

        </main>

        <aside class="sidebar">

          <section><div class="skills-list">${Array.from({ length: 12 }, (_, i) => `<span class="skill-tag">Skill${i}</span>`).join('')}</div></section>

          <section><div class="education-list"><div class="education-item"><span class="institution">MIT</span></div><div class="education-item"><span class="institution">Stanford</span></div></div></section>

          <section><div class="languages-list"><div class="language-item">English</div><div class="language-item">Spanish</div><div class="language-item">French</div></div></section>

        </aside>

      </div>

    `;

    const result = balanceTwoColumnLayout(rendered, {

      htmlTemplate: twoColumnTemplate,

      sidebarAdequateRatio: 0.5,

      emptySpaceRatio: 0.25,

    });

    // With a relatively tall sidebar vs short main, no moves expected.

    expect(result.moved.length).toBe(0);

  });



  it('injectSidebarBalanceIntoHtml returns html string', () => {

    const html = injectSidebarBalanceIntoHtml(longMainShortSidebarHtml(), {

      htmlTemplate: twoColumnTemplate,

    });

    expect(typeof html).toBe('string');

    expect(html.length).toBeGreaterThan(100);

  });

  it('luxury-burgundy-gold-executive keeps projects in main when main is taller than sidebar', () => {
    const templateId = 'luxury-burgundy-gold-executive';
    const htmlTemplate = `
      <div class="resume-container lbge-resume">
        <div class="lbge-body">
          <aside class="lbge-sidebar">
            <section class="lbge-section lbge-section--contact"><div class="lbge-contact-list"></div></section>
            <section class="lbge-section lbge-section--skills"><div class="skills-list psp-skill-item"></div></section>
          </aside>
          <main class="lbge-main">
            <section class="lbge-section lbge-section--summary"><p class="summary-text">Summary</p></section>
            <section class="lbge-section lbge-section--experience"><div class="experience-list"><div class="experience-item"><div class="experience-header"><h3>Role</h3><span class="company">Co</span></div><div class="description"><ul><li>One</li><li>Two</li><li>Three</li></ul></div></div></div></section>
            <section class="lbge-section lbge-section--projects"><div class="projects-list"><div class="project-item"><h3>Project A</h3><p class="description">Desc</p></div></div></section>
            <section class="lbge-section lbge-section--achievements"><div class="achievements-list"><div class="achievement-item"><h3>Award</h3></div></div></section>
          </main>
        </div>
      </div>`;

    const experienceItems = Array.from({ length: 6 }, (_, i) => `
      <div class="experience-item">
        <div class="experience-header"><h3>Role ${i}</h3><span class="company">Company ${i}</span><span class="duration">2018-24</span></div>
        <div class="description"><ul>${Array.from({ length: 8 }, (_, j) => `<li>Bullet ${j} with enough text for height estimation</li>`).join('')}</ul></div>
      </div>`).join('');

    const rendered = htmlTemplate.replace(
      '<div class="experience-list"><div class="experience-item">',
      `<div class="experience-list">${experienceItems}<div class="experience-item" style="display:none">`
    );

    const result = balanceTwoColumnLayout(rendered, {
      htmlTemplate,
      templateId,
      sidebarAdequateRatio: 0.5,
      emptySpaceRatio: 0.1,
      minGapPx: 40,
    });

    expect(result.moved.some((m) => m.kind === 'projects')).toBe(false);
    const mainHtml = result.html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';
    const asideHtml = result.html.match(/<aside[^>]*>([\s\S]*?)<\/aside>/i)?.[1] ?? '';
    expect(mainHtml).toMatch(/lbge-section--projects/);
    expect(asideHtml).not.toMatch(/lbge-section--projects|project-item/);
  });

});


