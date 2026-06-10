import {
  classifyResumeDocument,
  prepareResumeTextForParsing,
} from '@/lib/resume-parser/resume-document-analysis';
import {
  collectNameCandidatesFromText,
  extractNameWithConfidence,
  reconstructColumnLayout,
  stripLeadingNonResumeContent,
} from '@/lib/resume-parser/text-recovery';
import {
  isLikelyCompanyName,
  isLikelyJobTitle,
  isPlausiblePersonName,
  isValidExperienceEntry,
  pickBestNameFromCandidates,
} from '@/lib/resume-parser/import-sanitize';

describe('resume document classification', () => {
  it('TYPE_A — standard ATS resume', () => {
    const text = [
      'Anam Khan',
      'Software Engineer',
      'anam@example.com',
      '+91 9876543210',
      '',
      'Experience',
      'Acme Corp',
      'Engineer',
      '2020 - Present',
    ].join('\n');
    const profile = classifyResumeDocument(text);
    expect(profile.types).toContain('TYPE_A_ATS');
  });

  it('TYPE_E — cover letter + resume', () => {
    const text = [
      'Dear Hiring Manager,',
      'Subject: Application for Senior Engineer',
      'I am writing to apply for the role.',
      '',
      'Yours sincerely,',
      'Jane Doe',
      '',
      'Jane Doe',
      'Senior Engineer',
      'jane@example.com',
      '',
      'Professional Experience',
      'Beta Ltd',
      'Lead Developer',
      '2018 - 2024',
    ].join('\n');
    const profile = classifyResumeDocument(text);
    expect(profile.types).toContain('TYPE_E_COVER_LETTER_RESUME');
    const prepared = prepareResumeTextForParsing(text);
    expect(prepared.text).toMatch(/Professional Experience/i);
    expect(prepared.text).not.toMatch(/Dear Hiring Manager/i);
  });

  it('TYPE_B — executive / board resume', () => {
    const text = [
      'BOARD PROFILE',
      'Managing Director with 20 years experience',
      '',
      'Rajesh Sharma',
      'rajesh@example.com',
      '',
      'Executive Summary',
      'Led turnaround initiatives.',
    ].join('\n');
    const profile = classifyResumeDocument(text);
    expect(profile.types).toContain('TYPE_B_EXECUTIVE');
  });

  it('TYPE_D — sidebar layout reconstruction', () => {
    const text = [
      'Priya Nair',
      'priya@example.com',
      '+91 9000012345',
      'Python, SQL',
      'English (Fluent)',
      'Professional Summary',
      'Seasoned data analyst with eight years of experience across banking and fintech.',
      'Experience',
      'HDFC Bank',
      'Senior Analyst',
      '2019 - Present',
    ].join('\n');
    const reconstructed = reconstructColumnLayout(text);
    expect(reconstructed.indexOf('priya@example.com')).toBeLessThan(
      reconstructed.indexOf('Professional Summary')
    );
  });
});

describe('name confidence ranking', () => {
  it('rejects company and designation as candidate name', () => {
    expect(isLikelyCompanyName('Infosys Technologies Ltd')).toBe(true);
    expect(isLikelyJobTitle('Chief Financial Officer')).toBe(true);
    expect(isPlausiblePersonName('Infosys Technologies Ltd')).toBe(false);
    expect(isPlausiblePersonName('Chief Financial Officer')).toBe(false);
    expect(isPlausiblePersonName('turnover of around 1000 Crores)')).toBe(false);
  });

  it('prefers name near email over first-line achievement', () => {
    const text = [
      'Delivered 40% revenue growth across enterprise accounts',
      'Managed P&L of 1000 Crores',
      '',
      'Anam Khan',
      'Chartered Accountant',
      'anamkhan@gmail.com',
      '+91 9876543210',
      '',
      'Experience',
      'Deloitte',
      'Audit Manager',
      '2018 - 2024',
    ].join('\n');

    const best = extractNameWithConfidence(text);
    expect(best).toBe('Anam Khan');
    expect(best).not.toMatch(/crores|revenue|growth/i);
  });

  it('fuses Affinda garbage with Eden good name via confidence', () => {
    const best = pickBestNameFromCandidates(
      [
        { value: 'turnover of around 1000 Crores)', confidence: 72, source: 'affinda' },
        { value: 'Anam Khan', confidence: 68, source: 'eden' },
      ],
      'anamkhan@gmail.com'
    );
    expect(best).toBe('Anam Khan');
  });

  it('collects high-confidence name above email in sidebar resume', () => {
    const candidates = collectNameCandidatesFromText(
      ['CS Mujahid Ali', 'mujahid@example.com', 'Skills', 'Taxation'].join('\n')
    );
    const best = pickBestNameFromCandidates(candidates, 'mujahid@example.com');
    expect(best).toMatch(/Mujahid Ali/i);
  });
});

describe('experience validation', () => {
  it('rejects description-only blocks', () => {
    expect(
      isValidExperienceEntry({
        company: '',
        position: '',
        description: 'Increased sales by 30% across northern region',
      })
    ).toBe(false);
  });

  it('accepts structured employment entries', () => {
    expect(
      isValidExperienceEntry({
        company: 'Deloitte',
        position: 'Audit Manager',
        startDate: '2018',
        endDate: '2024',
      })
    ).toBe(true);
  });
});

describe('cover letter stripping', () => {
  it('detects Yours Faithfully and Subject markers', () => {
    const text = [
      'To,',
      'Dear Sir,',
      'Subject: Application for Company Secretary Role',
      'I am writing to apply.',
      'Yours faithfully,',
      'Applicant',
      '',
      'CS Mujahid Ali',
      'mujahid@example.com',
      'Work Experience',
      'ABC Corp',
      'Company Secretary',
      '2020 - Present',
    ].join('\n');
    const trimmed = stripLeadingNonResumeContent(text);
    expect(trimmed).toMatch(/CS Mujahid Ali|Work Experience/i);
    expect(trimmed).not.toMatch(/Dear Sir/i);
  });
});
