import {
  preferRecoveredWording,
  preferRecoveredStringList,
  shouldPreferRecoveredWording,
  mergeParserWithRecoveredWording,
  applyRecoveredWordingToProfile,
  educationSectionMatch,
  experienceSectionMatch,
} from '@/lib/resume-parser/prefer-recovered-wording';
import {
  mergeOrphanExperienceEntries,
  reconcileExperienceHeaderFields,
  unionExperienceBodyFields,
} from '@/lib/resume-parser/import-sanitize';
import { ExtractedResumeData } from '@/lib/enhanced-resume-ai';

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

  it('educationSectionMatch treats capitalized fields symmetrically', () => {
    const parser = { Institution: 'State University', Degree: 'Bachelor of Science' };
    const recovered = { Institution: 'State University', Degree: 'Bachelor of Science' };
    expect(educationSectionMatch(parser, recovered)).toBe(true);
    expect(educationSectionMatch(recovered, parser)).toBe(true);
  });

  it('experienceSectionMatch requires company and role when both sides have both', () => {
    const sameCompanyDifferentRole = experienceSectionMatch(
      { company: 'Acme Corp', position: 'Software Engineer', startDate: '2020' },
      { company: 'Acme Corp', position: 'Product Manager', startDate: '2020' }
    );
    expect(sameCompanyDifferentRole).toBe(false);

    const matching = experienceSectionMatch(
      { company: 'Acme Corp', position: 'Software Engineer', startDate: '2020' },
      { company: 'Acme', position: 'Engineer', startDate: '2020' }
    );
    expect(matching).toBe(true);
  });

  it('unionExperienceBodyFields preserves all bullet lines from both sources', () => {
    const merged = unionExperienceBodyFields(
      {
        description: 'Developed REST APIs',
        achievements: ['Developed REST APIs'],
      },
      {
        description: 'Developed REST APIs\nOptimized SQL queries\nReduced response time by 40%',
        achievements: ['Optimized SQL queries', 'Reduced response time by 40%'],
      }
    );
    expect(merged.achievements).toHaveLength(3);
    expect(merged.description).toContain('Optimized SQL queries');
    expect(merged.description).toContain('Reduced response time by 40%');
  });

  it('applyRecoveredWordingToProfile backfills missing description from recovered text', () => {
    const profile = {
      experience: [
        {
          company: 'Globex Inc',
          position: 'Business Analyst',
          startDate: '2021',
          description: '',
          achievements: [],
          location: '',
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
          position: 'Business Analyst',
          startDate: '2021',
          endDate: '',
          current: false,
          location: 'Pune, MH',
          description: 'Managed GST filing\nPrepared reports\nVendor reconciliation',
          achievements: ['Managed GST filing', 'Prepared reports', 'Vendor reconciliation'],
        },
      ],
      education: [],
      confidence: 0,
      rawText: '',
    };
    const out = applyRecoveredWordingToProfile(profile, recovered);
    const exp = (out.experience as any[])[0];
    expect(exp.description).toContain('Managed GST filing');
    expect(exp.achievements).toContain('Prepared reports');
    expect(exp.location).toBe('Pune, MH');
  });

  it('applyRecoveredWordingToProfile backfills missing experience title from recovered text', () => {
    const profile = {
      experience: [
        {
          company: 'Globex Inc',
          position: '',
          startDate: '2021',
          description: 'AI summary without bullets.',
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
          position: 'Business Analyst',
          startDate: '2021',
          endDate: '',
          current: false,
          description: '• Prepared monthly financial reports',
          achievements: ['Prepared monthly financial reports'],
        },
      ],
      education: [],
      confidence: 0,
      rawText: '',
    };
    const out = applyRecoveredWordingToProfile(profile, recovered);
    expect((out.experience as any[])[0].position).toBe('Business Analyst');
    expect((out.experience as any[])[0].description).toContain('Prepared monthly financial reports');
  });

  it('reconcileExperienceHeaderFields moves Food Processor from company slot to title', () => {
    const reconciled = reconcileExperienceHeaderFields({
      company: 'Food Processor',
      position: '',
      location: '',
    });
    expect(reconciled.company).toBe('');
    expect(reconciled.position || reconciled.title).toBe('Food Processor');
  });

  it('reconcileExperienceHeaderFields swaps title and company when reversed', () => {
    const reconciled = reconcileExperienceHeaderFields({
      company: 'Food Processor',
      position: 'Pranav Food Processors India Pvt Ltd',
      location: 'Bhopal',
    });
    expect(reconciled.position || reconciled.title).toBe('Food Processor');
    expect(String(reconciled.company)).toContain('Pranav Food Processors');
    expect(reconciled.location).toBe('Bhopal');
  });

  it('reconcileExperienceHeaderFields maps title, company, and city layout', () => {
    const reconciled = reconcileExperienceHeaderFields({
      position: 'Food Processor',
      company: 'Pranav Food Processors India Pvt Ltd',
      location: 'Bhopal',
      description: 'Managed GST filing\nPrepared reports',
      achievements: ['Managed GST filing', 'Prepared reports'],
    });
    expect(reconciled.position || reconciled.title).toBe('Food Processor');
    expect(reconciled.company).toContain('Pranav Food Processors');
    expect(reconciled.location).toBe('Bhopal');
    expect(String(reconciled.description)).toContain('Managed GST filing');
  });

  it('mergeOrphanExperienceEntries folds date-only rows into previous job', () => {
    const merged = mergeOrphanExperienceEntries([
      {
        company: 'Globex',
        position: 'Analyst',
        description: '• Prepared reports',
        achievements: [],
      },
      {
        startDate: '2021',
        endDate: '2023',
        location: 'New York, NY',
      },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0].startDate).toBe('2021');
    expect(merged[0].endDate).toBe('2023');
    expect(merged[0].location).toBe('New York, NY');
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

  it('applyRecoveredWordingToProfile backfills company on later experiences by title and year', () => {
    const profile = {
      experience: [
        { company: 'Alpha Corp', position: 'Engineer', startDate: '2018', description: '', achievements: [] },
        { company: 'Beta LLC', position: 'Senior Engineer', startDate: '2020', description: '', achievements: [] },
        { company: '', position: 'Team Lead', startDate: '2022', description: 'Led migration', achievements: [] },
        { company: '', position: 'Architect', startDate: '2024', description: 'Designed platform', achievements: [] },
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
        { company: 'Alpha Corp', position: 'Engineer', startDate: '2018', endDate: '2020', current: false, description: '', achievements: [] },
        { company: 'Beta LLC', position: 'Senior Engineer', startDate: '2020', endDate: '2022', current: false, description: '', achievements: [] },
        { company: 'Gamma Systems', position: 'Team Lead', startDate: '2022', endDate: '2024', current: false, description: 'Led migration', achievements: [] },
        { company: 'Delta Tech', position: 'Architect', startDate: '2024', endDate: '', current: true, description: 'Designed platform', achievements: [] },
      ],
      education: [],
      confidence: 0,
      rawText: '',
    };
    const out = applyRecoveredWordingToProfile(profile, recovered);
    const exp = out.experience as any[];
    expect(exp).toHaveLength(4);
    expect(exp[2].company).toBe('Gamma Systems');
    expect(exp[3].company).toBe('Delta Tech');
  });

  it('reconcileExperienceHeaderFields keeps short company names in company slot', () => {
    const reconciled = reconcileExperienceHeaderFields({
      company: 'TCS',
      position: 'Developer',
      location: '',
    });
    expect(reconciled.company).toBe('TCS');
    expect(reconciled.position || reconciled.title).toBe('Developer');
  });
});
