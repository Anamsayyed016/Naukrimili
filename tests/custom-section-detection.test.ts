import { detectResumeSections } from '@/lib/resume-parser/custom/section-detection';

function expectCoverageComplete(result) {
  expect(result.coverage.overlaps).toHaveLength(0);
  expect(result.coverage.gaps.filter((g) => g.text.trim().length > 0)).toHaveLength(0);
}

describe('custom section detection engine', () => {
  it('ATS one-column resume — semantic headings', () => {
    const text = [
      'Anam Sayyed',
      'Full-Stack Developer',
      'anam@example.com | +91 9876543210',
      '',
      'Professional Summary',
      'Motivated developer with Python and React experience.',
      '',
      'Work Experience',
      'Technoart Pvt Ltd | Bhopal',
      'Full Stack Developer | Mar 2025 - Present',
      '- Built REST APIs',
      '',
      'Education',
      'B.Tech Computer Science — RGPV 2024',
      '',
      'Technical Skills',
      'Python, Django, React, PostgreSQL, Docker',
    ].join('\n');

    const result = detectResumeSections(text);
    expect(result.summary).toMatch(/Motivated developer/i);
    expect(result.experience).toMatch(/Technoart|REST APIs/i);
    expect(result.education).toMatch(/B\.Tech|RGPV/i);
    expect(result.skills).toMatch(/Python|Django/i);
    expect(result.sections.some((s) => s.type === 'summary')).toBe(true);
    expect(result.sections.some((s) => s.type === 'experience')).toBe(true);
    expectCoverageComplete(result);
  });

  it('synonym headings — Employment History and Core Competencies', () => {
    const text = [
      'Jane Doe',
      '',
      'Employment History',
      'Globex Inc',
      'Analyst | 2019 - 2022',
      '',
      'Academic Qualification',
      'MBA Finance',
      '',
      'Core Competencies',
      'Excel, SQL, Communication, Leadership',
    ].join('\n');

    const result = detectResumeSections(text);
    expect(result.experience).toMatch(/Globex/i);
    expect(result.education).toMatch(/MBA/i);
    expect(result.skills).toMatch(/Excel|SQL/i);
    expectCoverageComplete(result);
  });

  it('two-column style text — sidebar skills + main experience', () => {
    const text = [
      'SKILLS',
      'Java',
      'Spring',
      'AWS',
      '',
      'CONTACT',
      'john@example.com',
      '',
      'PROFESSIONAL EXPERIENCE',
      'Infy Corp',
      'Senior Engineer',
      '2021 - Present',
      'Led migration to cloud',
    ].join('\n');

    const result = detectResumeSections(text);
    expect(result.experience).toMatch(/Infy Corp|Senior Engineer/i);
    expect(result.skills.length + result.preamble.length).toBeGreaterThan(0);
    expectCoverageComplete(result);
  });

  it('unknown headings land in customSections', () => {
    const text = [
      'Alex Rivera',
      '',
      'Research',
      'Published paper on distributed systems at IEEE 2023.',
      '',
      'Hackathons',
      'Won Smart India Hackathon 2022.',
      '',
      'Experience',
      'Startup Labs — Founder',
      '2020 - 2023',
    ].join('\n');

    const result = detectResumeSections(text);
    expect(result.customSections.length).toBeGreaterThanOrEqual(1);
    expect(
      result.customSections.some((c) => /research|hackathon/i.test(c.rawHeading))
    ).toBe(true);
    expect(result.experience).toMatch(/Startup Labs/i);
    expectCoverageComplete(result);
  });

  it('academic CV — publications and volunteer', () => {
    const text = [
      'Dr. Priya Nair',
      '',
      'Publications',
      'Deep Learning for Medical Imaging — Journal 2021',
      '',
      'Volunteer Experience',
      'STEM mentor at local college',
      '',
      'Education',
      'Ph.D. Computer Science, IIT Delhi',
    ].join('\n');

    const result = detectResumeSections(text);
    expect(result.publications).toMatch(/Deep Learning/i);
    expect(result.volunteer).toMatch(/STEM mentor/i);
    expect(result.education).toMatch(/Ph\.D/i);
    expectCoverageComplete(result);
  });

  it('messy OCR spacing and mixed case headings', () => {
    const text = [
      'RAHUL  VERMA',
      'rahul@gmail.com',
      '',
      'PROFESSIONAL   BACKGROUND',
      'Worked at Govt of India project',
      '2018  -  2021',
      '',
      'certifications & TRAINING',
      'AWS Solutions Architect',
    ].join('\n');

    const result = detectResumeSections(text);
    expect(result.experience).toMatch(/Govt of India/i);
    expect(result.certifications).toMatch(/AWS Solutions/i);
    expectCoverageComplete(result);
  });

  it('multi-page style — duplicate section types merge without duplicate lines', () => {
    const text = [
      'Sam Lee',
      '',
      'Experience',
      'Corp A — Engineer — 2020-2022',
      '',
      'Experience',
      'Corp B — Lead — 2022-Present',
      '',
      'Skills',
      'Python, Go',
    ].join('\n');

    const result = detectResumeSections(text);
    expect(result.experience).toMatch(/Corp A/);
    expect(result.experience).toMatch(/Corp B/);
    const corpMatches = result.experience.match(/Corp A/g) ?? [];
    expect(corpMatches.length).toBe(1);
    expectCoverageComplete(result);
  });

  it('creative resume — interests and awards', () => {
    const text = [
      'Maya Singh',
      'UX Designer',
      '',
      'About Me',
      'Designer focused on accessible products.',
      '',
      'Awards',
      'Best Design Award 2023',
      '',
      'Interests',
      'Photography, hiking, open source',
    ].join('\n');

    const result = detectResumeSections(text);
    expect(result.summary).toMatch(/accessible products/i);
    expect(result.achievements).toMatch(/Best Design Award/i);
    expect(result.hobbies).toMatch(/Photography|hiking/i);
    expectCoverageComplete(result);
  });

  it('each detected section has confidence and char offsets', () => {
    const text = [
      'Test User',
      '',
      'Summary',
      'Line one.',
      '',
      'Skills',
      'Java, C++',
    ].join('\n');

    const result = detectResumeSections(text);
    for (const section of result.sections) {
      expect(section.confidence).toBeGreaterThanOrEqual(38);
      expect(section.endIndex).toBeGreaterThan(section.startIndex);
      expect(section.rawHeading.length).toBeGreaterThan(0);
      expect(section.scores.total).toBe(section.confidence);
    }
  });

  it('parseResume delegates to full custom pipeline', async () => {
    const { parseResume } = await import('@/lib/resume-parser/custom');
    const text = [
      'User',
      'user@example.com',
      '',
      'Experience',
      'Software Developer | Acme Corp',
      '2020 - Present',
      '- Built APIs',
      '',
      'Skills',
      'Python, JavaScript',
    ].join('\n');
    const parsed = parseResume(text);
    expect(parsed.experience.length).toBeGreaterThan(0);
    expect(parsed.skills.length).toBeGreaterThan(0);
    expect(parsed.confidence).toBeGreaterThan(0);
  });
});
