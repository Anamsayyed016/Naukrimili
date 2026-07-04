import {
  normalizeExperienceEntryAliases,
  normalizeImportProfileAliases,
  normalizeEducationEntryAliases,
  normalizeProjectEntryAliases,
  recoverBuilderFormSections,
  splitFullNameForBuilder,
} from '@/lib/resume-parser/builder-field-mapper';

describe('builder-field-mapper', () => {
  it('normalizes experience company and designation aliases', () => {
    const norm = normalizeExperienceEntryAliases({
      organisation: 'Acme Corp',
      role: 'Software Engineer',
      firm: '',
    });
    expect(norm.company).toBe('Acme Corp');
    expect(norm.position).toBe('Software Engineer');
    expect(norm.designation).toBe('Software Engineer');
  });

  it('normalizes education institution and gpa aliases', () => {
    const norm = normalizeEducationEntryAliases({
      university: 'MIT',
      major: 'Computer Science',
      cgpa: '8.5',
    });
    expect(norm.institution).toBe('MIT');
    expect(norm.field).toBe('Computer Science');
    expect(norm.cgpa).toBe('8.5');
  });

  it('normalizes project technologies from string', () => {
    const norm = normalizeProjectEntryAliases({
      projectName: 'Job Portal',
      techStack: 'React, Node.js, PostgreSQL',
    });
    expect(norm.name).toBe('Job Portal');
    expect(norm.technologies).toEqual(['React', 'Node.js', 'PostgreSQL']);
  });

  it('splits full name for builder identity', () => {
    expect(splitFullNameForBuilder('ANAM SAYYED')).toEqual({
      firstName: 'ANAM',
      lastName: 'SAYYED',
    });
  });

  it('normalizes upload profile with alias sections', () => {
    const profile = normalizeImportProfileAliases({
      fullName: 'Jane Doe',
      interests: ['Reading', 'Travel'],
      workExperience: [
        { employer: 'Globex', jobTitle: 'Analyst', description: 'Built reports' },
      ],
    });
    expect(profile.firstName).toBe('Jane');
    expect(profile.lastName).toBe('Doe');
    expect(profile.hobbies).toEqual(['Reading', 'Travel']);
    expect((profile.experience as unknown[]).length).toBe(1);
  });

  it('recovers empty builder experience company from import', () => {
    const { builder, report } = recoverBuilderFormSections(
      {
        experience: [{ title: 'Developer', company: '', description: 'Did work' }],
      },
      {
        mergedImport: {
          experience: [{ company: 'Initech', position: 'Developer', description: 'Did work' }],
        },
      }
    );
    expect((builder.experience as Record<string, unknown>[])[0].company).toBe('Initech');
    expect(report.recovered.some((r) => r.includes('company'))).toBe(true);
  });

  it('splits multi-column title and company on one designation field', () => {
    const norm = normalizeExperienceEntryAliases({
      position: 'Full Stack Developer\tDigital Solutions Pvt Ltd',
      startDate: '2022-01',
      current: true,
    });
    expect(norm.position).toBe('Full Stack Developer');
    expect(norm.company).toBe('Digital Solutions Pvt Ltd');
  });

  it('rejects Present as company value', () => {
    const norm = normalizeExperienceEntryAliases({
      company: 'Present',
      title: 'Full Stack Developer',
    });
    expect(norm.company).toBeUndefined();
    expect(norm.position).toBe('Full Stack Developer');
  });
});
