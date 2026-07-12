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

  it('rejects industry section header mapped as firstName', () => {
    const transformed = transformImportDataToBuilder({
      firstName: 'MANUFACTURING',
      email: 'anam.khan@example.com',
      experience: [{ company: 'Deloitte', position: 'Audit Manager', description: 'Led audits' }],
      skills: ['Taxation'],
    });
    expect(transformed.firstName).not.toMatch(/manufacturing/i);
    expect(transformed.jobTitle).not.toMatch(/manufacturing/i);
  });

  it('does not use generic Professional as jobTitle when experience has a role', () => {
    const transformed = transformImportDataToBuilder({
      email: 'cs.candidate@example.com',
      skills: ['ROC', 'RBI filings', 'MCA21'],
      experience: [
        {
          company: 'MA, ASP & ASSOCIATES',
          position: 'Company Secretary',
          description: 'Handled compliance and board meetings',
        },
      ],
      education: [{ institution: 'MA, ASP & ASSOCIATES', degree: '' }],
    });
    expect(transformed.jobTitle).not.toBe('Professional');
    expect(transformed.jobTitle).toMatch(/secretary/i);
    const eduInstitutions = (transformed.education || []).map((e: { institution?: string; school?: string }) =>
      String(e.institution || e.school || '')
    );
    expect(eduInstitutions.join(' ')).not.toMatch(/associates/i);
  });

  it('rejects corporate conversion phrase as contact name and filters skill bleed', () => {
    const transformed = transformImportDataToBuilder({
      fullName: 'Company Into Public Limited',
      firstName: 'Company',
      lastName: 'Into Public Limited',
      email: 'cs.candidate@example.com',
      skills: ['AMFI', 'Compliance', 'Conversion From Private To'],
      experience: [
        {
          company: 'Company Into Public Limited',
          position: 'conversion of Private Limited',
          description: 'Handled conversion filings',
        },
      ],
      achievements: ['MASTER OF BUSINESS ADMINISTRATION (MBA)', 'Conversion From Private To'],
    });
    expect(transformed.fullName).not.toMatch(/company into public/i);
    expect(transformed.firstName).not.toMatch(/company/i);
    expect((transformed.skills || []).join(' ')).not.toMatch(/conversion from private/i);
    expect((transformed.achievements || []).join(' ')).not.toMatch(/master of business/i);
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

describe('transformImportDataToBuilder volunteer misroute reconciliation', () => {
  it('reroutes paid employment lines from volunteer buckets into experience', () => {
    const transformed = transformImportDataToBuilder({
      email: 'test@example.com',
      experience: [],
      volunteer: [
        'Accounts Payable Analyst at Infosys Pvt. Ltd. | 2019 - Present',
        'STEM mentor at local high school',
      ],
      additionalResumeData: {
        volunteerWork: ['SAP Consultant at Deloitte | 2018 - 2020'],
      },
      extendedSections: {
        volunteer: ['Manager at ABC Consultancy LLP | 2017 - 2019'],
      },
    });

    expect(transformed.volunteer).toEqual(['STEM mentor at local high school']);
    expect((transformed.additionalResumeData as { volunteerWork?: string[] })?.volunteerWork).toEqual([]);
    expect((transformed.extendedSections as { volunteer?: string[] })?.volunteer).toEqual([]);

    const companies = (transformed.experience || []).map((e: { company?: string }) =>
      String(e.company || '')
    );
    expect(companies.join(' ')).toMatch(/infosys/i);
    expect(companies.join(' ')).toMatch(/deloitte/i);
    expect(companies.join(' ')).toMatch(/abc consultancy/i);
  });
});

describe('transformImportDataToBuilder project preservation', () => {
  it('preserves projects with uncommon titles and descriptions', () => {
    const transformed = transformImportDataToBuilder({
      email: 'test@example.com',
      projects: [
        {
          name: 'Mobile App for Inventory Tracking',
          description: 'Built Flask API and React dashboard for warehouse stock levels.',
        },
        {
          name: 'Job Portal Application',
          description: 'Full-stack hiring platform with Next.js and PostgreSQL.',
        },
      ],
      experience: [{ title: 'Developer', company: 'Acme Corp', description: 'Shipped features' }],
    });

    expect(transformed.projects?.length).toBe(2);
    expect((transformed.projects as Array<{ name: string }>).map((p) => p.name)).toEqual(
      expect.arrayContaining(['Mobile App for Inventory Tracking', 'Job Portal Application'])
    );
  });

  it('preserves projects with bullets only and no technologies or URL', () => {
    const transformed = transformImportDataToBuilder({
      email: 'test@example.com',
      projects: [
        {
          name: 'Vendor Onboarding Platform',
          bullets: ['Designed REST APIs in Node.js', 'Deployed services on AWS with CI/CD'],
        },
      ],
    });

    expect(transformed.projects?.length).toBe(1);
    expect((transformed.projects as Array<{ name: string }>)[0]?.name).toBe(
      'Vendor Onboarding Platform'
    );
  });

  it('preserves short project titles when any project evidence exists', () => {
    const transformed = transformImportDataToBuilder({
      email: 'test@example.com',
      projects: [{ name: 'ERP', description: 'SAP modules for accounts payable workflow.' }],
    });

    expect(transformed.projects?.length).toBe(1);
  });

  it('rehomes only strong employment misfiles with company, title, duration, and responsibilities', () => {
    const transformed = transformImportDataToBuilder({
      email: 'test@example.com',
      projects: [
        {
          name: 'Software Engineer',
          company: 'Digital Solutions Pvt Ltd',
          startDate: '2022-01',
          endDate: 'Present',
          description:
            'Designed secure REST APIs and led sprint planning for finance workflow modules.',
        },
        {
          name: 'Full Stack Developer',
          description: 'Built internal tools with React and Django for operations teams.',
        },
      ],
      experience: [
        {
          title: 'Junior Developer',
          company: 'Other Corp',
          description: 'Maintained legacy apps',
        },
      ],
    });

    expect(transformed.projects?.length).toBe(1);
    expect((transformed.projects as Array<{ name: string }>)[0]?.name).toBe('Full Stack Developer');
    const firstExp = (transformed.experience as Array<{ description?: string }>)[0];
    expect(String(firstExp?.description || '')).toMatch(/Software Engineer|REST APIs/i);
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

  it('rejects job titles misclassified as project names', () => {
    expect(isPlausibleProjectName('Full Stack Python Developer')).toBe(false);
    expect(isPlausibleProjectName('Python Developer')).toBe(false);
  });

  it('accepts short project titles without descriptions', () => {
    expect(isPlausibleProjectName('Cafe Website')).toBe(true);
  });

  it('rejects personal metadata and marital status tokens as project names', () => {
    expect(isPlausibleProjectName('Single')).toBe(false);
    expect(isPlausibleProjectName('Married')).toBe(false);
    expect(isPlausibleProjectName('Marital Status: Single')).toBe(false);
    expect(isPlausibleProjectName('Date of Birth')).toBe(false);
    expect(isPlausibleProjectName('Current')).toBe(false);
  });

  it('rejects fabricated placeholder project titles', () => {
    expect(isPlausibleProjectName('Project 1')).toBe(false);
    expect(isPlausibleProjectName('Project 2')).toBe(false);
    expect(isPlausibleProjectName('Software Project')).toBe(false);
    expect(isPlausibleProjectName('Untitled')).toBe(false);
    expect(isPlausibleProjectName('Unknown')).toBe(false);
  });
});

describe('sanitizeProjectEntry', () => {
  it('drops personal metadata string projects', () => {
    expect(sanitizeProjectEntry('Single', 0)).toBeNull();
    expect(sanitizeProjectEntry('Marital Status: Single', 0)).toBeNull();
    expect(sanitizeProjectEntry({ name: 'Single', description: '' }, 0)).toBeNull();
  });

  it('does not fabricate placeholder titles when name is a description sentence', () => {
    const entry = sanitizeProjectEntry(
      {
        name: 'Developed a scalable API gateway for microservices using Django',
        description: 'Handled auth and rate limiting',
        technologies: ['Django', 'Redis'],
      },
      0
    );
    // No valid title → drop (do not invent "Software Project")
    expect(entry).toBeNull();
  });

  it('keeps real project titles', () => {
    const entry = sanitizeProjectEntry(
      {
        name: 'ERP Migration',
        description: 'Led SAP rollout',
        technologies: ['SAP'],
      },
      0
    );
    expect(entry?.name).toBe('ERP Migration');
    expect(entry?.description).toMatch(/SAP/i);
  });

  it('rejects placeholder Project N / Software Project titles', () => {
    expect(sanitizeProjectEntry({ name: 'Project 1', description: 'Built an app' }, 0)).toBeNull();
    expect(sanitizeProjectEntry({ name: 'Software Project', description: 'Built an app' }, 0)).toBeNull();
    expect(sanitizeProjectEntry({ name: 'Untitled', description: 'Built an app' }, 0)).toBeNull();
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
    // Canonical skills: [] is authoritative — do not revive Skills alias.
    expect(coalesced.skills).toEqual([]);
  });

  it('coalesceFormDataForTemplateRender trusts empty skills after user edit', async () => {
    const { coalesceFormDataForTemplateRender } = await import(
      '@/lib/resume-builder/section-visibility'
    );
    const coalesced = coalesceFormDataForTemplateRender({
      _userEdited: true,
      skills: [],
      Skills: ['Python', 'React'],
      technicalSkills: ['Kubernetes'],
      experience: [],
      'Work Experience': [{ title: 'Engineer', company: 'Acme', description: 'Built APIs' }],
    });
    expect(coalesced.skills).toEqual([]);
    expect(coalesced.Skills).toEqual([]);
    // Same rule for experience: empty canonical after user edit must not revive aliases.
    expect(coalesced.experience).toEqual([]);
  });

  it('coalesceFormDataForTemplateRender falls back to Skills only when skills key is absent', async () => {
    const { coalesceFormDataForTemplateRender } = await import(
      '@/lib/resume-builder/section-visibility'
    );
    const coalesced = coalesceFormDataForTemplateRender({
      firstName: 'Anam',
      Skills: ['Python', 'React'],
      experience: [{ title: 'Engineer', company: 'Acme', description: 'Built APIs' }],
    });
    expect(coalesced.skills).toEqual(expect.arrayContaining(['Python', 'React']));
  });

  it('coalesceFormDataForTemplateRender rejects personal metadata from projects and achievements', async () => {
    const { coalesceFormDataForTemplateRender } = await import(
      '@/lib/resume-builder/section-visibility'
    );
    const coalesced = coalesceFormDataForTemplateRender({
      firstName: 'Test',
      lastName: 'User',
      projects: [
        { name: 'Single', description: '' },
        { name: 'ERP Migration', description: 'Led SAP rollout across finance teams' },
      ],
      achievements: ['Marital Status: Single', 'BPS star performer 2022'],
      experience: [],
      skills: ['Excel'],
    });
    expect((coalesced.projects as Array<{ name: string }>).map((p) => p.name)).toEqual([
      'ERP Migration',
    ]);
    expect(coalesced.achievements).toEqual(['BPS star performer 2022']);
  });

  it('coalesceFormDataForTemplateRender reroutes professional lines out of volunteer', async () => {
    const { coalesceFormDataForTemplateRender } = await import(
      '@/lib/resume-builder/section-visibility'
    );
    const coalesced = coalesceFormDataForTemplateRender({
      firstName: 'Test',
      lastName: 'User',
      experience: [],
      extendedSections: {
        volunteer: [
          'STEM mentor at local high school',
          'Accounts Payable Analyst at Infosys Pvt. Ltd. | 2019 - Present',
        ],
      },
      skills: ['Excel'],
    });
    const volunteer = (coalesced.extendedSections as { volunteer?: string[] })?.volunteer || [];
    expect(volunteer).toEqual(['STEM mentor at local high school']);
    expect((coalesced.experience as Array<{ company?: string }>)[0]?.company).toMatch(/infosys/i);
  });

  it('recoverRenderableSectionsForCoalesce rehomes invalid projects and extracts embedded skills', async () => {
    const {
      recoverRenderableSectionsForCoalesce,
      coalesceFormDataForTemplateRender,
    } = await import('@/lib/resume-builder/section-visibility');

    const recovered = recoverRenderableSectionsForCoalesce({
      experience: [
        {
          title: 'Analyst',
          company: 'Acme Corp',
          achievements: ['Built reports'],
          bullets: ['Built reports'],
        },
      ],
      projects: [
        { name: 'Single', description: 'Marital status metadata' },
        {
          name: 'Managed stakeholder communications across finance teams',
          description: 'Led weekly status reviews',
        },
        {
          name: 'ERP Portal',
          description: 'Implemented SAP modules for AP workflow',
        },
      ],
      skills: ['Excel'],
      achievements: ['Python, SQL, Power BI, Tableau, SAP FICO'],
    });

    expect((recovered.projects as Array<{ name: string }>).map((p) => p.name)).not.toContain(
      'Single'
    );
    expect((recovered.projects as Array<{ name: string }>).map((p) => p.name)).toEqual(
      expect.arrayContaining(['ERP Portal'])
    );
    expect((recovered.projects as Array<{ name: string }>).length).toBe(1);
    expect(recovered.skills).toEqual(
      expect.arrayContaining(['Excel', 'Python', 'SQL', 'Power BI', 'Tableau'])
    );

    const coalesced = coalesceFormDataForTemplateRender({
      firstName: 'Diksha',
      experience: recovered.experience,
      projects: [
        { name: 'Current', description: '' },
        { name: 'Inventory Dashboard', description: 'Built Flask API for stock tracking' },
      ],
      skills: [],
      achievements: ['Python, SQL, Power BI, Tableau'],
    });
    expect((coalesced.projects as Array<{ name: string }>).map((p) => p.name)).toEqual([
      'Inventory Dashboard',
    ]);
    expect(coalesced.skills).toEqual(
      expect.arrayContaining(['Python', 'SQL', 'Power BI', 'Tableau'])
    );
  });

  it('injectResumeData renders project bullets and description from body fields', async () => {
    const { injectResumeData } = await import('@/lib/resume-builder/template-loader');
    const html = '{{PROJECTS}}';
    const result = injectResumeData(html, {
      firstName: 'Test',
      lastName: 'User',
      projects: [
        {
          name: 'ERP Migration',
          bullets: ['Configured SAP modules', 'Trained finance users'],
          description: '',
        },
      ],
      _imported: true,
    });
    expect(result).toContain('ERP Migration');
    expect(result).toContain('Configured SAP modules');
    expect(result).toContain('Trained finance users');
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

  it('coalesceBuilderImportPayload preserves parent experience without full re-sanitize drop', async () => {
    const { coalesceBuilderImportPayload } = await import(
      '@/lib/resume-builder/import-transformer'
    );
    const coalesced = coalesceBuilderImportPayload({
      firstName: 'Anam',
      lastName: 'Sayyed',
      email: 'anam@example.com',
      experience: [
        { company: 'Infosys', position: 'Auditor', description: 'Led statutory audits' },
        { company: 'Deloitte', position: 'Senior Associate', description: 'Compliance reviews' },
      ],
      builderFormData: {
        firstName: 'Anam',
        lastName: 'Sayyed',
        email: 'anam@example.com',
        experience: [],
        education: [{ institution: 'DU', degree: 'MBA', year: '2018' }],
        skills: ['Tally'],
        _imported: true,
      },
    });
    expect(coalesced.experience).toHaveLength(2);
    expect(coalesced.education).toHaveLength(1);
    expect(coalesced.skills).toEqual(expect.arrayContaining(['Tally']));
  });

  it('coalesceBuilderImportPayload does not re-sanitize _imported payload on second pass', async () => {
    const { coalesceBuilderImportPayload } = await import(
      '@/lib/resume-builder/import-transformer'
    );
    const alreadyImported = {
      firstName: 'Anam',
      lastName: 'Sayyed',
      email: 'anam@example.com',
      experience: [
        {
          company: 'Infosys',
          position: 'Auditor',
          title: 'Auditor',
          description: 'Led statutory audits across multiple clients',
        },
        {
          company: 'Deloitte',
          position: 'Senior Associate',
          title: 'Senior Associate',
          description: 'Compliance and risk reviews',
        },
        {
          company: 'KPMG',
          position: 'Analyst',
          title: 'Analyst',
          description: 'Financial analysis and reporting',
        },
      ],
      education: [{ institution: 'DU', degree: 'MBA', year: '2018' }],
      skills: ['Tally', 'GST'],
      _imported: true,
    };
    const secondPass = coalesceBuilderImportPayload(alreadyImported);
    expect(secondPass.experience).toHaveLength(3);
    expect(secondPass.experience[0].company).toMatch(/Infosys/i);
  });

  it('coalesceBuilderImportPayload prefers parent experience when builderFormData experience is empty placeholders', async () => {
    const { coalesceBuilderImportPayload } = await import(
      '@/lib/resume-builder/import-transformer'
    );
    const coalesced = coalesceBuilderImportPayload({
      firstName: 'Anam',
      email: 'anam@example.com',
      experience: [{ company: 'Acme Corp', position: 'Engineer', description: 'Built APIs' }],
      builderFormData: {
        firstName: 'Anam',
        email: 'anam@example.com',
        experience: [{}],
        education: [],
        skills: [],
      },
    });
    expect(coalesced.experience).toHaveLength(1);
    expect(coalesced.experience[0].company).toMatch(/Acme/i);
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

  it('splits compound languages and filters non-measurable achievements', () => {
    const transformed = transformImportDataToBuilder({
      email: 'test@example.com',
      summary: 'Objective: Seeking growth.\n\nProfessional Highlights: 8+ years in logistics.',
      objective: 'Seeking growth.',
      experience: [
        {
          company: 'Acme Logistics',
          position: 'Operations Manager',
          startDate: '2020-01',
          achievements: ['Managed warehouse operations', 'Coordinated shipments daily'],
        },
      ],
      education: [{ degree: 'B.Com', institution: 'Delhi University', year: '2015' }],
      languages: ['Hindi & English'],
      achievements: [
        'Managed warehouse operations',
        'Increased delivery efficiency by 25%',
        'IATA/UFTAA Certified',
      ],
      certifications: [],
      skills: ['Logistics'],
      _apiFinalized: true,
    });

    const langNames = transformed.languages.map((l: { name?: string; language?: string }) =>
      String(l.name || l.language || '').toLowerCase()
    );
    expect(langNames).toContain('hindi');
    expect(langNames).toContain('english');
    expect(transformed.achievements).toEqual(
      expect.arrayContaining([expect.stringMatching(/25%/i)])
    );
    expect(transformed.achievements.some((a: string) => /managed warehouse/i.test(a))).toBe(false);
    expect(transformed.experience[0].achievements.some((a: string) => /managed warehouse/i.test(a))).toBe(true);
    expect(transformed.summary).toMatch(/growth/i);
    expect(transformed.summary).toMatch(/logistics/i);
  });

  it('stripRedundantExperienceDateBodyLines removes date-only body when structured dates exist', async () => {
    const { stripRedundantExperienceDateBodyLines } = await import('@/lib/resume-parser/import-sanitize');
    const stripped = stripRedundantExperienceDateBodyLines(
      '2022-01 - Present\nDesigned secure APIs',
      ['2022-01 - Present', 'Designed secure APIs'],
      { startDate: '2022-01', current: true }
    );
    expect(stripped.description).toContain('Designed secure APIs');
    expect(stripped.description).not.toMatch(/^2022-01 - Present$/);
    expect(stripped.achievements).toContain('Designed secure APIs');
    expect(stripped.achievements.some((line) => /2022-01 - Present/.test(line))).toBe(false);
  });

  it('syncExperienceEntryAliases preserves partial company names when reconcileHeaders is false', async () => {
    const { syncExperienceEntryAliases } = await import(
      '@/lib/resume-builder/experience-entry-sync'
    );
    const entry = {
      title: 'Full Stack Developer',
      company: 'Tech',
      location: 'Bhopal',
      startDate: '2022-01',
      current: true,
    };
    const withReconcile = syncExperienceEntryAliases(entry);
    expect(withReconcile.company).toBe('');

    const editorSafe = syncExperienceEntryAliases(entry, { reconcileHeaders: false });
    expect(editorSafe.company).toBe('Tech');
    expect(editorSafe.Company).toBe('Tech');
    expect(editorSafe.organization).toBe('Tech');
  });

  it('syncExperienceEntryAliases clears orphaned bullets when description is empty', async () => {
    const { syncExperienceEntryAliases } = await import(
      '@/lib/resume-builder/experience-entry-sync'
    );
    const { injectResumeData } = await import('@/lib/resume-builder/template-loader');
    const html = '<div class="experience-list">{{EXPERIENCE}}</div>';

    const withBullets = injectResumeData(html, {
      experience: [
        syncExperienceEntryAliases({
          title: 'Engineer',
          company: 'Acme',
          description: 'Built APIs\nImproved performance',
        }),
      ],
    });
    expect(withBullets).toContain('<li>');
    expect(withBullets).toContain('Built APIs');

    const cleared = injectResumeData(html, {
      experience: [
        syncExperienceEntryAliases({
          title: 'Engineer',
          company: 'Acme',
          description: '',
          achievements: ['Built APIs', 'Improved performance'],
          bullets: ['Built APIs', 'Improved performance'],
        }),
      ],
    });
    expect(cleared).not.toContain('<li>');
    expect(cleared).not.toContain('Built APIs');
    expect(cleared).toContain('Engineer');
  });

  it('reconcileExperienceHeaderFields recovers company from organization when company slot holds title', async () => {
    const { reconcileExperienceHeaderFields } = await import('@/lib/resume-parser/import-sanitize');
    const fixed = reconcileExperienceHeaderFields({
      company: 'Software Engineer',
      organization: 'Google Inc',
      position: '',
      startDate: '2020-01',
      endDate: '2022-12',
    });
    expect(fixed.company).toMatch(/Google/i);
    expect(fixed.position || fixed.title).toMatch(/Software Engineer/i);
  });

  it('coalesceBuilderImportPayload prefers parent experience when builder rows lack company names', async () => {
    const { coalesceBuilderImportPayload } = await import(
      '@/lib/resume-builder/import-transformer'
    );
    const coalesced = coalesceBuilderImportPayload({
      firstName: 'Jane',
      email: 'jane@test.com',
      experience: [
        { company: 'Infosys', position: 'Auditor', description: 'Led audits' },
        { company: 'Deloitte', position: 'Senior Associate', description: 'Compliance' },
        { company: 'KPMG', position: 'Analyst', description: 'Reporting' },
      ],
      builderFormData: {
        firstName: 'Jane',
        email: 'jane@test.com',
        experience: [
          { title: 'Auditor', company: '', description: 'Led audits' },
          { title: 'Senior Associate', company: '', description: 'Compliance' },
          { title: 'Analyst', company: '', description: 'Reporting' },
        ],
        skills: ['Excel'],
        _imported: true,
      },
    });
    expect(coalesced.experience).toHaveLength(3);
    expect(
      coalesced.experience.every((e: { company?: string }) => !!String(e.company || '').trim())
    ).toBe(true);
  });

  it('coalesceBuilderImportPayload prefers parent experience when builder companies are misassigned titles', async () => {
    const { coalesceBuilderImportPayload } = await import(
      '@/lib/resume-builder/import-transformer'
    );
    const coalesced = coalesceBuilderImportPayload({
      experience: [
        {
          company: 'Tata Consultancy Services',
          position: 'Python Developer',
          location: 'Bhopal',
          description: 'Built APIs.',
        },
      ],
      builderFormData: {
        experience: [
          {
            company: 'Stack Developer',
            title: 'Full',
            description: 'Built APIs.',
          },
        ],
        _imported: true,
      },
    });
    expect(coalesced.experience?.[0]?.company).toMatch(/tata consultancy/i);
    expect(coalesced.experience?.[0]?.title || coalesced.experience?.[0]?.position).toMatch(
      /python developer/i
    );
  });
});

describe('experience boundary and pipeline hygiene', () => {
  it('keeps separate experience entries with distinct descriptions', () => {
    const text = [
      'Anam Khan',
      'anam@example.com',
      '',
      'Experience',
      'Infosys Limited',
      'Software Engineer',
      'Jan 2020 - Dec 2022',
      'Built REST APIs for billing platform.',
      'Reduced deployment time by 40%.',
      '',
      'Deloitte India',
      'Senior Consultant',
      'Jan 2023 - Present',
      'Led compliance audits for enterprise clients.',
      'Managed team of 8 analysts.',
    ].join('\n');

    const parsed = extractResumeFromText(text);
    expect(parsed.experience.length).toBeGreaterThanOrEqual(2);
    const infosys = parsed.experience.find((e) => /infosys/i.test(String(e.company || '')));
    const deloitte = parsed.experience.find((e) => /deloitte/i.test(String(e.company || '')));
    expect(infosys?.description || '').toMatch(/billing|REST/i);
    expect(infosys?.description || '').not.toMatch(/compliance audits/i);
    expect(deloitte?.description || '').toMatch(/compliance|analysts/i);
    expect(deloitte?.description || '').not.toMatch(/billing platform/i);
  });

  it('preserves stacked title/company headers including Software Developer designation', () => {
    const text = [
      'Professional Experience',
      'Senior Software Engineer',
      'Google',
      'Jan 2020 - Present',
      '- Built scalable systems',
      'Software Developer',
      'Infosys',
      '2018 - 2019',
      '- Developed APIs',
    ].join('\n');

    const parsed = extractResumeFromText(text);
    expect(parsed.experience).toHaveLength(2);
    expect(parsed.experience[0].company).toMatch(/Google/i);
    expect(parsed.experience[0].position).toMatch(/Senior Software Engineer/i);
    expect(parsed.experience[1].company).toMatch(/Infosys/i);
    expect(parsed.experience[1].position).toMatch(/Software Developer/i);
  });

  it('rejects MBA/education lines misclassified as certifications', async () => {
    const { isPlausibleCertificationEntry, sanitizeCertificationEntry } = await import(
      '@/lib/resume-parser/import-sanitize'
    );
    expect(
      isPlausibleCertificationEntry(
        'Master of Business Administration (MBA)',
        'Sagar Institute of Technology - Barkatullah University, Bhopal'
      )
    ).toBe(false);
    expect(sanitizeCertificationEntry({ name: 'AWS Certified Solutions Architect', issuer: 'Amazon' })).not.toBeNull();
    expect(
      sanitizeCertificationEntry({
        name: 'Master of Business Administration (MBA)',
        issuer: 'Barkatullah University',
      })
    ).toBeNull();
  });

  it('strips AI meta commentary from experience descriptions', async () => {
    const { pruneExperienceBodyFields } = await import('@/lib/resume-parser/import-sanitize');
    const cleaned = pruneExperienceBodyFields(
      'This version keeps all of your original content intact.\nManaged warehouse operations.',
      ['Increased throughput by 20%']
    );
    expect(cleaned.description).not.toMatch(/this version keeps/i);
    expect(cleaned.description).toMatch(/warehouse/i);
    expect(cleaned.achievements[0]).toMatch(/throughput/i);
  });

  it('caps skills at 20 highest-confidence entries', async () => {
    const { normalizeSkillsList } = await import('@/lib/resume-parser/import-sanitize');
    const noisy = [
      'React',
      'JavaScript',
      'TypeScript',
      'Node.js',
      'Python',
      'Django',
      'PostgreSQL',
      'MongoDB',
      'AWS',
      'Docker',
      'Kubernetes',
      'Git',
      'HTML',
      'CSS',
      'SQL',
      'Redis',
      'GraphQL',
      'Bhopal',
      'Managed team operations daily',
      'Infosys Limited',
      'Randomword',
      'Anotherphrase here',
      'Excel',
      'Tableau',
      'Jira',
    ];
    const skills = normalizeSkillsList(noisy);
    expect(skills.length).toBeLessThanOrEqual(20);
    expect(skills).toEqual(expect.arrayContaining(['React', 'JavaScript', 'Python']));
    expect(skills.some((s) => /bhopal|infosys|managed team/i.test(s))).toBe(false);
  });

  it('transformImportDataToBuilder preserves multiple experiences through the pipeline', () => {
    const transformed = transformImportDataToBuilder({
      email: 'test@example.com',
      experience: [
        {
          company: 'Google',
          position: 'Software Engineer',
          startDate: '2020-01',
          endDate: '2022-12',
          description: 'Built search features.',
        },
        {
          company: 'Microsoft',
          position: 'Senior Engineer',
          startDate: '2023-01',
          current: true,
          description: 'Led Azure tooling.',
        },
      ],
      skills: ['React', 'Python'],
      _apiFinalized: true,
    });
    expect(transformed.experience).toHaveLength(2);
    expect(transformed.experience[0].company).toMatch(/Google/i);
    expect(transformed.experience[1].company).toMatch(/Microsoft/i);
    expect(transformed.experience[0].description).toMatch(/search/i);
    expect(transformed.experience[1].description).toMatch(/Azure/i);
  });

  it('rejects invented epoch dates and empty end date does not imply current job', async () => {
    const { sanitizeExperienceDateValue } = await import('@/lib/resume-parser/import-sanitize');
    expect(sanitizeExperienceDateValue('1970-01-01')).toBe('');
    expect(sanitizeExperienceDateValue('Jan 2020')).toBe('2020-01');
    expect(sanitizeExperienceDateValue('1900')).toBe('');

    const transformed = transformImportDataToBuilder({
      email: 'test@example.com',
      experience: [
        {
          company: 'Infosys',
          position: 'Developer',
          startDate: '2018-06',
          endDate: '',
          description: 'Built APIs',
        },
      ],
      _apiFinalized: true,
    });
    expect(transformed.experience[0].current).toBe(false);
    expect(transformed.experience[0].isCurrent).toBe(false);
  });

  it('recognizes short employer names like Infosys and TCS in text recovery', () => {
    const text = [
      'Jane Doe',
      'jane@example.com',
      '',
      'Experience',
      'Infosys',
      'Software Engineer',
      'Jan 2020 - Dec 2022',
      'Built microservices.',
      '',
      'TCS',
      'Senior Developer',
      'Jan 2023 - Present',
      'Led migration project.',
    ].join('\n');

    const parsed = extractResumeFromText(text);
    expect(parsed.experience.length).toBeGreaterThanOrEqual(2);
    expect(parsed.experience.some((e) => /infosys/i.test(String(e.company || '')))).toBe(true);
    expect(parsed.experience.some((e) => /\btcs\b/i.test(String(e.company || '')))).toBe(true);
  });
});

describe('optimizeResumeDataForRender', () => {
  const {
    optimizeResumeDataForRender,
    resolveTemplateRenderCapacity,
  } = require('@/lib/resume-builder/section-visibility');
  const { scoreBulletQuality } = require('@/lib/resume-parser/import-sanitize');

  it('caps skills for sidebar/progress templates at 12', () => {
    const capacity = resolveTemplateRenderCapacity('<div class="psp-skills-progress sidebar"></div>');
    expect(capacity.maxSkills).toBe(12);
  });

  it('prefers measurable bullets over generic responsibilities', () => {
    expect(
      scoreBulletQuality('Increased revenue by 35% through optimized sales pipeline')
    ).toBeGreaterThan(scoreBulletQuality('Responsible for various tasks on the team'));
  });

  it('keeps all companies but trims bullets for template render', () => {
    const formData = {
      experience: [
        {
          company: 'Google',
          title: 'Senior Engineer',
          achievements: [
            'Responsible for writing code',
            'Increased API throughput by 40%',
            'Led team of 8 engineers',
            'Worked on multiple projects',
            'Delivered migration saving $2M annually',
            'Assisted with daily standups',
          ],
        },
        {
          company: 'Infosys',
          title: 'Developer',
          description: 'Built services.\nReduced latency 25%.',
        },
      ],
      skills: Array.from({ length: 25 }, (_, i) => `Skill${i}`),
      summary: Array.from({ length: 120 }, (_, i) => `word${i}`).join(' '),
      projects: Array.from({ length: 6 }, (_, i) => ({ name: `Project ${i}`, description: `Impact ${i}` })),
    };

    const optimized = optimizeResumeDataForRender(formData, {
      htmlTemplate: '<aside class="sidebar psp-skills-progress"></aside>',
    });

    expect(optimized.experience).toHaveLength(2);
    expect((optimized.experience as unknown[])[0]).toMatchObject({ company: 'Google' });
    expect((optimized.experience as unknown[])[1]).toMatchObject({ company: 'Infosys' });
    expect((optimized.experience as unknown[])[0].achievements.length).toBeLessThanOrEqual(5);
    expect((optimized.skills as string[]).length).toBeLessThanOrEqual(12);
    expect((optimized.projects as unknown[]).length).toBeLessThanOrEqual(4);
    expect(String(optimized.summary).split(/\s+/).length).toBeLessThanOrEqual(90);
  });

  it('does not mutate the original editor formData object', () => {
    const formData = {
      experience: [{ company: 'Acme', title: 'Dev', achievements: ['A', 'B', 'C', 'D', 'E', 'F'] }],
      skills: ['React', 'Node.js', 'Python'],
      summary: 'Short summary.',
    };
    const snapshot = JSON.stringify(formData);
    optimizeResumeDataForRender(formData, { htmlTemplate: '<div></div>' });
    expect(JSON.stringify(formData)).toBe(snapshot);
  });

  it('preserves full content for parser-imported resumes', () => {
    const formData = {
      customParserUsed: true,
      experience: [
        {
          company: 'Google',
          title: 'Senior Engineer',
          achievements: ['A', 'B', 'C', 'D', 'E', 'F'],
        },
      ],
      skills: Array.from({ length: 25 }, (_, i) => `Skill${i}`),
      summary: Array.from({ length: 120 }, (_, i) => `word${i}`).join(' '),
      projects: Array.from({ length: 6 }, (_, i) => ({ name: `Project ${i}`, description: `Impact ${i}` })),
    };

    const optimized = optimizeResumeDataForRender(formData, {
      htmlTemplate: '<aside class="sidebar"></aside>',
    });

    expect(optimized).toBe(formData);
    expect((optimized.experience as unknown[])[0].achievements).toHaveLength(6);
    expect((optimized.skills as string[]).length).toBe(25);
    expect((optimized.projects as unknown[]).length).toBe(6);
    expect(String(optimized.summary).split(/\s+/).length).toBe(120);
  });
});

describe('dynamic layout engine', () => {
  const {
    computeDynamicLayoutPlan,
    injectDynamicLayoutIntoHtml,
    resolveAdaptiveTypography,
  } = require('@/lib/resume-builder/dynamic-layout-engine');

  it('adapts typography hierarchy for sparse vs dense experience', () => {
    const sparse = resolveAdaptiveTypography({
      experienceCount: 1,
      experienceTextUnits: 3,
      summaryWords: 30,
      skillCount: 4,
      fill: 0.55,
      experienceDominant: false,
    });
    const dense = resolveAdaptiveTypography({
      experienceCount: 8,
      experienceTextUnits: 28,
      summaryWords: 120,
      skillCount: 20,
      fill: 1.05,
      experienceDominant: true,
    });

    expect(sparse.typographyDensity).toBe('sparse');
    expect(dense.typographyDensity).toBe('dense');
    expect(sparse.companyFontScale).toBeGreaterThan(dense.bodyFontScale);
    expect(dense.companyFontScale).toBeGreaterThan(dense.bodyFontScale);
    expect(dense.bodyFontScale).toBeLessThan(sparse.bodyFontScale);
    expect(dense.descLineHeightMul).toBeGreaterThanOrEqual(sparse.descLineHeightMul - 0.02);
    expect(dense.summaryMaxCh).toBeLessThanOrEqual(sparse.summaryMaxCh);
  });

  it('keeps company larger than body when experience count grows', () => {
    const mid = computeDynamicLayoutPlan(
      {
        experience: Array.from({ length: 5 }, (_, i) => ({
          company: `Company ${i}`,
          title: 'Analyst',
          description: 'Led reconciliation and reporting across finance teams with ERP tools.',
          achievements: ['Improved cycle time', 'Automated invoices', 'Trained peers'],
        })),
        skills: Array.from({ length: 12 }, (_, i) => `Skill${i}`),
        summary: Array.from({ length: 80 }, (_, i) => `word${i}`).join(' '),
      },
      { htmlTemplate: '<aside class="sidebar"></aside><main></main>' }
    );

    expect(mid.companyFontScale).toBeGreaterThan(mid.bodyFontScale);
    expect(mid.titleFontScale).toBeGreaterThan(mid.metaFontScale);
    expect(mid.typographyDensity).toMatch(/balanced|dense/);
    expect(mid.descLineHeightMul).toBeGreaterThanOrEqual(1.05);
  });

  it('injects adaptive typography CSS variables into preview HTML', () => {
    const html = injectDynamicLayoutIntoHtml(
      '<html><body><div class="resume-container"><div class="experience-item"><div class="experience-header"><span class="company">Acme</span><h3>Dev</h3></div><div class="description"><ul><li>Built APIs</li></ul></div></div></div></body></html>',
      {
        experience: [
          {
            company: 'Acme',
            title: 'Dev',
            description: 'Built APIs and services for customers.',
            achievements: ['Shipped v1', 'Reduced latency'],
          },
        ],
        summary: 'Experienced engineer.',
      }
    );
    expect(html).toContain('--dl-fs-company');
    expect(html).toContain('--dl-fs-body');
    expect(html).toContain('--dl-lh-desc');
    expect(html).toContain('--dl-summary-max-ch');
    expect(html).toContain('--resume-line-height');
    expect(html).toContain('--resume-body-size');
    expect(html).toContain('--resume-company-size');
    expect(html).toContain('--resume-name-size');
    expect(html).toContain('clamp(');
    expect(html).toContain('data-dl-density');
  });

  it('emits professional hierarchy rules for dates, skills, and education', () => {
    const { buildDynamicLayoutCss, computeDynamicLayoutPlan } = require('@/lib/resume-builder/dynamic-layout-engine');
    const plan = computeDynamicLayoutPlan(
      {
        experience: [{ company: 'Acme', title: 'Dev', description: 'Built APIs.', achievements: ['Shipped'] }],
        summary: 'Engineer with product sense.',
        education: [{ institution: 'MIT', degree: 'BS CS', year: '2020' }],
        skills: ['React', 'TypeScript'],
      },
      { htmlTemplate: '<aside class="sidebar"></aside><main></main>' }
    );
    const css = buildDynamicLayoutCss(plan);
    expect(css).toContain('.candidate-name');
    expect(css).toContain('.header-title');
    expect(css).toContain('.technologies');
    expect(css).toContain('.institution');
    expect(css).toContain('.issuer');
    expect(css).toContain('word-spacing');
    expect(css).toContain('--resume-ls-heading');
    expect(css).toContain('--resume-name-size');
    expect(css).toContain('--resume-bullet-gap');
    expect(css).toMatch(/clamp\([\d.]+px/);
  });

  it('raises ATS content-balance body sizes above the old 9px floor', () => {
    const { getAtsContentBalanceCss } = require('@/lib/resume-builder/ats-content-balance-css');
    const css = getAtsContentBalanceCss() as string;
    expect(css).not.toMatch(/clamp\(9px/);
    expect(css).toContain('--acb-size-body');
    expect(css).toContain('10.5px');
    expect(css).toContain('--acb-lh-body: 1.68');
  });

  it('expands spacing for sparse resumes', () => {
    const sparse = computeDynamicLayoutPlan(
      { experience: [], skills: ['React', 'Node.js'], summary: 'Short summary.' },
      { htmlTemplate: '<div class="sidebar"></div>' }
    );
    const dense = computeDynamicLayoutPlan(
      {
        experience: Array.from({ length: 8 }, (_, i) => ({
          company: `Co ${i}`,
          title: 'Engineer',
          achievements: ['Built APIs', 'Reduced latency 30%', 'Led team of 5'],
        })),
        skills: Array.from({ length: 40 }, (_, i) => `Skill${i}`),
        summary: Array.from({ length: 150 }, (_, i) => `word${i}`).join(' '),
        projects: Array.from({ length: 5 }, (_, i) => ({ name: `P${i}`, description: 'Desc' })),
      },
      { htmlTemplate: '<aside class="sidebar"></aside>' }
    );

    expect(sparse.sectionGap).toBeGreaterThan(dense.sectionGap);
    expect(sparse.fontScale).toBeGreaterThanOrEqual(dense.fontScale);
    expect(sparse.skillColumns).toBeLessThanOrEqual(3);
  });

  it('targets professional page fill band for sparse content (expand toward ~90%)', () => {
    const sparse = computeDynamicLayoutPlan(
      {
        experience: [
          {
            company: 'Acme',
            title: 'Engineer',
            description: 'Built one product feature.',
          },
        ],
        skills: ['Excel', 'SAP'],
        summary: 'Brief profile.',
      },
      {
        htmlTemplate: '<aside class="sidebar"></aside><main></main>',
        renderedHtml:
          '<div class="resume-container" style="height:500px"><aside class="sidebar"><div class="skill-tag">Excel</div></aside><main><div class="experience-item">x</div><p class="summary-text">Brief profile.</p></main></div>',
      }
    );
    // Sparse pages must expand internal spacing (not invent content).
    expect(sparse.sectionPadding).toBeGreaterThan(6);
    expect(sparse.experienceCardPadding).toBeGreaterThan(sparse.sectionPadding);
    expect(sparse.lineHeightMul).toBeGreaterThan(1);
  });

  it('injects dynamic-layout CSS for PDF mode without refine script', () => {
    const html = injectDynamicLayoutIntoHtml(
      '<html><body><div class="resume-container">x</div></body></html>',
      { experience: [{ company: 'Acme', title: 'Dev', description: 'Built things.' }] },
      { mode: 'pdf' }
    );
    expect(html).toContain('data-injected="dynamic-layout"');
    expect(html).toContain('--dl-section-gap');
    expect(html).not.toContain('data-injected="dynamic-layout-refine"');
  });

  it('injects dynamic-layout style block into rendered HTML', () => {
    const html = injectDynamicLayoutIntoHtml(
      '<html><body><div class="resume-container">x</div></body></html>',
      { experience: [{ company: 'Acme', title: 'Dev', description: 'Built things.' }] }
    );
    expect(html).toContain('data-injected="dynamic-layout"');
    expect(html).toContain('--dl-section-gap');
  });

  it('audits missing sections when data exists but HTML lacks markers', () => {
    const { auditRenderedSections } = require('@/lib/resume-builder/dynamic-layout-engine');
    const rows = auditRenderedSections(
      {
        projects: [{ name: 'App', description: 'Built it' }],
        skills: ['React'],
      },
      '<div class="resume-container"><div class="skill-tag">React</div></div>'
    );
    const projects = rows.find((r: { section: string }) => r.section === 'projects');
    expect(projects?.missing).toBe(true);
    const skills = rows.find((r: { section: string }) => r.section === 'skills');
    expect(skills?.missing).toBe(false);
  });

  it('prioritizes experience spacing when main column dominates a sparse sidebar', () => {
    const {
      computeDynamicLayoutPlanFromMetrics,
      synthesizeMetricsFromRenderedHtml,
    } = require('@/lib/resume-builder/dynamic-layout-engine');

    const renderedHtml = `
      <div class="resume-container">
        <aside class="sidebar">
          <section><div class="education-item">MBA</div></section>
          <section><span class="skill-tag">Excel</span><span class="skill-tag">SAP</span></section>
        </aside>
        <main>
          <section><p class="summary-text">Executive leader with 15 years experience.</p></section>
          <section>
            <div class="experience-item"><ul><li>Led transformation</li><li>Managed P&amp;L</li><li>Built teams</li></ul></div>
            <div class="experience-item"><ul><li>Drove growth</li><li>Expanded markets</li></ul></div>
          </section>
        </main>
      </div>`;

    const metrics = synthesizeMetricsFromRenderedHtml(renderedHtml);
    const formData = {
      experience: [
        { company: 'Corp A', title: 'VP', achievements: ['Led transformation', 'Managed P&L', 'Built teams'] },
        { company: 'Corp B', title: 'Director', achievements: ['Drove growth', 'Expanded markets'] },
      ],
      education: [{ institution: 'University', degree: 'MBA' }],
      skills: ['Excel', 'SAP'],
      summary: 'Executive leader with 15 years experience.',
    };

    const plan = computeDynamicLayoutPlanFromMetrics(metrics, formData, {
      htmlTemplate: '<aside class="sidebar"></aside><main></main>',
      renderedHtml,
    });

    expect(plan.sidebarCardPadding).toBeLessThan(plan.sectionPadding);
    expect(plan.experienceSpacing).toBeGreaterThanOrEqual(plan.educationSpacing);
    expect((plan.sectionExtras.experience ?? 0)).toBeGreaterThanOrEqual(
      plan.sectionExtras.education ?? 0
    );
  });

  it('does not over-compress experience-heavy pages with underfilled sidebars', () => {
    const {
      computeDynamicLayoutPlanFromMetrics,
      computeLayoutFillSignals,
      synthesizeMetricsFromRenderedHtml,
    } = require('@/lib/resume-builder/dynamic-layout-engine');

    const longExpHtml = `<div class="resume-container">
      <aside class="sidebar"><section><div class="education-item">Degree</div></section></aside>
      <main><section>${'<div class="experience-item"><ul><li>Item</li></ul></div>'.repeat(6)}</section></main>
    </div>`;
    const metrics = synthesizeMetricsFromRenderedHtml(longExpHtml);
    const signals = computeLayoutFillSignals(metrics);

    expect(signals.experienceDominant).toBe(true);
    expect(signals.shouldCompress).toBe(false);

    const densePlan = computeDynamicLayoutPlanFromMetrics(metrics, {
      experience: Array.from({ length: 6 }, (_, i) => ({
        company: `Co ${i}`,
        title: 'Executive',
        achievements: ['Achievement one', 'Achievement two'],
      })),
      education: [{ institution: 'School', degree: 'MBA' }],
    }, { htmlTemplate: '<aside class="sidebar"></aside>', renderedHtml: longExpHtml });

    expect(densePlan.lineHeightMul).toBeGreaterThanOrEqual(0.95);
  });

  it('injects compact sidebar density attribute for sparse sidebars', () => {
    const { injectDynamicLayoutIntoHtml } = require('@/lib/resume-builder/dynamic-layout-engine');
    const html = injectDynamicLayoutIntoHtml(
      `<html><body><div class="resume-container">
        <aside class="sidebar"><section><div class="education-item">MBA</div></section></aside>
        <main><section><div class="experience-item">Role</div></section></main>
      </div></body></html>`,
      {
        experience: [{ company: 'Acme', title: 'VP', achievements: ['Led org'] }],
        education: [{ institution: 'Uni', degree: 'MBA' }],
      },
      { htmlTemplate: '<aside class="sidebar"></aside>' }
    );
    expect(html).toContain('data-dl-sidebar-density="compact"');
  });

  it('keeps projects with title and description during coalesce recovery', () => {
    const { recoverRenderableSectionsForCoalesce } = require('@/lib/resume-builder/section-visibility');
    const result = recoverRenderableSectionsForCoalesce({
      experience: [],
      projects: [
        {
          name: 'Internal Portal',
          description: 'Built employee self-service portal with React and Node.',
        },
      ],
      skills: [],
      achievements: [],
    });
    expect(result.projects.length).toBe(1);
    expect(result.experience.length).toBe(0);
  });

  it('keeps projects whose titles fail strict plausibility but have substantive descriptions', () => {
    const {
      recoverRenderableSectionsForCoalesce,
      filterMeaningfulProjects,
      coalesceFormDataForTemplateRender,
    } = require('@/lib/resume-builder/section-visibility');

    const project = {
      name: 'Mobile App for Inventory Tracking',
      description: 'Built Flask API and React dashboard for warehouse stock levels.',
    };

    const recovered = recoverRenderableSectionsForCoalesce({
      experience: [],
      projects: [project],
      skills: [],
      achievements: [],
    });
    expect(recovered.projects).toHaveLength(1);
    expect(recovered.experience).toHaveLength(0);

    expect(filterMeaningfulProjects([project])).toHaveLength(1);

    const coalesced = coalesceFormDataForTemplateRender({
      firstName: 'Test',
      projects: [project],
      _imported: true,
    });
    expect((coalesced.projects as unknown[]).length).toBe(1);
  });

  it('injectResumeData renders projects that fail strict title plausibility', async () => {
    const { injectResumeData } = await import('@/lib/resume-builder/template-loader');
    const result = injectResumeData('{{PROJECTS}}', {
      firstName: 'Test',
      lastName: 'User',
      projects: [
        {
          name: 'Mobile App for Inventory Tracking',
          description: 'Built Flask API and React dashboard for warehouse stock levels.',
        },
      ],
      _imported: true,
    });
    expect(result).toContain('project-item');
    expect(result).toContain('Mobile App for Inventory Tracking');
    expect(result).toContain('Flask API');
  });

  it('injectResumeData renders manual builder projects through coalesce and conditionals', async () => {
    const { injectResumeData } = await import('@/lib/resume-builder/template-loader');
    const template = `
      {{#if PROJECTS}}
      <section class="projects-section">
        <h2>Projects</h2>
        <div class="projects-list">{{PROJECTS}}</div>
      </section>
      {{/if}}
    `;
    const formData = {
      firstName: 'Manual',
      lastName: 'User',
      projects: [
        { name: 'Full Stack Developer Portfolio', description: 'Personal site with Next.js.' },
        { name: 'CRM', technologies: 'React, Node.js' },
      ],
    };
    const result = injectResumeData(template, formData);
    expect(result).toContain('project-item');
    expect(result).toContain('projects-list');
    expect(result).toContain('Full Stack Developer Portfolio');
    expect(result).toContain('CRM');
    expect(result).not.toMatch(/\{\{#if PROJECTS\}\}/);
  });

  it('coalesce preserves user-authored builder projects with title only', () => {
    const { coalesceFormDataForTemplateRender } = require('@/lib/resume-builder/section-visibility');
    const coalesced = coalesceFormDataForTemplateRender({
      firstName: 'Test',
      projects: [{ name: 'Inventory Dashboard' }],
    });
    expect((coalesced.projects as unknown[]).length).toBe(1);
  });

  it('injectResumeData renders projects in luxury-corporate gallery path', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const { injectResumeData } = await import('@/lib/resume-builder/template-loader');
    const html = readFileSync(
      resolve(process.cwd(), 'public/templates/luxury-corporate/index.html'),
      'utf8'
    );
    const formData = {
      firstName: 'Test',
      lastName: 'User',
      _imported: true,
      projects: [
        {
          name: 'Job Portal Application',
          description: 'Built a full-stack job portal with Next.js and PostgreSQL.',
        },
      ],
      experience: [{ title: 'Developer', company: 'Acme', description: 'Shipped APIs' }],
    };
    const result = injectResumeData(html, formData, {
      galleryPreview: true,
      galleryTemplateId: 'luxury-corporate',
      templateId: 'luxury-corporate',
    });
    expect(result).toContain('project-item');
    expect(result).toContain('Job Portal Application');
    expect(result).toContain('projects-list');
  });

  it('renders Naukrimili and Cafe Zafran projects across gallery templates', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const { injectResumeData } = await import('@/lib/resume-builder/template-loader');
    const { coalesceFormDataForTemplateRender } = await import(
      '@/lib/resume-builder/section-visibility'
    );

    const formData = {
      firstName: 'Test',
      lastName: 'User',
      _imported: true,
      _userEdited: true,
      projects: [
        {
          name: 'Naukrimili Job Portal',
          description: 'Full-stack hiring platform with Next.js and PostgreSQL.',
          technologies: 'Next.js, PostgreSQL, React',
        },
        {
          name: 'Cafe Zafran Restaurant Website',
          description: 'Restaurant website with menu, reservations, and online ordering.',
          technologies: 'React, Node.js',
        },
      ],
      experience: [{ title: 'Developer', company: 'Acme', description: 'Built APIs' }],
    };

    const coalesced = coalesceFormDataForTemplateRender(formData);
    expect((coalesced.projects as unknown[]).length).toBe(2);

    const templateIds = [
      'executive-navy-copper',
      'luxury-corporate',
      'organic-luxe-editorial',
      'executive-sidebar-elite',
    ];

    for (const templateId of templateIds) {
      const html = readFileSync(
        resolve(process.cwd(), `public/templates/${templateId}/index.html`),
        'utf8'
      );
      const gallery = injectResumeData(html, formData, {
        galleryPreview: true,
        galleryTemplateId: templateId,
        templateId,
      });
      const live = injectResumeData(html, formData, { templateId, mode: 'preview' });

      for (const result of [gallery, live]) {
        expect(result).toContain('Naukrimili Job Portal');
        expect(result).toContain('Cafe Zafran Restaurant Website');
        expect((result.match(/\bproject-item\b/gi) || []).length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('renderProjects accepts ProjectName alias', async () => {
    const { injectResumeData } = await import('@/lib/resume-builder/template-loader');
    const result = injectResumeData('{{PROJECTS}}', {
      firstName: 'Test',
      projects: [{ ProjectName: 'ERP Portal', description: 'SAP workflow modules.' }],
    });
    expect(result).toContain('project-item');
    expect(result).toContain('ERP Portal');
  });

  it('keeps projects with bullets-only body when title fails plausibility', () => {
    const {
      filterMeaningfulProjects,
      coalesceFormDataForTemplateRender,
    } = require('@/lib/resume-builder/section-visibility');
    const project = {
      name: 'Web Platform for Vendor Onboarding',
      bullets: ['Designed REST APIs in Node.js', 'Deployed on AWS with CI/CD'],
    };
    expect(filterMeaningfulProjects([project])).toHaveLength(1);
    const coalesced = coalesceFormDataForTemplateRender({
      firstName: 'Test',
      projects: [project],
    });
    expect((coalesced.projects as unknown[]).length).toBe(1);
  });

  it('shouldRenderSection keeps PROJECTS when formData has projects but placeholder is empty', () => {
    const { shouldRenderSection } = require('@/lib/resume-builder/section-visibility');
    const formData = {
      projects: [{ name: 'Inventory Portal', description: 'React dashboard for stock tracking.' }],
    };
    expect(shouldRenderSection('PROJECTS', '', formData)).toBe(true);
    expect(shouldRenderSection('PROJECTS', '   ', formData)).toBe(true);
  });

  it('processHandlebarsConditionals preserves PROJECTS block from canonical formData', () => {
    const { processHandlebarsConditionals } = require('@/lib/resume-builder/section-visibility');
    const template = `{{#if PROJECTS}}<section class="projects"><div class="projects-list">{{PROJECTS}}</div></section>{{/if}}`;
    const formData = {
      projects: [{ name: 'Job Portal', description: 'Full-stack hiring platform with Next.js.' }],
    };
    const result = processHandlebarsConditionals(
      template,
      { '{{PROJECTS}}': '' },
      formData
    );
    expect(result).toContain('projects-list');
    expect(result).toContain('{{PROJECTS}}');
  });

  it('derives gallery capacity from template structure', () => {
    const { resolveGalleryRenderCapacity } = require('@/lib/resume-builder/section-visibility');
    const sidebar = resolveGalleryRenderCapacity('<aside class="sidebar"></aside>');
    const single = resolveGalleryRenderCapacity('<main class="content"></main>');
    expect(sidebar.maxProjects).toBeGreaterThanOrEqual(3);
    expect(single.maxProjects).toBeGreaterThanOrEqual(3);
  });

  it('infers template layout capacity from HTML structure', () => {
    const { computeTemplateLayoutCapacity, resolveTemplateLayoutProfile } = require(
      '@/lib/resume-builder/dynamic-layout-engine'
    );
    const cap = computeTemplateLayoutCapacity(
      '<aside class="sidebar"></aside><main class="timeline experience-list"></main>'
    );
    expect(cap.hasSidebar).toBe(true);
    expect(cap.usablePageHeightPx).toBeLessThan(1123);
    expect(resolveTemplateLayoutProfile(cap)).toBe('sidebar');
  });
});

describe('processHandlebarsConditionals', () => {
  const {
    processHandlebarsConditionals,
    stripRemainingHandlebarsSyntax,
  } = require('@/lib/resume-builder/section-visibility');

  it('resolves nested {{#if PHONE}} inside {{#if CONTACT}}', () => {
    const template = `
      {{#if CONTACT}}
      <section>
        {{#if PHONE}}<div class="phone">{{PHONE}}</div>{{/if}}
        {{#if EMAIL}}<div class="email">{{EMAIL}}</div>{{/if}}
      </section>
      {{/if}}
    `;
    const placeholders = {
      '{{CONTACT}}': '<div class="contact-item">x</div>',
      '{{PHONE}}': '+1 555 0100',
      '{{EMAIL}}': '',
    };
    let result = processHandlebarsConditionals(template, placeholders, {});
    result = stripRemainingHandlebarsSyntax(
      result.replace(/\{\{PHONE\}\}/g, placeholders['{{PHONE}}'])
    );
    expect(result).not.toMatch(/\{\{#if/);
    expect(result).not.toMatch(/\{\{\/if\}\}/);
    expect(result).toContain('+1 555 0100');
    expect(result).not.toContain('{{EMAIL}}');
    expect(result).not.toMatch(/class="email"/);
  });

  it('resolves {{#unless PROFILE_IMAGE}} for initials fallback', () => {
    const template = `{{#unless PROFILE_IMAGE}}<span class="initials">AB</span>{{/unless}}`;
    const placeholders = { '{{PROFILE_IMAGE}}': '' };
    const result = stripRemainingHandlebarsSyntax(
      processHandlebarsConditionals(template, placeholders, {})
    );
    expect(result).toContain('initials');
    expect(result).not.toMatch(/\{\{#unless/);
  });

  it('injectResumeData leaves no handlebars in executive-sidebar-elite', () => {
    const fs = require('fs');
    const path = require('path');
    const { injectResumeData } = require('@/lib/resume-builder/template-loader');
    const templateId = 'executive-sidebar-elite';
    const full = fs.readFileSync(
      path.join(process.cwd(), 'public', 'templates', templateId, 'index.html'),
      'utf8'
    );
    const body = full.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || full;
    const html = injectResumeData(
      body,
      {
        customParserUsed: true,
        firstName: 'Anam',
        lastName: 'Sayyed',
        phone: '+91 98765 43210',
        email: 'anam@example.com',
        experience: [{ company: 'Co', title: 'Dev', description: 'Work.' }],
        skills: ['React'],
      },
      { templateId }
    );
    expect(html).not.toMatch(/\{\{#if/);
    expect(html).not.toMatch(/\{\{\/if\}\}/);
    expect(html).not.toMatch(/\{\{PHONE\}\}/);
    expect(html).toContain('+91 98765 43210');
  });
});

describe('appendMissingImportSections', () => {
  const {
    appendMissingImportSections,
    coalesceFormDataForTemplateRender,
  } = require('@/lib/resume-builder/section-visibility');
  const { injectResumeData } = require('@/lib/resume-builder/template-loader');

  it('injects projects into rendered HTML when template block was stripped', () => {
    const template = `
      <main>
        {{#if EXPERIENCE}}<section><div class="experience-list">{{EXPERIENCE}}</div></section>{{/if}}
      </main>
      <aside class="sidebar"></aside>
    `;
    const builder = {
      customParserUsed: true,
      experience: [{ company: 'Acme', title: 'Dev', description: 'Built APIs.' }],
      projects: [{ name: 'Portal', description: 'Job board' }],
    };
    const coalesced = coalesceFormDataForTemplateRender(builder);
    const placeholders = {
      '{{EXPERIENCE}}': '<div class="experience-item"><h3>Dev</h3></div>',
      '{{PROJECTS}}': '<div class="project-item"><h3>Portal</h3></div>',
    };
    const out = appendMissingImportSections(
      '<main><section><div class="experience-item">x</div></section></main><aside></aside>',
      template,
      placeholders,
      coalesced
    );
    expect(out).toContain('project-item');
    expect(out).toContain('data-import-section="PROJECTS"');
  });

  it('injectResumeData includes all import sections for sidebar template', async () => {
    const fs = require('fs');
    const path = require('path');
    const templateId = 'executive-sidebar-elite';
    const htmlPath = path.join(process.cwd(), 'public', 'templates', templateId, 'index.html');
    const full = fs.readFileSync(htmlPath, 'utf8');
    const body = full.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || full;
    const builder = {
      customParserUsed: true,
      firstName: 'Test',
      lastName: 'User',
      summary: 'Professional summary text.',
      experience: [{ company: 'Co', title: 'Role', description: 'Did work.' }],
      projects: [{ name: 'Proj', description: 'Built app' }],
      skills: ['React', 'Node'],
      education: [{ institution: 'Uni', degree: 'BS' }],
      certifications: [{ name: 'AWS' }],
      languages: [{ language: 'English' }],
      achievements: ['Award 2024'],
    };
    const html = injectResumeData(body, builder, { templateId });
    expect(html).toMatch(/project-item/);
    expect(html).toMatch(/skill-tag|psp-skill/);
    expect(html).toMatch(/certification-item/);
    expect(html).toMatch(/language-item|psp-language/);
    expect(html).toMatch(/achievement-item/);
  });
});

describe('experience header mapping', () => {
  const {
    sanitizeExperienceEntry,
    reconcileExperienceHeaderFields,
    looksLikeCompanyNameLine,
  } = require('@/lib/resume-parser/import-sanitize');
  const { transformImportDataToBuilder } = require('@/lib/resume-builder/import-transformer');

  it('recognizes short employer names like Reliance and Adobe', () => {
    expect(looksLikeCompanyNameLine('Reliance')).toBe(true);
    expect(looksLikeCompanyNameLine('Adobe')).toBe(true);
  });

  it('reads company from companyName alias before mapping', () => {
    const mapped = sanitizeExperienceEntry({
      companyName: 'Infosys Limited',
      title: 'Software Developer',
      startDate: '2020-01',
      endDate: '2022-12',
      description: 'Built APIs.',
    });
    expect(mapped?.company).toBe('Infosys Limited');
    expect(mapped?.title).toBe('Software Developer');
  });

  it('merges split title fragments like Full + Stack Developer', () => {
    const reconciled = reconcileExperienceHeaderFields({
      company: 'Stack Developer',
      title: 'Full',
      description: 'Built APIs.',
    });
    expect(reconciled.company).toBe('');
    expect(reconciled.title).toBe('Full Stack Developer');
  });

  it('does not duplicate title when position already contains company fragment', () => {
    const reconciled = reconcileExperienceHeaderFields({
      company: 'Stack Developer',
      title: 'Full Stack Developer',
      description: 'Built APIs.',
    });
    expect(reconciled.company).toBe('');
    expect(reconciled.title).toBe('Full Stack Developer');
  });

  it('splits company and location from pipe format', () => {
    const reconciled = reconcileExperienceHeaderFields({
      company: 'Technoart | Bhopal',
      title: 'Python Developer',
      description: 'Built services.',
    });
    expect(reconciled.company).toBe('Technoart');
    expect(reconciled.location).toMatch(/bhopal/i);
    expect(reconciled.title).toBe('Python Developer');
  });

  it('moves city lines out of company into location', () => {
    const reconciled = reconcileExperienceHeaderFields({
      company: 'Bhopal, Madhya Pradesh',
      title: 'Python Developer',
      description: 'Built services.',
    });
    expect(reconciled.location).toMatch(/bhopal/i);
    expect(reconciled.title).toBe('Python Developer');
    expect(String(reconciled.company || '')).toBe('');
  });

  it('splits embedded multi-job description into separate experiences', async () => {
    const {
      splitExperienceEntriesWithEmbeddedJobs,
      finalizeExperienceListForBuilder,
    } = await import('@/lib/resume-parser/import-sanitize');
    const split = splitExperienceEntriesWithEmbeddedJobs([
      {
        company: 'Acme Corp',
        title: 'Developer',
        startDate: '2020-01',
        endDate: '2021-12',
        description: [
          'Built APIs for billing.',
          'Senior Engineer',
          'Globex Inc',
          'Jan 2022 - Present',
          'Led platform migration.',
        ].join('\n'),
      },
    ]);
    expect(split.length).toBeGreaterThanOrEqual(2);
    const finalized = finalizeExperienceListForBuilder(split);
    expect(finalized.length).toBeGreaterThanOrEqual(2);
  });

  it('pairs company-only and title-only orphan fragments', async () => {
    const { finalizeExperienceListForBuilder } = await import('@/lib/resume-parser/import-sanitize');
    const result = finalizeExperienceListForBuilder([
      { company: 'Technoart', startDate: '2020-01', endDate: '2021-12' },
      { title: 'Python Developer', description: 'Built REST APIs.' },
    ]);
    expect(result.length).toBe(1);
    expect(String(result[0]?.company || '')).toMatch(/technoart/i);
    expect(String(result[0]?.title || result[0]?.position || '')).toMatch(/python developer/i);
  });

  it('rejects tech skill and location mis-assigned as company', async () => {
    const {
      reconcileExperienceHeaderFields,
      isPlausibleExperienceCompany,
      splitCompanyLocationPipe,
      finalizeExperienceListForBuilder,
    } = await import('@/lib/resume-parser/import-sanitize');

    expect(isPlausibleExperienceCompany('PYTHON')).toBe(false);
    expect(isPlausibleExperienceCompany('Bhopal')).toBe(false);
    expect(isPlausibleExperienceCompany('Full-stack Python Developer')).toBe(false);
    expect(isPlausibleExperienceCompany('Technoart')).toBe(true);

    const pipeSplit = splitCompanyLocationPipe('PYTHON | Bhopal');
    expect(pipeSplit?.company).toBe('');
    expect(pipeSplit?.location).toMatch(/bhopal/i);

    const reconciled = reconcileExperienceHeaderFields({
      company: 'PYTHON | Bhopal',
      title: 'Python Developer',
      description: 'Built services at Technoart.',
    });
    expect(reconciled.company).toBe('');
    expect(reconciled.location).toMatch(/bhopal/i);

    const collapsed = finalizeExperienceListForBuilder([
      { title: 'Python Developer', location: 'Bhopal', current: true },
      {
        title: 'Python Developer',
        company: 'Technoart',
        startDate: '2020-01',
        endDate: '2022-12',
        description: 'Built REST APIs and Django services.',
      },
      { title: 'Full Stack Developer', description: 'Led migration project.' },
      {
        title: 'Full Stack Developer',
        company: 'Globex',
        startDate: '2023-01',
        description: 'Led platform migration.\nBuilt CI/CD pipelines.',
      },
    ]);
    expect(collapsed.length).toBeLessThanOrEqual(3);
    expect(collapsed.some((e) => String(e.company || '').toLowerCase().includes('technoart'))).toBe(
      true
    );
  });

  it('hydrates experience and summary when custom parser leaves experience empty but education exists', () => {
    const rawText = [
      'OBJECTIVE',
      'Seeking a company secretary role with 15+ years experience.',
      'PROFESSIONAL PROFILE',
      'Corporate governance and legal compliance specialist.',
      'WORK EXPERIENCE',
      'Company Secretary                    ABC Holdings Pvt Ltd',
      'Mumbai                               2010-01 - Present',
      '- Managed board meetings.',
      'Assistant Company Secretary          XYZ Legal Associates',
      'Delhi                                2005-06 - 2009-12',
      '- Drafted agreements.',
    ].join('\n');

    const builder = transformImportDataToBuilder({
      customParserUsed: true,
      fullName: 'John Doe',
      objective: 'Seeking a company secretary role with 15+ years experience.',
      professionalProfile: 'Corporate governance and legal compliance specialist.',
      summary: rawText,
      experience: [],
      education: [{ institution: 'ICSI', degree: 'ACS' }],
      languages: [{ language: 'English', proficiency: 'Fluent' }],
      skills: [],
      rawText,
    });

    expect(builder.experience.length).toBeGreaterThan(0);
    expect(String(builder.summary || '').length).toBeGreaterThan(40);
    expect(builder.education.length).toBeGreaterThan(0);
    expect(builder.languages.length).toBeGreaterThan(0);
  });

  it('readExperienceTitleForForm prefers live title over stale position alias', async () => {
    const { readExperienceTitleForForm, readExperienceEntryForForm } = await import(
      '@/lib/resume-builder/experience-entry-sync'
    );
    const entry = {
      position: 'StackPythonDeveloper',
      designation: 'StackPythonDeveloper',
      title: 'Stack Python Developer',
      company: 'Acme',
    };
    expect(readExperienceTitleForForm(entry)).toBe('Stack Python Developer');
    expect(readExperienceEntryForForm(entry, 0).title).toBe('Stack Python Developer');

    const cleared = { position: 'Old Title', title: '' };
    expect(readExperienceTitleForForm(cleared)).toBe('');
  });

  it('readExperienceEntryForForm uses Company alias when company key is empty', async () => {
    const { readExperienceEntryForForm, finalizeExperienceEntryForBuilder } = await import(
      '@/lib/resume-builder/experience-entry-sync'
    );
    const display = readExperienceEntryForForm(
      {
        title: 'Company Secretary',
        company: '',
        Company: 'ABC Holdings Pvt Ltd',
        location: 'Mumbai',
      },
      0
    );
    expect(display.company).toBe('ABC Holdings Pvt Ltd');
    expect(display.title).toBe('Company Secretary');

    const finalized = finalizeExperienceEntryForBuilder(
      { title: 'Developer', company: 'Present', Company: 'Digital Solutions Pvt Ltd' },
      0
    );
    expect(finalized.company).toBe('Digital Solutions Pvt Ltd');
    expect(finalized.company).not.toBe('Present');
  });

  it('readExperienceDescriptionForForm prefers live description over Description alias', async () => {
    const {
      readExperienceDescriptionForForm,
      readExperienceEntryForForm,
      appendExperienceDescriptionSuggestion,
      finalizeExperienceEntryForBuilder,
    } = await import('@/lib/resume-builder/experience-entry-sync');

    const entry = {
      description: 'Optimized SQL queries.\nMentored junior developers.',
      Description: 'Stale alias text',
    };
    expect(readExperienceDescriptionForForm(entry)).toContain('Optimized SQL');
    expect(readExperienceEntryForForm(entry, 0).description).toContain('Mentored junior');

    const suggestion =
      'Developed and maintained production features using Django, HTML, MySQL, Node.js.';
    const appended = appendExperienceDescriptionSuggestion(entry, suggestion);
    expect(appended.description).toContain('Optimized SQL queries.');
    expect(appended.description).toContain('Mentored junior developers.');
    expect(appended.description).toContain('Django, HTML, MySQL');

    const finalized = finalizeExperienceEntryForBuilder(appended, 0);
    expect(finalized.description).toBe(appended.description);
    expect(finalized.Description).toBe(appended.description);
  });

  it('appendExperienceDescriptionSuggestion inserts directly when description is empty', async () => {
    const { appendExperienceDescriptionSuggestion } = await import(
      '@/lib/resume-builder/experience-entry-sync'
    );
    const suggestion = 'Built REST APIs and improved latency by 40%.';
    const result = appendExperienceDescriptionSuggestion({ description: '' }, suggestion);
    expect(result.description).toBe(suggestion);
  });

  it('appendExperienceDescriptionSuggestion only updates the targeted experience entry', async () => {
    const { appendExperienceDescriptionSuggestion } = await import(
      '@/lib/resume-builder/experience-entry-sync'
    );
    const experiences = [
      { title: 'Dev', company: 'A', description: 'Line one.' },
      { title: 'Lead', company: 'B', description: 'Other role.' },
    ];
    const updated = experiences.map((entry, i) =>
      i === 0 ? appendExperienceDescriptionSuggestion(entry, 'New bullet for A.') : entry
    );
    expect(updated[0].description).toContain('Line one.');
    expect(updated[0].description).toContain('New bullet for A.');
    expect(updated[1].description).toBe('Other role.');
  });

  it('readExperienceTitleForSync respects cleared title instead of stale position alias', async () => {
    const { readExperienceTitleForSync } = await import('@/lib/resume-builder/experience-entry-sync');
    expect(
      readExperienceTitleForSync({
        title: '',
        position: 'Full Stack Developer',
      })
    ).toBe('');
  });

  it('readExperienceDescriptionForSync respects cleared description instead of Description alias', async () => {
    const { readExperienceDescriptionForSync } = await import('@/lib/resume-builder/experience-entry-sync');
    expect(
      readExperienceDescriptionForSync({
        description: '',
        Description: 'Stale imported bullets',
      })
    ).toBe('');
  });

  it('syncExperienceEntryAliases drops stale import bullets when live description is set', async () => {
    const { syncExperienceEntryAliases } = await import('@/lib/resume-builder/experience-entry-sync');
    const synced = syncExperienceEntryAliases({
      title: 'Engineer',
      company: 'Acme',
      description: 'Optimized SQL queries.\nMentored junior developers.',
      achievements: ['Old import bullet that must not appear in preview'],
      bullets: ['Another stale bullet'],
    });
    expect(synced.description).toContain('Optimized SQL');
    expect(synced.achievements).toEqual([]);
    expect(synced.bullets).toEqual([]);
  });
});
