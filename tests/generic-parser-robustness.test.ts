import { extractExperiencesFromSection } from '@/lib/resume-parser/custom/experience-extraction';
import { extractEducationFromSection } from '@/lib/resume-parser/custom/education-extraction';
import { extractLanguagesFromSection } from '@/lib/resume-parser/custom/language-extraction';
import {
  isPlausibleExperienceCompany,
  isPlausiblePersonName,
  isPlausibleProjectName,
  pickRicherFullName,
  recoverLanguagesFromPersonalDetails,
  recoverLocationFromImportText,
  splitExperienceEntriesWithEmbeddedJobs,
} from '@/lib/resume-parser/import-sanitize';
import { looksLikeSentenceNotCompany, looksLikeInstitutionalEmployer } from '@/lib/resume-parser/custom/experience-extraction/company';
import { sanitizeIdentityField } from '@/lib/resume-parser/custom/identity-extraction/validate';

describe('generic resume parser robustness', () => {
  it('rejects duty prose and ISO standards fragments as employers', () => {
    expect(
      looksLikeSentenceNotCompany(
        'To ensure the quality of conformance through planning, establishing systems'
      )
    ).toBe(true);
    expect(isPlausibleExperienceCompany('Authorized signatory for ISO/IEC 17025')).toBe(false);
    expect(isPlausibleExperienceCompany('Training of Employees for ISO 14001')).toBe(false);
    expect(isPlausibleExperienceCompany('Acme Transformers (Global) Pvt. Ltd')).toBe(true);
  });

  it('merges Roles & Responsibilities bodies onto sparse tenure headers', () => {
    const section = [
      'Experience Summary:',
      '07 Year experience as a Deputy Quality Manager at M/s Acme Transformers (Global) Pvt. Ltd.',
      '03 years experience as a Project Engineer at M/s Acme Transformers Ltd.',
      'Quality Deputy Manager Roles & Responsibilities',
      'To ensure the quality of conformance through planning and establishing systems.',
      'To carry out inspection at receiving, in process, the final stage, and maintain the record.',
      'Project Engineer Roles & Responsibilities',
      'To coordinate plant erection activities and vendor development for new projects.',
    ].join('\n');

    const exps = extractExperiencesFromSection(section);
    expect(exps.length).toBeGreaterThanOrEqual(2);
    expect(exps[0].company).toMatch(/Acme Transformers \(Global\)/i);
    expect(exps[0].designation).toMatch(/Deputy Quality Manager/i);
    expect(
      (exps[0].description || '').length + (exps[0].bulletPoints || []).join('').length
    ).toBeGreaterThan(40);
    expect(exps[1].company).toMatch(/Acme Transformers Ltd/i);
  });

  it('prefers multi-token document names over vanity email-derived names', () => {
    const email = 'allam.tesla@gmail.com';
    expect(isPlausiblePersonName('MOHAMMED SARFARAZ ALLAM')).toBe(true);
    expect(sanitizeIdentityField('fullName', 'MOHAMMED SARFARAZ ALLAM')).toMatch(/MOHAMMED/i);
    expect(pickRicherFullName('MOHAMMED SARFARAZ ALLAM', 'Allam Tesla', email)).toMatch(
      /MOHAMMED SARFARAZ ALLAM/i
    );
    expect(pickRicherFullName('Allam Tesla', 'MOHAMMED SARFARAZ ALLAM', email)).toMatch(
      /MOHAMMED SARFARAZ ALLAM/i
    );
  });

  it('detects High Secondary school rows and Speak/Read/Write language grids', () => {
    const eduSection = [
      'B.E. (Electrical and Electronics) From Corporate Institute of Science & Technology, Bhopal',
      'with 68 %.',
      'High Secondary',
      'from Satyam Convent H.Sec. School, Bhopal, Madhya Pradesh Board, Bhopal',
    ].join('\n');
    const edus = extractEducationFromSection(eduSection);
    expect(edus.some((e) => /B\.E/i.test(e.degree))).toBe(true);
    expect(edus.some((e) => /High Secondary/i.test(e.degree))).toBe(true);

    const langs = recoverLanguagesFromPersonalDetails(
      'Speak Read Write English Hindi Urdu Passport No. Date of issue'
    );
    expect(langs.map((l) => l.toLowerCase()).sort()).toEqual(['english', 'hindi', 'urdu']);
    expect(extractLanguagesFromSection('Speak Read Write English Hindi Urdu').length).toBeGreaterThanOrEqual(
      2
    );
  });

  it('does not treat school-stage labels as project titles', () => {
    expect(isPlausibleProjectName('High Secondary')).toBe(false);
    expect(isPlausibleProjectName('M.P. in 2008.')).toBe(false);
  });

  it('does not split experience on ISO standards colon versions', () => {
    const rows = splitExperienceEntriesWithEmbeddedJobs([
      {
        company: 'Acme Transformers Ltd',
        position: 'Quality Manager',
        description: [
          'Authorized signatory for ISO/IEC 17025:2017 for PT/VT.',
          'Training of Employees for ISO 14001:2015 and ISO 45001:2018.',
          'To monitor the Implementation of CA and PA.',
        ].join('\n'),
      },
    ]);
    expect(rows.length).toBe(1);
    expect(String(rows[0].company)).toMatch(/Acme Transformers/i);
  });

  it('recovers preferred location without declaration bleed', () => {
    const loc = recoverLocationFromImportText(
      'Preferred location : Anywhere in the world. Declaration: I hereby declare that the details are correct.'
    );
    expect(loc.toLowerCase()).toContain('anywhere');
    expect(loc.toLowerCase()).not.toContain('declare');
  });

  it('does not treat duty prose mentioning systems as institutional employers', () => {
    const dutyLine =
      'Optimized SQL queries and backend systems improving performance by 40%';
    expect(looksLikeSentenceNotCompany(dutyLine)).toBe(true);
    expect(looksLikeInstitutionalEmployer(dutyLine)).toBe(false);
    expect(looksLikeInstitutionalEmployer('Acme Systems Pvt. Ltd.')).toBe(true);
  });

  it('parses stacked title/date/company roles when duty lines mention systems', () => {
    const section = [
      'Full-Stack Python Developer',
      'Mar 2025 – Present',
      'Cybrom Technology Pvt. Ltd. | Bhopal, Madhya Pradesh',
      'Led design and deployment of full-stack web applications using Python.',
      'Designed secure, scalable RESTful APIs reducing data retrieval time.',
      'Optimized SQL queries and backend systems improving performance by 40%.',
      'Mentored junior developers promoting best practices in code quality.',
      'Full Stack Developer',
      '2020 – 2024',
      'Techroot | Bhopal',
      'Engineered dynamic web applications using Python, Django, and React.js.',
    ].join('\n');

    const exps = extractExperiencesFromSection(section);
    expect(exps).toHaveLength(2);
    expect(exps[0].designation).toMatch(/Full-Stack Python Developer/i);
    expect(exps[0].company).toMatch(/Cybrom Technology/i);
    expect(exps[0].startDate).toMatch(/2025/);
    expect(exps[1].designation).toMatch(/Full Stack Developer/i);
    expect(exps[1].company).toMatch(/Techroot/i);
    expect(exps[1].startDate).toMatch(/2020/);
    expect(exps[1].endDate).toMatch(/2024/);
  });

  it('parses inline bullet-separated language proficiency lists', () => {
    const langs = extractLanguagesFromSection('English (Fluent) • Hindi (Native)');
    expect(langs.map((l) => l.name.toLowerCase()).sort()).toEqual(['english', 'hindi']);
  });
});
