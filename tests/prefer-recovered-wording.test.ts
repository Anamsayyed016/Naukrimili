import {
  preferRecoveredWording,
  preferRecoveredStringList,
  shouldPreferRecoveredWording,
  mergeParserWithRecoveredWording,
  applyRecoveredWordingToProfile,
} from '@/lib/resume-parser/prefer-recovered-wording';
import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

describe('prefer-recovered-wording', () => {
  it('prefers recovered description when AI paraphrased shorter', () => {
    const ai = 'Led cross-functional teams and improved delivery velocity.';
    const recovered =
      '• Managed warehouse operations for 500+ SKUs\n• Coordinated inbound/outbound logistics with 3PL partners';
    expect(shouldPreferRecoveredWording(recovered, ai)).toBe(true);
    expect(preferRecoveredWording(recovered, ai)).toBe(recovered);
  });

  it('keeps AI when recovered is empty', () => {
    expect(preferRecoveredWording('', 'Built REST APIs for billing')).toBe('Built REST APIs for billing');
  });

  it('prefers recovered bullet list on matched keys', () => {
    const ai = ['Implemented CI/CD pipeline for releases'];
    const recovered = ['Implemented CI/CD pipeline for production releases using GitHub Actions'];
    const merged = preferRecoveredStringList(recovered, ai);
    expect(merged[0]).toBe(recovered[0]);
  });

  it('mergeParserWithRecoveredWording keeps parser company and dates', () => {
    const parser: ExtractedResumeData = {
      fullName: 'Jane Doe',
      email: 'j@example.com',
      phone: '',
      location: '',
      summary: '',
      skills: [],
      experience: [
        {
          company: 'Acme Corp',
          position: 'Software Engineer',
          startDate: '2020-01',
          endDate: '',
          current: true,
          description: 'Developed scalable web services and APIs.',
          achievements: ['Developed scalable web services'],
        },
      ],
      education: [],
      confidence: 80,
      rawText: '',
    };
    const recovered: ExtractedResumeData = {
      ...parser,
      experience: [
        {
          company: 'Acme',
          position: 'Engineer',
          startDate: '2019',
          endDate: '',
          current: true,
          description: '• Built REST APIs in Node.js\n• Reduced deployment time by 40%',
          achievements: ['Built REST APIs in Node.js', 'Reduced deployment time by 40%'],
        },
      ],
    };
    const merged = mergeParserWithRecoveredWording(parser, recovered);
    expect(merged.experience[0].company).toBe('Acme Corp');
    expect(merged.experience[0].position).toBe('Software Engineer');
    expect(merged.experience[0].startDate).toBe('2020-01');
    expect(merged.experience[0].description).toContain('Built REST APIs');
    expect(merged.experience[0].achievements).toContain('Reduced deployment time by 40%');
  });

  it('applyRecoveredWordingToProfile does not duplicate experience rows', () => {
    const profile = {
      experience: [
        {
          company: 'Globex',
          position: 'Analyst',
          description: 'Summarized duties from AI.',
          achievements: [],
        },
      ],
    };
    const recovered: ExtractedResumeData = {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
      skills: [],
      experience: [
        {
          company: 'Globex',
          position: 'Analyst',
          startDate: '',
          endDate: '',
          current: false,
          description: '• Prepared monthly financial reports\n• Audited vendor invoices',
          achievements: ['Prepared monthly financial reports', 'Audited vendor invoices'],
        },
      ],
      education: [],
      confidence: 0,
      rawText: '',
    };
    const out = applyRecoveredWordingToProfile(profile, recovered);
    expect(out.experience).toHaveLength(1);
    expect((out.experience as any[])[0].description).toContain('Prepared monthly financial reports');
  });
});
