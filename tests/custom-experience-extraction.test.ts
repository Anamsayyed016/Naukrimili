import {
  extractExperiencesFromSection,
  extractExperiencesWithMeta,
  toCanonicalExperience,
  parseDateRangeFromText,
  scoreCompanyCandidate,
  isValidExperience,
} from '@/lib/resume-parser/custom/experience-extraction';

describe('custom experience extraction engine', () => {
  it('ATS layout — company, title, dates, bullets', () => {
    const section = [
      'Technoart Pvt Ltd | Bhopal',
      'Full Stack Developer | Mar 2025 - Present',
      '- Designed secure RESTful APIs with Django and PostgreSQL',
      '- Mentored junior developers on code reviews',
      '',
      'Infosys Ltd',
      'Software Engineer | Jan 2022 - Feb 2025',
      '- Built React dashboards for enterprise clients',
    ].join('\n');

    const exps = extractExperiencesFromSection(section);
    expect(exps.length).toBeGreaterThanOrEqual(2);
    expect(exps[0].company).toMatch(/Technoart/i);
    expect(exps[0].designation).toMatch(/Full Stack Developer/i);
    expect(exps[0].current).toBe(true);
    expect(exps[0].bulletPoints.length).toBeGreaterThanOrEqual(2);
    expect(exps[0].technologies).toEqual(expect.arrayContaining(['Django', 'PostgreSQL']));
    expect(exps[0].confidence).toBeGreaterThan(30);

    const canonical = toCanonicalExperience(exps[0]);
    expect(canonical.position).toMatch(/Full Stack Developer/i);
    expect(canonical.achievements?.length).toBeGreaterThanOrEqual(2);
  });

  it('designation-first layout — no fixed company position', () => {
    const section = [
      'Senior Python Developer',
      'Acme Solutions Inc — Remote',
      'June 2020 - December 2023',
      'Led backend migration to microservices.',
      '• Implemented Kafka event streaming',
      '• Reduced API latency by 40%',
    ].join('\n');

    const exps = extractExperiencesFromSection(section);
    expect(exps.length).toBe(1);
    expect(exps[0].designation).toMatch(/Senior Python Developer/i);
    expect(exps[0].company).toMatch(/Acme/i);
    expect(exps[0].startDate).toBeTruthy();
    expect(exps[0].bulletPoints.length).toBe(2);
  });

  it('freelance / founder resume', () => {
    const section = [
      'Founder & CEO',
      'Self Employed | Remote',
      '2021 - Present',
      'Built SaaS product from zero to 500 users.',
    ].join('\n');

    const exps = extractExperiencesFromSection(section);
    expect(exps.length).toBe(1);
    expect(exps[0].designation).toMatch(/Founder/i);
    expect(exps[0].employmentType).toMatch(/Freelance|Self/i);
    expect(exps[0].current).toBe(true);
  });

  it('internship entry', () => {
    const section = [
      'Google',
      'Software Engineering Intern',
      'Summer 2023',
      '- Assisted on search indexing pipeline',
    ].join('\n');

    const exps = extractExperiencesFromSection(section);
    expect(exps.length).toBe(1);
    expect(exps[0].company).toMatch(/Google/i);
    expect(exps[0].designation).toMatch(/Intern/i);
  });

  it('rejects tech-only orphan block', () => {
    const section = [
      'Python, React, AWS, Docker',
    ].join('\n');

    const { experiences, rejectedCount } = extractExperiencesWithMeta(section);
    expect(experiences).toHaveLength(0);
    expect(rejectedCount).toBeGreaterThanOrEqual(1);
  });

  it('rejects bullet sentence misclassified as company', () => {
    expect(scoreCompanyCandidate('Python')).toBe(0);
    expect(scoreCompanyCandidate('React')).toBe(0);
    expect(scoreCompanyCandidate('Bhopal')).toBe(0);
    expect(
      isValidExperience({
        company: 'Designed secure scalable RESTful APIs for the platform.',
        designation: '',
        location: '',
        employmentType: '',
        startDate: null,
        endDate: null,
        current: false,
        description: '',
        bulletPoints: [],
        technologies: [],
        confidence: 0,
        fieldConfidence: {
          company: 10,
          designation: 0,
          location: 0,
          employmentType: 0,
          startDate: 0,
          endDate: 0,
          description: 0,
        },
      })
    ).toBe(false);
  });

  it('date formats — never invents dates', () => {
    expect(parseDateRangeFromText('Jan 2024 - Present')?.current).toBe(true);
    expect(parseDateRangeFromText('01/2024 - 06/2024')?.startDate).toBeTruthy();
    expect(parseDateRangeFromText('2020 - 2023')?.startDate).toBeTruthy();
    expect(parseDateRangeFromText('random text without dates')).toBeNull();
  });

  it('government / academic CV style', () => {
    const section = [
      'Indian Railways',
      'Assistant Engineer',
      'New Delhi, India',
      '2018 - 2024',
      'Managed signaling systems maintenance across northern zone.',
      '• Coordinated with contractors for track upgrades',
    ].join('\n');

    const exps = extractExperiencesFromSection(section);
    expect(exps.length).toBe(1);
    expect(exps[0].company).toMatch(/Indian Railways/i);
    expect(exps[0].location).toMatch(/Delhi|India/i);
  });

  it('multi-entry with blank line separation', () => {
    const section = [
      'TCS',
      'Consultant',
      '2015 - 2018',
      'Client delivery for banking sector.',
      '',
      'Wipro Technologies',
      'Project Manager',
      '2018 - Present',
      'Led cross-functional teams of 12 engineers.',
    ].join('\n');

    const exps = extractExperiencesFromSection(section);
    expect(exps.length).toBe(2);
    expect(exps[0].company).toMatch(/TCS/i);
    expect(exps[1].company).toMatch(/Wipro/i);
  });
});
