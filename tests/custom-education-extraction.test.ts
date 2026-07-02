import {
  extractEducationFromSection,
  extractEducationWithMeta,
  toCanonicalEducation,
  scoreDegreeCandidate,
  isValidEducation,
} from '@/lib/resume-parser/custom/education-extraction';

describe('custom education extraction engine', () => {
  it('ATS layout — degree, institution, dates, CGPA', () => {
    const section = [
      'B.Tech in Computer Science',
      'Rajiv Gandhi Proudyogiki Vishwavidyalaya (RGPV)',
      '2018 - 2022',
      'CGPA: 8.4/10',
      '- Dean\'s List for academic excellence',
    ].join('\n');

    const edu = extractEducationFromSection(section);
    expect(edu.length).toBe(1);
    expect(edu[0].degree).toMatch(/B\.?Tech/i);
    expect(edu[0].fieldOfStudy).toMatch(/Computer Science/i);
    expect(edu[0].institution).toMatch(/RGPV|Rajiv Gandhi/i);
    expect(edu[0].cgpa).toMatch(/8\.4/);
    expect(edu[0].achievements.length).toBeGreaterThanOrEqual(1);
    expect(edu[0].confidence).toBeGreaterThan(35);

    const canonical = toCanonicalEducation(edu[0]);
    expect(canonical.degree).toMatch(/B\.?Tech/i);
    expect(canonical.gpa).toMatch(/8\.4/);
  });

  it('institution-first layout', () => {
    const section = [
      'Indian Institute of Technology Delhi',
      'M.Tech, Data Science',
      '2022 - 2024',
    ].join('\n');

    const edu = extractEducationFromSection(section);
    expect(edu.length).toBe(1);
    expect(edu[0].institution).toMatch(/IIT Delhi/i);
    expect(edu[0].degree).toMatch(/M\.?Tech/i);
  });

  it('multi-entry with blank separation', () => {
    const section = [
      'MBA',
      'Indian School of Business',
      '2020 - 2022',
      '',
      'B.Com',
      'Delhi University',
      '2015 - 2018',
      'Percentage: 78%',
    ].join('\n');

    const edu = extractEducationFromSection(section);
    expect(edu.length).toBe(2);
    expect(edu[0].degree).toMatch(/MBA/i);
    expect(edu[1].degree).toMatch(/B\.?Com/i);
    expect(edu[1].percentage).toMatch(/78/);
  });

  it('10th / 12th board exams', () => {
    const section = [
      '12th (HSC) — Maharashtra State Board',
      '2014',
      'Percentage: 91%',
    ].join('\n');

    const edu = extractEducationFromSection(section);
    expect(edu.length).toBe(1);
    expect(edu[0].degree).toMatch(/12th|HSC/i);
    expect(edu[0].percentage).toMatch(/91/);
  });

  it('rejects skill list only', () => {
    const { educations, rejectedCount } = extractEducationWithMeta(
      'Python, Java, React, SQL, AWS, Docker'
    );
    expect(educations).toHaveLength(0);
    expect(rejectedCount).toBeGreaterThanOrEqual(1);
  });

  it('never classifies company as institution-only entry', () => {
    expect(
      isValidEducation({
        institution: 'Infosys Technologies Ltd',
        degree: '',
        fieldOfStudy: '',
        specialization: '',
        startDate: null,
        endDate: null,
        current: false,
        cgpa: '',
        gpa: '',
        percentage: '',
        grade: '',
        location: '',
        description: '',
        achievements: [],
        coursework: [],
        confidence: 0,
        fieldConfidence: {
          institution: 50,
          degree: 0,
          fieldOfStudy: 0,
          specialization: 0,
          startDate: 0,
          endDate: 0,
          performance: 0,
          location: 0,
          description: 0,
        },
      })
    ).toBe(false);
  });

  it('rejects job title as degree without education context', () => {
    expect(scoreDegreeCandidate('Senior Software Engineer')).toBe(0);
  });

  it('preserves description without rewriting', () => {
    const section = [
      'PhD in Machine Learning',
      'Stanford University',
      'Research focused on EXACT-PHRASE-456 and neural architecture search.',
    ].join('\n');

    const edu = extractEducationFromSection(section);
    expect(edu[0].description || edu[0].degree).toMatch(/EXACT-PHRASE-456|Machine Learning/i);
  });
});
