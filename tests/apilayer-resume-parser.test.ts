import {
  parseApilayerRetryAfterSeconds,
  transformApilayerPayload,
} from '@/lib/apilayer-resume-parser';
import { hasMinimalAutofillPayload } from '@/lib/resume-parser/map-to-upload-profile';

describe('parseApilayerRetryAfterSeconds', () => {
  it('accepts short numeric retry-after values', () => {
    expect(parseApilayerRetryAfterSeconds('2')).toBe(2);
    expect(parseApilayerRetryAfterSeconds('3')).toBe(3);
  });

  it('rejects multi-day quota reset retry-after (fail fast)', () => {
    expect(parseApilayerRetryAfterSeconds('277393')).toBeNull();
    expect(parseApilayerRetryAfterSeconds('86400')).toBeNull();
  });

  it('returns null for missing or invalid values', () => {
    expect(parseApilayerRetryAfterSeconds(null)).toBeNull();
    expect(parseApilayerRetryAfterSeconds('')).toBeNull();
  });
});

describe('transformApilayerPayload', () => {
  it('maps ApiLayer sample response to ExtractedResumeData', () => {
    const result = transformApilayerPayload({
      name: 'JOHN DOE',
      email: 'john@gmail.com',
      phone: '+1 555-0100',
      location: 'Camarillo, CA',
      linkedin: 'https://linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe',
      summary: 'Experienced front-end developer.',
      skills: ['Javascript', 'React', 'Css'],
      education: [{ name: 'River Brook University', dates: '2011' }],
      experience: [
        {
          title: 'Front End Developer',
          dates: '2015',
          location: 'Camarillo',
          organization: 'DP TECHNOLOGY CORP.',
        },
      ],
      languages: ['English'],
      certifications: [{ name: 'AWS Certified', issuer: 'Amazon', date: '2020' }],
    });

    expect(result.fullName).toBe('JOHN DOE');
    expect(result.email).toBe('john@gmail.com');
    expect(result.phone).toContain('555');
    expect(result.linkedin).toContain('linkedin.com');
    expect(result.portfolio).toContain('github.com');
    expect(result.skills).toEqual(expect.arrayContaining(['Javascript', 'React']));
    expect(result.experience[0].company).toBe('DP TECHNOLOGY CORP.');
    expect(result.experience[0].position).toBe('Front End Developer');
    expect(result.education[0].institution).toMatch(/River Brook/i);
    expect(result.certifications?.[0].name).toBe('AWS Certified');
    expect(result.languages?.[0]).toEqual({ name: 'English', proficiency: '' });
    expect(result.confidence).toBeGreaterThan(50);
    expect(hasMinimalAutofillPayload(result)).toBe(true);
  });

  it('parses date ranges and present roles', () => {
    const result = transformApilayerPayload({
      name: 'Jane Smith',
      email: 'jane@example.com',
      experience: [
        {
          title: 'Engineer',
          organization: 'Acme',
          dates: '2018 - Present',
          description: '- Built APIs\n- Led team',
        },
      ],
      skills: ['Go', 'SQL'],
    });

    expect(result.experience[0].current).toBe(true);
    expect(result.experience[0].startDate).toBeTruthy();
    expect(result.experience[0].achievements.length).toBeGreaterThan(0);
  });
});
