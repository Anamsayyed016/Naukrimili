import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
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
