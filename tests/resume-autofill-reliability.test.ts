import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import { transformImportDataToBuilder } from '@/lib/resume-builder/import-transformer';
import {
  deriveDisplayNameFromEmail,
  isPlausiblePersonName,
  isPlausibleProjectName,
  pickBestNameFromCandidates,
  pickRicherFullName,
  sanitizeProjectEntry,
} from '@/lib/resume-parser/import-sanitize';
import {
  isAffindaPrimaryAcceptable,
  isDocumentParserAcceptable,
  isUsableExtraction,
  shouldPreferHybridOverAffinda,
} from '@/lib/resume-parser/map-to-upload-profile';
import {
  collectNameCandidatesFromText,
  extractResumeFromText,
  stripLeadingNonResumeContent,
} from '@/lib/resume-parser/text-recovery';

function base(): ExtractedResumeData {
  return {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    skills: [],
    experience: [],
    education: [],
    confidence: 80,
    rawText: '',
  };
}

describe('isPlausiblePersonName', () => {
  it('rejects experience sentence fragments', () => {
    expect(isPlausiblePersonName('turnover of around 1000 Crores)')).toBe(false);
    expect(isPlausiblePersonName('Managed team of 12 engineers')).toBe(false);
  });

  it('rejects email domain fragments', () => {
    expect(isPlausiblePersonName('ail.com')).toBe(false);
    expect(isPlausiblePersonName('gmail.com')).toBe(false);
    expect(isPlausiblePersonName('Ail.com')).toBe(false);
  });

  it('accepts real names', () => {
    expect(isPlausiblePersonName('Anam Khan')).toBe(true);
    expect(isPlausiblePersonName('CS Mujahid Ali')).toBe(true);
    expect(isPlausiblePersonName('Arshil Alam')).toBe(true);
    expect(isPlausiblePersonName('Anam Sayyed')).toBe(true);
  });
});

describe('pickBestNameFromCandidates contact-first', () => {
  it('prefers email local-part over broken domain fragment near contact', () => {
    const winner = pickBestNameFromCandidates(
      [
        { value: 'ail.com', confidence: 88, source: 'near_contact' },
        { value: 'Professional Qualification', confidence: 85, source: 'first_line' },
      ],
      'anamkhan@gmail.com'
    );
    expect(winner).toBe('Anamkhan');
    expect(winner).not.toMatch(/ail\.com|qualification/i);
  });

  it('prefers real header name over email-derived when both valid', () => {
    const winner = pickBestNameFromCandidates(
      [
        { value: 'Anam Sayyed', confidence: 88, source: 'near_contact' },
        { value: 'Anamkhan', confidence: 92, source: 'email_derived' },
      ],
      'anamkhan@gmail.com'
    );
    expect(winner).toBe('Anam Sayyed');
  });
});

describe('pickRicherFullName', () => {
  it('prefers plausible short name over long experience garbage', () => {
    const merged = pickRicherFullName(
      'Anam Khan',
      'turnover of around 1000 Crores)',
      'anamkhan@gmail.com'
    );
    expect(merged).toBe('Anam Khan');
  });

  it('falls back to email-derived name when parser returns garbage', () => {
    const merged = pickRicherFullName(
      '',
      'turnover of around 1000 Crores)',
      'anamkhan@gmail.com'
    );
    expect(merged).toBe('');
    expect(deriveDisplayNameFromEmail('anamkhan@gmail.com')).toBe('Anamkhan');
  });
});

describe('transformImportDataToBuilder name safety', () => {
  it('does not use experience text as display name', () => {
    const transformed = transformImportDataToBuilder({
      fullName: 'turnover of around 1000 Crores)',
      email: 'anamkhan@gmail.com',
      experience: [{ company: 'Acme', position: 'Manager', description: 'Led ops' }],
      skills: ['Leadership'],
    });
    expect(transformed.fullName).not.toMatch(/turnover/i);
    expect(transformed.name).not.toMatch(/turnover/i);
  });

  it('rejects section header mapped as first and last name', () => {
    const transformed = transformImportDataToBuilder({
      fullName: 'Professional Qualification',
      firstName: 'Professional',
      lastName: 'Qualification',
      email: 'anam.khan@example.com',
      experience: [{ company: 'Deloitte', position: 'Audit Manager', description: 'Led audits' }],
      skills: ['Taxation'],
    });
    expect(transformed.firstName).not.toBe('Professional');
    expect(transformed.lastName).not.toBe('Qualification');
    expect(transformed.additionalResumeData?.sectionHeaders || []).toEqual(
      expect.arrayContaining([expect.stringMatching(/professional qualification/i)])
    );
  });

  it('rejects Self Practise Bhopal and uses email-derived name for anamsayyed58@gmail.com', () => {
    const transformed = transformImportDataToBuilder({
      fullName: 'Self Practise Bhopal',
      email: 'anamsayyed58@gmail.com',
      phone: '7415566841',
      location: 'Bhopal',
      achievements: ['Managed end-to-end SME', 'DRHP coordination', 'NSE filings'],
      skills: ['Compliance', 'MCA21'],
    });
    expect(transformed.firstName).not.toBe('Self');
    expect(transformed.fullName).not.toBe('Self Practise Bhopal');
    expect(transformed.email).toBe('anamsayyed58@gmail.com');
  });

  it('rejects Academia Th and uses email-derived name for anamsayyed58@gmail.com', () => {
    const transformed = transformImportDataToBuilder({
      fullName: 'Academia Th',
      email: 'anamsayyed58@gmail.com',
      location: 'Subhash Nagar, Indore',
      experience: [
        {
          company: '(A Ruchi Group Company with',
          position: 'turnover of around 1000 Crores)',
          startDate: '2019-01',
          endDate: 'Present',
          description: 'Heading Secretarial Department',
        },
      ],
      skills: ['Compliance'],
    });
    expect(transformed.firstName).not.toBe('Academia');
    expect(transformed.fullName).not.toBe('Academia Th');
    expect(transformed.experience?.length ?? 0).toBe(0);
    expect(transformed.jobTitle || '').not.toMatch(/turnover|crores/i);
  });

  it('rejects compliance officer and board member as contact name', () => {
    for (const bad of ['Compliance Officer', 'Legal Head', 'Board Member', 'Company Secretary']) {
      const transformed = transformImportDataToBuilder({
        fullName: bad,
        email: 'test.user@example.com',
        experience: [{ company: 'Acme', position: 'Manager', description: 'Led team' }],
        skills: ['Leadership'],
      });
      expect(transformed.firstName).not.toBe(bad.split(' ')[0]);
      expect(transformed.fullName).not.toBe(bad);
    }
  });

  it('splits Arshil Alam and Anam Sayyed correctly', () => {
    for (const [full, first, last] of [
      ['Arshil Alam', 'Arshil', 'Alam'],
      ['Anam Sayyed', 'Anam', 'Sayyed'],
    ] as const) {
      const transformed = transformImportDataToBuilder({
        fullName: full,
        email: 'test@example.com',
        experience: [{ company: 'Acme', position: 'Engineer', description: 'Built APIs' }],
        skills: ['TypeScript'],
      });
      expect(transformed.firstName).toBe(first);
      expect(transformed.lastName).toBe(last);
    }
  });

  it('does not let client text recovery override validated API fullName', () => {
    const rawText = [
      'ail.com',
      'anamkhan@gmail.com',
      'Professional Qualification',
      '',
      'Experience',
      'Acme Corp',
      'Engineer',
      '2020 - Present',
    ].join('\n');
    const transformed = transformImportDataToBuilder({
      fullName: 'Anam Khan',
      email: 'anamkhan@gmail.com',
      rawText,
      experience: [{ company: 'Acme', position: 'Engineer', description: 'Led team' }],
      skills: ['Leadership'],
    });
    expect(transformed.firstName).toBe('Anam');
    expect(transformed.lastName).toBe('Khan');
    expect(transformed.fullName).toBe('Anam Khan');
  });

  it('rejects CS Articleship as contact name', () => {
    const transformed = transformImportDataToBuilder({
      fullName: 'CS Articleship',
      firstName: 'CS',
      lastName: 'Articleship',
      email: 'mujahid.ali@example.com',
      experience: [{ company: 'ABC Corp', position: 'Company Secretary', description: 'Compliance' }],
      skills: ['Corporate Law'],
    });
    expect(transformed.firstName).not.toBe('CS');
    expect(transformed.lastName).not.toBe('Articleship');
    expect(transformed.firstName || transformed.lastName).toMatch(/mujahid|ali/i);
  });
});

describe('isAffindaPrimaryAcceptable', () => {
  it('rejects executive layout with stub experience for Affinda primary', () => {
    const extracted = {
      ...base(),
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      experience: [
        {
          company: '',
          position: 'Managing Director',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          description: '',
          achievements: [],
        },
      ],
      rawText: 'x'.repeat(400),
    };
    const layout = {
      primaryType: 'TYPE_B_EXECUTIVE' as const,
      types: ['TYPE_B_EXECUTIVE' as const],
      signals: {
        coverLetterDetected: false,
        executiveLayout: true,
        multiColumnLikely: false,
        sidebarLikely: false,
        imageHeavyLikely: false,
        scannedLikely: false,
      },
    };
    expect(isUsableExtraction(extracted)).toBe(true);
    expect(shouldPreferHybridOverAffinda(extracted, layout).prefer).toBe(true);
    expect(isAffindaPrimaryAcceptable(extracted, layout)).toBe(false);
    expect(isDocumentParserAcceptable(extracted)).toBe(true);
  });
});

describe('collectNameCandidatesFromText labeled names', () => {
  it('finds Name : label near footer contact block', () => {
    const text = [
      'Professional Experience',
      'Acme Corp — Engineer',
      '2020 - Present',
      '',
      'Contact',
      'Email: neha@example.com',
      'Name : Neha Singh',
    ].join('\n');
    const winner = pickBestNameFromCandidates(collectNameCandidatesFromText(text), 'neha@example.com');
    expect(winner).toBe('Neha Singh');
  });
});

describe('isUsableExtraction', () => {
  it('rejects summary-only Affinda parse (cover letter page)', () => {
    const coverLetterOnly = {
      ...base(),
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      summary: 'I am writing to apply for the position. '.repeat(8),
      rawText: 'Dear Hiring Manager\n\nI am writing to apply...'.repeat(10),
      confidence: 90,
    };
    expect(isUsableExtraction(coverLetterOnly)).toBe(false);
  });

  it('accepts parse with experience', () => {
    const good = {
      ...base(),
      fullName: 'Jane Doe',
      experience: [
        {
          company: 'Acme',
          position: 'Engineer',
          location: '',
          startDate: '2020',
          endDate: '',
          current: true,
          description: '',
          achievements: [],
        },
      ],
      rawText: 'x'.repeat(250),
    };
    expect(isUsableExtraction(good)).toBe(true);
  });
});

describe('stripLeadingNonResumeContent', () => {
  it('removes cover letter page before experience section', () => {
    const input = [
      'Dear Hiring Manager,',
      'I am writing to apply for the Senior Engineer role.',
      'Subject: Application for Senior Engineer',
      '',
      'Sincerely,',
      'Jane Doe',
      '',
      'Jane Doe',
      'Senior Engineer',
      'jane@example.com',
      '',
      'Professional Journey',
      'Acme Corp — Engineer',
      '2020 - Present',
      'Built APIs and led team.',
    ].join('\n');

    const trimmed = stripLeadingNonResumeContent(input);
    expect(trimmed).toMatch(/Professional Journey/i);
    expect(trimmed).not.toMatch(/Dear Hiring Manager/i);
  });

  it('leaves standard resumes unchanged', () => {
    const input = [
      'John Smith',
      'Software Engineer',
      'john@example.com',
      '',
      'Experience',
      'Beta — Developer',
      '2019 - 2023',
    ].join('\n');
    expect(stripLeadingNonResumeContent(input)).toBe(input);
  });
});

describe('extractAdditionalResumeDataFromText', () => {
  it('captures professional memberships into achievements pipeline', () => {
    const { extractAdditionalResumeDataFromText } = require('@/lib/resume-parser/text-recovery');
    const text = [
      'Rajesh Kumar',
      'rajesh@example.com',
      '',
      'Professional Memberships',
      'Member, Institute of Company Secretaries of India',
      'Associate Member, ICSI',
    ].join('\n');

    const extra = extractAdditionalResumeDataFromText(text);
    expect(extra.memberships.length).toBeGreaterThanOrEqual(1);
    expect(extra.achievements.some((a) => /icsi|company secretaries/i.test(a))).toBe(true);
  });
});

describe('extractResumeFromText achievements', () => {
  it('parses professional achievements section', () => {
    const text = [
      'Anam Khan',
      'anam@example.com',
      '',
      'Professional Achievements',
      'Led statutory audit for Fortune 500 client',
      'Reduced compliance risk by 30% through process redesign',
      '',
      'Experience',
      'Deloitte',
      'Audit Manager',
      '2018 - 2024',
    ].join('\n');

    const parsed = extractResumeFromText(text);
    expect(parsed.achievements?.length).toBeGreaterThanOrEqual(2);
    expect(parsed.achievements?.[0]).toMatch(/audit|compliance/i);
  });
});

describe('extractResumeFromText aliases', () => {
  it('parses Professional Journey as experience', () => {
    const text = [
      'Alex Morgan',
      'alex@example.com',
      '',
      'Professional Journey',
      'Acme Corporation',
      'Lead Engineer',
      'Jan 2020 - Present',
      'Shipped platform features.',
    ].join('\n');

    const parsed = extractResumeFromText(text);
    expect(parsed.experience.length).toBeGreaterThanOrEqual(1);
    expect(parsed.experience[0].company || parsed.experience[0].position).toBeTruthy();
  });

  it('parses Key Engagements as projects', () => {
    const text = [
      'Alex Morgan',
      'alex@example.com',
      '',
      'Key Engagements',
      'Portal Redesign',
      'Led end-to-end redesign for enterprise clients.',
      'React, Node.js',
    ].join('\n');

    const parsed = extractResumeFromText(text);
    expect(parsed.projects?.length).toBeGreaterThanOrEqual(1);
  });
});

describe('isPlausibleProjectName', () => {
  it('rejects description sentences used as project names', () => {
    expect(
      isPlausibleProjectName(
        'Developed a full-stack web application using React and Node for internal teams'
      )
    ).toBe(false);
  });

  it('accepts short project titles', () => {
    expect(isPlausibleProjectName('E-Commerce Portal')).toBe(true);
    expect(isPlausibleProjectName('HR Dashboard')).toBe(true);
  });
});

describe('sanitizeProjectEntry', () => {
  it('does not use description sentence as project name', () => {
    const entry = sanitizeProjectEntry(
      {
        name: 'Developed a scalable API gateway for microservices using Django',
        description: 'Handled auth and rate limiting',
        technologies: ['Django', 'Redis'],
      },
      0
    );
    expect(entry?.name).toBe('Software Project');
    expect(entry?.description).toMatch(/API gateway|auth/i);
  });
});

describe('resume preview data binding', () => {
  it('coalesceFormDataForTemplateRender falls back when canonical array is empty', async () => {
    const { coalesceFormDataForTemplateRender } = await import(
      '@/lib/resume-builder/section-visibility'
    );
    const coalesced = coalesceFormDataForTemplateRender({
      firstName: 'Anam',
      lastName: 'Sayyed',
      experience: [],
      'Work Experience': [{ title: 'Engineer', company: 'Acme Corp', description: 'Built APIs' }],
      education: [],
      Education: [{ degree: 'B.Tech', school: 'MIT', year: '2020' }],
      skills: [],
      Skills: ['Python', 'React'],
    });
    expect(coalesced.experience).toHaveLength(1);
    expect(coalesced.education).toHaveLength(1);
    expect(coalesced.skills).toEqual(expect.arrayContaining(['Python', 'React']));
  });

  it('injectResumeData renders experience when only Work Experience alias is populated', async () => {
    const { injectResumeData } = await import('@/lib/resume-builder/template-loader');
    const html = '{{#if EXPERIENCE}}<section>{{EXPERIENCE}}</section>{{/if}}';
    const result = injectResumeData(html, {
      firstName: 'Anam',
      lastName: 'Sayyed',
      experience: [],
      'Work Experience': [
        { title: 'Senior Engineer', company: 'Acme', description: 'Shipped features' },
      ],
    });
    expect(result).toContain('Senior Engineer');
    expect(result).toContain('Acme');
    expect(result).toContain('<section>');
  });

  it('mergeBuilderFormWithParent uses profile arrays when builderFormData sections are empty', () => {
    const transformed = transformImportDataToBuilder({
      firstName: 'Anam',
      lastName: 'Sayyed',
      email: 'anam@example.com',
      experience: [{ company: 'Infosys', position: 'Auditor', description: 'Audits' }],
      education: [{ institution: 'DU', degree: 'MBA', year: '2018' }],
      skills: ['Tally', 'GST'],
      builderFormData: {
        firstName: 'Anam',
        lastName: 'Sayyed',
        email: 'anam@example.com',
        experience: [],
        education: [],
        skills: [],
      },
    });
    expect(transformed.experience.length).toBeGreaterThan(0);
    expect(transformed.education.length).toBeGreaterThan(0);
    expect(transformed.skills.length).toBeGreaterThan(0);
  });

  it('recovers sections from summary bleed when parser arrays are empty (_apiFinalized)', () => {
    const summary = [
      'Software developer with internship experience.',
      '',
      'Education',
      'Bachelor of Computer Application (BCA)',
      'Jan 2025 - Mar 2025',
      '',
      'Experience',
      'Marketing Intern',
      'Assisted in creating and scheduling email campaigns using Mailchimp.',
      '',
      'Skills',
      'HTML, CSS, JavaScript, Mailchimp',
    ].join('\n');

    const transformed = transformImportDataToBuilder({
      firstName: 'Arshil',
      lastName: 'Alam',
      email: 'arshil@example.com',
      summary,
      experience: [],
      education: [],
      skills: [],
      _apiFinalized: true,
    });

    expect(transformed.experience.length + transformed.education.length + transformed.skills.length).toBeGreaterThan(0);
    expect(transformed.summary).not.toMatch(/Mailchimp/i);
  });

  it('transformImportDataToBuilder trims summary bleed when structured sections exist', () => {
    const transformed = transformImportDataToBuilder({
      firstName: 'Anam',
      lastName: 'Sayyed',
      email: 'anam@example.com',
      summary: 'Experienced developer.\n\nExperience\nAcme Corp — Engineer',
      experience: [{ company: 'Acme Corp', position: 'Engineer', description: 'Built APIs' }],
      education: [],
      skills: ['Python'],
      _apiFinalized: true,
    });
    expect(transformed.summary).toBe('Experienced developer.');
    expect(transformed.experience).toHaveLength(1);
  });

  it('routes misplaced achievement bleed into education and experience sections', () => {
    const transformed = transformImportDataToBuilder({
      email: 'cs.candidate@example.com',
      phone: '+91 98765 43210',
      rawText: [
        'CS Mujahid Ali',
        'cs.candidate@example.com',
        '+91 98765 43210',
        '',
        '2. EDUCATION',
        'COMPANY SECRETARY (CS)',
        'MASTERS OF BUSINESS ADMINISTRATION (MBA)',
        '',
        'M/S. RSR & ASSOCIATES (PCS FIRM) BHOPAL',
        'MCA/21 Portal',
        'ROC/E-Filing',
      ].join('\n'),
      achievements: [
        '2. EDUCATION',
        'COMPANY SECRETARY (CS)',
        'MASTERS OF BUSINESS ADMINISTRATION (MBA)',
        'M/S. RSR & ASSOCIATES (PCS FIRM) BHOPAL',
        'MCA/21 Portal',
        'ROC/E-Filing',
      ],
      experience: [],
      education: [{ institution: 'M/S. RSR & ASSOCIATES (PCS FIRM) BHOPAL', degree: '' }],
      skills: [],
    });

    expect(transformed.achievements).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^2\.\s*EDUCATION/i)])
    );
    expect(transformed.education.some((e: { degree?: string }) => /company secretary|mba/i.test(String(e.degree || '')))).toBe(true);
    expect(transformed.experience.some((e: { company?: string }) => /RSR/i.test(String(e.company || '')))).toBe(true);
    expect(transformed.skills.some((s: string) => /MCA\/21|ROC/i.test(s))).toBe(true);
    expect(transformed.email).toBe('cs.candidate@example.com');
    expect(transformed.phone).toMatch(/98765/);
  });
});
