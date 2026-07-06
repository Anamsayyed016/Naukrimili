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

  it('restores education and projects dropped during mapping', () => {
    const { builder, report } = recoverBuilderFormSections(
      {
        education: [],
        projects: [{ name: 'Portal', description: '' }],
      },
      {
        mergedImport: {
          education: [
            { school: 'MIT', degree: 'B.Tech', field: 'Computer Science', year: '2022' },
            { university: 'Stanford', degree: 'M.S.', field: 'AI', year: '2024' },
          ],
          projects: [
            { projectName: 'Portal', description: 'Built job portal' },
            { title: 'Chat App', summary: 'Realtime messaging' },
          ],
        },
      }
    );
    expect((builder.education as unknown[]).length).toBe(2);
    expect((builder.education as Record<string, unknown>[])[0].institution).toBe('MIT');
    expect((builder.projects as unknown[]).length).toBe(2);
    expect((builder.projects as Record<string, unknown>[])[0].description).toBe('Built job portal');
    expect(report.recovered.some((r) => r.startsWith('education'))).toBe(true);
    expect(report.recovered.some((r) => r.startsWith('projects'))).toBe(true);
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
