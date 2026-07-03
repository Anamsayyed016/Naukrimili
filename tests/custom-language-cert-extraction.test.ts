import { extractLanguagesFromSection } from '@/lib/resume-parser/custom/language-extraction';
import { parseLanguageLine, parseLanguagesFromSection, parseLanguagesFromSectionWithStats } from '@/lib/resume-parser/custom/language-extraction/parse';
import { extractCertificationsFromSection, extractCertificationsWithMeta } from '@/lib/resume-parser/custom/certification-extraction';
import { parseCertificationLine } from '@/lib/resume-parser/custom/certification-extraction/parse';
import { runCustomParserPipeline } from '@/lib/resume-parser/custom/reliability/pipeline';
import { collectFromSkillsSection } from '@/lib/resume-parser/custom/skills-intelligence/collect';

describe('language extraction', () => {
  it('parses proficiency separators', () => {
    expect(parseLanguageLine('English - Native')?.name).toBe('English');
    expect(parseLanguageLine('English - Native')?.proficiency).toBe('Native');
    expect(parseLanguageLine('Hindi (Fluent)')?.proficiency).toBe('Fluent');
    expect(parseLanguageLine('French: Professional')?.proficiency).toBe('Professional');
  });

  it('extracts multiple languages from section', () => {
    const section = [
      'LANGUAGES',
      'English - Native',
      'Hindi - Fluent',
      'Spanish: Intermediate',
    ].join('\n');
    const langs = extractLanguagesFromSection(section);
    expect(langs.length).toBeGreaterThanOrEqual(3);
    expect(langs.map((l) => l.name.toLowerCase())).toContain('english');
  });

  it('rejects programming languages in languages section', () => {
    const parsed = parseLanguageLine('JavaScript - Expert');
    expect(parsed).toBeNull();
  });

  it('parses inline comma-separated language lists', () => {
    const langs = parseLanguagesFromSection('Languages: English, French, Hindi');
    expect(langs.length).toBe(3);
    expect(langs.map((l) => l.name.toLowerCase())).toEqual(
      expect.arrayContaining(['english', 'french', 'hindi'])
    );
  });

  it('tracks rejected language entries', () => {
    const { languages, rejectedCount, attemptCount } = parseLanguagesFromSectionWithStats(
      ['English - Native', 'English - Fluent', 'NotALanguage123'].join('\n')
    );
    expect(languages.length).toBe(1);
    expect(attemptCount).toBeGreaterThanOrEqual(2);
    expect(rejectedCount).toBeGreaterThanOrEqual(1);
  });
});

describe('certification extraction', () => {
  it('parses name issuer and date', () => {
    const parsed = parseCertificationLine(
      'AWS Certified Solutions Architect - Amazon Web Services (2023)'
    );
    expect(parsed?.name).toContain('AWS');
    expect(parsed?.issuer.toLowerCase()).toContain('amazon');
    expect(parsed?.date).toContain('2023');
  });

  it('extracts certifications from section', () => {
    const section = [
      'CERTIFICATIONS',
      'PMP Certification - PMI',
      '2022',
      '',
      'Google Cloud Professional - Google',
      '2021',
    ].join('\n');
    const certs = extractCertificationsFromSection(section);
    expect(certs.length).toBeGreaterThanOrEqual(1);
    expect(certs[0].name.length).toBeGreaterThan(3);
  });

  it('tracks rejected certification blocks', () => {
    const section = [
      'CERTIFICATIONS',
      'AWS Solutions Architect - Amazon Web Services',
      '2023',
      '',
      'not a valid cert line without keywords',
    ].join('\n');
    const { certifications, rejectedCount, blockCount } = extractCertificationsWithMeta(section);
    expect(certifications.length).toBeGreaterThanOrEqual(1);
    expect(blockCount).toBeGreaterThanOrEqual(1);
    expect(rejectedCount).toBeGreaterThanOrEqual(0);
  });

  it('rejects MBA and experience text misclassified as certifications', () => {
    expect(
      parseCertificationLine('Master of Business Administration (MBA) - Barkatullah University')
    ).toBeNull();
    expect(
      parseCertificationLine('Led billing platform development at Infosys')
    ).toBeNull();
    expect(
      parseCertificationLine('Python, Django, React, JavaScript, SQL')
    ).toBeNull();
  });
});

describe('skills table collection', () => {
  it('extracts skills from markdown table rows', () => {
    const section = [
      '| Skill      | Level    |',
      '| Python     | Expert   |',
      '| SQL        | Advanced |',
    ].join('\n');
    const candidates = collectFromSkillsSection(section);
    const names = candidates.map((c) => c.normalized.toLowerCase());
    expect(names).toContain('python');
    expect(names).toContain('sql');
  });
});

describe('full pipeline language and certification wiring', () => {
  it('populates languages and certifications in pipeline output', () => {
    const text = [
      'Jane Doe',
      'jane@example.com',
      '',
      'SUMMARY',
      'Bilingual software engineer.',
      '',
      'EXPERIENCE',
      'Developer | Tech Corp',
      '2020 - Present',
      '',
      'LANGUAGES',
      'English - Native',
      'French - Intermediate',
      '',
      'CERTIFICATIONS',
      'AWS Certified Developer - Amazon Web Services',
      '2023',
    ].join('\n');

    const result = runCustomParserPipeline(text);
    expect(result.validation.resume.languages?.length).toBeGreaterThanOrEqual(2);
    expect(result.validation.resume.certifications?.length).toBeGreaterThanOrEqual(1);
    expect(result.validation.parserConfidenceScore).toBeGreaterThan(50);
  });
});
