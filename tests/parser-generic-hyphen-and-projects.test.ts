import { splitOnFieldSeparatorDash } from '@/lib/resume-parser/field-separator-dash';
import { detectDesignationFromLine } from '@/lib/resume-parser/custom/experience-extraction/designation';
import { extractExperiencesFromSection } from '@/lib/resume-parser/custom/experience-extraction';
import { extractProjectsFromSection } from '@/lib/resume-parser/custom/project-extraction';
import { extractEducationFromSection } from '@/lib/resume-parser/custom/education-extraction';
import { detectResumeSections } from '@/lib/resume-parser/custom/section-detection';
import { isMisclassifiedExperienceProject } from '@/lib/resume-parser/import-sanitize';
import { prepareResumeTextForParsing } from '@/lib/resume-parser/resume-document-analysis';

describe('field separator dash (compound hyphens)', () => {
  it('does not split Full-Stack compound titles', () => {
    expect(splitOnFieldSeparatorDash('Full-Stack Python Developer')).toBeNull();
    expect(splitOnFieldSeparatorDash('Front-End Engineer')).toBeNull();
  });

  it('splits spaced title – employer separators', () => {
    const parts = splitOnFieldSeparatorDash('Full-Stack Python Developer – Acme Technology');
    expect(parts).toEqual({
      left: 'Full-Stack Python Developer',
      right: 'Acme Technology',
    });
  });

  it('keeps compound designation intact', () => {
    const det = detectDesignationFromLine('Full-Stack Python Developer');
    expect(det.designation).toMatch(/full-stack python developer/i);
  });
});

describe('experience block with designation / company / dates stacked', () => {
  it('maps title, company, and year range without hyphen greed', () => {
    const section = [
      'Full-Stack Python Developer',
      'Mar 2025 – Present',
      'Acme Technology Pvt. Ltd. | Sample City, State',
      'Led design and deployment of full-stack web applications',
      'Full Stack Developer',
      '2020 – 2024',
      'Beta Labs | Sample City',
      'Engineered dynamic web applications',
    ].join('\n');
    const jobs = extractExperiencesFromSection(section);
    expect(jobs.length).toBeGreaterThanOrEqual(2);
    expect(jobs[0].designation).toMatch(/full-stack python developer/i);
    expect(jobs[0].company).toMatch(/acme technology/i);
    expect(jobs[0].company).not.toBe('Full');
    expect(jobs[1].company).toMatch(/beta labs/i);
    expect(String(jobs[1].endDate || '')).toMatch(/2024/);
  });
});

describe('project extraction + builder misclassification guard', () => {
  it('splits consecutive projects without blank lines', () => {
    const section = [
      'Sample Job Portal',
      'TypeScript • Node.js • React.js',
      'Developed dynamic job portal with seamless search. Live Demo →',
      'Cafe Restaurant Website',
      'Django • Python • MySQL',
      'Created responsive restaurant website with bilingual support.',
    ].join('\n');
    const projects = extractProjectsFromSection(section);
    expect(projects.length).toBeGreaterThanOrEqual(2);
    expect(projects.map((p) => p.title).join(' ')).toMatch(/job portal/i);
    expect(projects.map((p) => p.title).join(' ')).toMatch(/restaurant/i);
  });

  it('does not reject real project titles because of prose descriptions', () => {
    expect(
      isMisclassifiedExperienceProject(
        'Sample Job Portal',
        'Developed dynamic job portal with seamless job search and applications spanning many sentences here.'
      )
    ).toBe(false);
  });
});

describe('education degree+institution without dates', () => {
  it('keeps MBA/college rows when specialization is present and dates absent', () => {
    const section = [
      'Master of Business Administration (MBA)',
      "Sample College of Technology (SCT)",
      'Sample State University, City',
      'Specializations: HR and Finance',
      'Bachelor of Computer Applications (BCA)',
      'Leo College, Tribal University',
      'June 2015 – July 2017',
    ].join('\n');
    const edu = extractEducationFromSection(section);
    expect(edu.length).toBeGreaterThanOrEqual(2);
    const mba = edu.find((e) => /mba|business administration/i.test(e.degree || ''));
    expect(mba).toBeDefined();
    expect(mba?.institution).toBeTruthy();
    expect(mba?.institution).not.toMatch(/bachelor/i);
  });
});

describe('combined Certifications & Languages heading', () => {
  it('mirrors body into both section fields', () => {
    const text = [
      'Jane Doe',
      'Engineer',
      'PROFESSIONAL SUMMARY',
      'Experienced engineer.',
      'CERTIFICATIONS & LANGUAGES',
      'Cloud Practitioner – Example Cloud (2024)',
      'Languages: English (Fluent) • Hindi (Native)',
    ].join('\n');
    const prepared = prepareResumeTextForParsing(text);
    const sections = detectResumeSections(prepared.text);
    expect(sections.certifications.length).toBeGreaterThan(10);
    expect(sections.languages.length).toBeGreaterThan(10);
    expect(sections.languages).toMatch(/english/i);
  });
});

describe('single-column ATS is not forced into multi-column', () => {
  it('avoids TYPE_C when there are no dual gutters', () => {
    const text = [
      'JANE DOE',
      'Software Engineer',
      'PROFESSIONAL SUMMARY',
      'Motivated engineer building scalable systems with clean code practices and collaboration.',
      'WORK EXPERIENCE',
      'Software Engineer',
      '2021 – Present',
      'Example Corp',
      'Built APIs and services improving latency for customer facing apps across the platform.',
      'Junior Developer',
      '2019 – 2021',
      'Startup LLC',
      'Shipped features and fixed bugs for mobile and web clients with careful code review.',
    ].join('\n');
    const prepared = prepareResumeTextForParsing(text);
    expect(prepared.profile.primaryType).not.toBe('TYPE_C_MULTI_COLUMN');
  });
});
