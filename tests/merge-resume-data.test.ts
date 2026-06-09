import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import { mergeResumeData } from '@/lib/resume-parser/merge-resume-data';

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

describe('mergeResumeData', () => {
  it('keeps Affinda scalar fields when populated', () => {
    const affinda = {
      ...base(),
      fullName: 'Anam Sayyed',
      skills: ['Python'],
    };
    const eden = {
      ...base(),
      fullName: 'Wrong Name',
      skills: ['React', 'Django', 'python'],
    };
    const merged = mergeResumeData(affinda, eden);
    expect(merged.fullName).toBe('Anam Sayyed');
    expect(merged.skills).toEqual(['Python', 'React', 'Django']);
  });

  it('fills missing summary from Eden without overwriting Affinda', () => {
    const affinda = { ...base(), summary: 'Affinda summary' };
    const eden = { ...base(), summary: 'Eden summary' };
    expect(mergeResumeData(affinda, eden).summary).toBe('Affinda summary');
    expect(mergeResumeData({ ...base() }, eden).summary).toBe('Eden summary');
  });

  it('merges experience by title+company and fills missing fields only', () => {
    const affinda = {
      ...base(),
      experience: [
        {
          company: 'Acme',
          position: 'Engineer',
          location: '',
          startDate: '2020-01',
          endDate: '',
          current: true,
          description: '',
          achievements: [],
        },
      ],
    };
    const eden = {
      ...base(),
      experience: [
        {
          company: 'acme',
          position: 'engineer',
          location: 'Remote',
          startDate: '2020-01',
          endDate: '',
          current: true,
          description: 'Built APIs',
          achievements: ['Shipped v2'],
        },
        {
          company: 'Beta Corp',
          position: 'Intern',
          location: '',
          startDate: '2018-01',
          endDate: '2019-01',
          current: false,
          description: '',
          achievements: [],
        },
      ],
    };
    const merged = mergeResumeData(affinda, eden);
    expect(merged.experience).toHaveLength(2);
    expect(merged.experience[0].location).toBe('Remote');
    expect(merged.experience[0].description).toBe('Built APIs');
    expect(merged.experience[0].company).toBe('Acme');
    expect(merged.experience[1].company).toBe('Beta Corp');
  });

  it('uses Eden projects when Affinda has none and fills missing descriptions on match', () => {
    const affinda = {
      ...base(),
      projects: [{ name: 'Portal', description: '', technologies: [], url: '' }],
    };
    const eden = {
      ...base(),
      projects: [
        { name: 'portal', description: 'Internal portal', technologies: ['React'], url: '' },
        { name: 'Mobile App', description: 'iOS app', technologies: ['Swift'], url: '' },
      ],
    };
    const merged = mergeResumeData(affinda, eden);
    expect(merged.projects).toHaveLength(2);
    expect(merged.projects?.[0].description).toBe('Internal portal');
    expect(merged.projects?.[1].name).toBe('Mobile App');
  });

  it('merges hobbies when Affinda empty, otherwise dedupes', () => {
    const eden = { ...base(), hobbies: ['Dance', 'Music'] };
    expect(mergeResumeData({ ...base() }, eden).hobbies).toEqual(['Dance', 'Music']);
    const affinda = { ...base(), hobbies: ['Reading'] };
    expect(mergeResumeData(affinda, eden).hobbies).toEqual(['Reading', 'Dance', 'Music']);
  });
});
