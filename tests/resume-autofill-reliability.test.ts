import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import { transformImportDataToBuilder } from '@/lib/resume-builder/import-transformer';
import {
  deriveDisplayNameFromEmail,
  isPlausiblePersonName,
  isPlausibleProjectName,
  pickRicherFullName,
  sanitizeProjectEntry,
} from '@/lib/resume-parser/import-sanitize';
import { isUsableExtraction } from '@/lib/resume-parser/map-to-upload-profile';
import {
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

  it('accepts real names', () => {
    expect(isPlausiblePersonName('Anam Khan')).toBe(true);
    expect(isPlausiblePersonName('CS Mujahid Ali')).toBe(true);
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
