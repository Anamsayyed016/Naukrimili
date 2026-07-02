import {
  extractSkillsIntelligence,
  extractSkillsWithMeta,
  toCanonicalSkills,
  normalizeSkillAlias,
  isValidSkillCandidate,
} from '@/lib/resume-parser/custom/skills-intelligence';

describe('custom skills intelligence engine', () => {
  it('skills section — normalize aliases and categorize', () => {
    const result = extractSkillsWithMeta({
      skillsSectionText: [
        'Technical Skills',
        'Languages: Python, JavaScript, TypeScript',
        'Frameworks: ReactJS, NodeJS, ExpressJS',
        'Databases: PostgreSQL, MongoDB',
        'Cloud: AWS, Docker',
      ].join('\n'),
    });

    expect(result.skills.length).toBeGreaterThanOrEqual(8);
    const names = result.skills.map((s) => s.name);
    expect(names).toEqual(expect.arrayContaining(['Python', 'JavaScript', 'React', 'Node.js']));
    expect(result.canonical).toEqual(toCanonicalSkills(result.skills));
    expect(result.canonical.length).toBe(result.skills.length);
  });

  it('alias normalization', () => {
    expect(normalizeSkillAlias('ReactJS')).toBe('React');
    expect(normalizeSkillAlias('NodeJS')).toBe('Node.js');
    expect(normalizeSkillAlias('TailwindCSS')).toBe('Tailwind CSS');
    expect(normalizeSkillAlias('Py')).toBe('Python');
    expect(normalizeSkillAlias('Javascript')).toBe('JavaScript');
  });

  it('multi-source boost — experience + skills section', () => {
    const result = extractSkillsIntelligence({
      skillsSectionText: 'Python, Django, React',
      experienceTechnologies: [['Python', 'Django', 'PostgreSQL']],
      projectTechnologies: [['React', 'Next.js']],
    });

    const python = result.find((s) => s.name === 'Python');
    expect(python).toBeTruthy();
    expect(python?.sources).toEqual(expect.arrayContaining(['skills_section', 'experience']));
    expect(python?.frequency).toBeGreaterThanOrEqual(2);
    expect(python?.importance).toBeGreaterThan(50);
  });

  it('stores all skills — no hard cap', () => {
    const many = Array.from({ length: 28 }, (_, i) => `Skill${i + 1}`);
    const result = extractSkillsWithMeta({
      skillsSectionText: many.join(', '),
    });
    expect(result.skills.length).toBeGreaterThanOrEqual(20);
    expect(result.canonical.length).toBe(result.skills.length);
  });

  it('rejects companies and headings', () => {
    expect(isValidSkillCandidate('Infosys Technologies Ltd')).toBe(false);
    expect(isValidSkillCandidate('Technical Skills')).toBe(false);
    expect(isValidSkillCandidate('Bhopal')).toBe(false);
  });

  it('rejects sentence fragments', () => {
    const { skills, rejectedCount } = extractSkillsWithMeta({
      skillsSectionText:
        'Responsible for developing scalable REST APIs using Python and Django for enterprise clients.',
    });
    expect(skills.length).toBeLessThanOrEqual(3);
    expect(rejectedCount).toBeGreaterThanOrEqual(0);
  });

  it('soft skills categorization', () => {
    const result = extractSkillsIntelligence({
      skillsSectionText: 'Soft Skills: Communication, Leadership, Teamwork',
    });
    const comm = result.find((s) => /communication/i.test(s.name));
    expect(comm?.category).toBe('Soft Skills');
  });

  it('summary and education scan', () => {
    const result = extractSkillsIntelligence({
      summaryText: 'Experienced with Python, FastAPI, and AWS cloud services.',
      educationCoursework: [['Data Structures', 'Algorithms', 'Machine Learning']],
    });
    expect(result.some((s) => s.name === 'Python')).toBe(true);
    expect(result.some((s) => s.sources.includes('summary'))).toBe(true);
  });
});
