import {
  balanceTwoColumnTemplateSections,
  FIXED_COLUMN_SECTIONS,
  MOVABLE_COLUMN_SECTIONS,
} from '@/lib/resume-builder/column-section-balance';

const PLATINUM_SNIPPET = `
<div class="pee-body">
  <main class="pee-main">
    {{#if SUMMARY}}<section class="pee-section"><p>{{SUMMARY}}</p></section>{{/if}}
    {{#if EXPERIENCE}}<section class="pee-section"><div>{{EXPERIENCE}}</div></section>{{/if}}
    {{#if SKILLS}}<section class="pee-section"><div>{{SKILLS}}</div></section>{{/if}}
    {{#if PROJECTS}}<section class="pee-section"><div>{{PROJECTS}}</div></section>{{/if}}
  </main>
  <aside class="pee-sidebar">
    {{#if EDUCATION}}<section class="pee-section pee-section--side"><div>{{EDUCATION}}</div></section>{{/if}}
    {{#if CERTIFICATIONS}}<section class="pee-section pee-section--side"><div>{{CERTIFICATIONS}}</div></section>{{/if}}
    {{#if LANGUAGES}}<section class="pee-section pee-section--side"><div>{{LANGUAGES}}</div></section>{{/if}}
  </aside>
</div>
`;

describe('column-section-balance', () => {
  it('exports fixed and movable section sets', () => {
    expect(FIXED_COLUMN_SECTIONS.has('EXPERIENCE')).toBe(true);
    expect(FIXED_COLUMN_SECTIONS.has('EDUCATION')).toBe(true);
    expect(MOVABLE_COLUMN_SECTIONS.has('SKILLS')).toBe(true);
    expect(MOVABLE_COLUMN_SECTIONS.has('EXPERIENCE')).toBe(false);
  });

  it('returns unchanged HTML for single-column templates', () => {
    const html = '<div class="resume-container"><section>{{#if SUMMARY}}x{{/if}}</section></div>';
    const out = balanceTwoColumnTemplateSections(html, {
      placeholders: { '{{SUMMARY}}': 'Hello' },
      formData: { summary: 'Hello' },
    });
    expect(out).toBe(html);
  });

  it('moves optional sections from main to sidebar when main is taller', () => {
    const placeholders = {
      '{{SUMMARY}}': 'Short summary.',
      '{{EXPERIENCE}}': '<div class="experience-item"><h3>Engineer</h3></div>',
      '{{SKILLS}}': '<span class="skill-tag">A</span>'.repeat(40),
      '{{PROJECTS}}': '<div class="project-item"><h3>P1</h3><p>Long project description here.</p></div>'.repeat(4),
      '{{EDUCATION}}': '<div class="education-item"><h3>BS</h3></div>',
      '{{CERTIFICATIONS}}': '',
      '{{LANGUAGES}}': '<div class="language-item">English</div>',
    };

    const balanced = balanceTwoColumnTemplateSections(PLATINUM_SNIPPET, {
      placeholders,
      formData: {
        summary: 'Short',
        experience: [{ title: 'Engineer', company: 'Acme' }],
        skills: Array.from({ length: 40 }, (_, i) => `Skill${i}`),
        projects: Array.from({ length: 4 }, (_, i) => ({ name: `P${i}`, description: 'Long' })),
        education: [{ degree: 'BS', institution: 'State' }],
        languages: ['English'],
      },
    });

    expect(balanced).not.toBe(PLATINUM_SNIPPET);
    const mainSkills = (balanced.match(/<main[\s\S]*?<\/main>/i) || [''])[0].includes('{{#if SKILLS}}');
    const sideSkills = (balanced.match(/<aside[\s\S]*?<\/aside>/i) || [''])[0].includes('{{#if SKILLS}}');
    expect(mainSkills || sideSkills).toBe(true);
    expect(balanced).toContain('{{#if EXPERIENCE}}');
    expect(balanced).toContain('{{#if EDUCATION}}');
  });

  it('never moves fixed summary or experience blocks', () => {
    const placeholders = {
      '{{SUMMARY}}': 'x',
      '{{EXPERIENCE}}': '<div class="experience-item">Job</div>'.repeat(8),
      '{{SKILLS}}': 'skill',
      '{{EDUCATION}}': 'edu',
    };
    const balanced = balanceTwoColumnTemplateSections(PLATINUM_SNIPPET, {
      placeholders,
      formData: {},
    });
    const main = balanced.match(/<main[\s\S]*?<\/main>/i)?.[0] || '';
    const side = balanced.match(/<aside[\s\S]*?<\/aside>/i)?.[0] || '';
    expect(main).toContain('{{#if SUMMARY}}');
    expect(main).toContain('{{#if EXPERIENCE}}');
    expect(side).not.toContain('{{#if EXPERIENCE}}');
    expect(side).toContain('{{#if EDUCATION}}');
  });
});
