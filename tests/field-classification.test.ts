import {
  classifyResumeTextFragment,
  isClassifiedPersonName,
  splitClassifiedFullName,
} from '@/lib/resume-parser/field-classification';

describe('field classification', () => {
  it('classifies section headers with zero person-name confidence', () => {
    expect(classifyResumeTextFragment('Professional Qualification').kind).toBe('SECTION_HEADER');
    expect(classifyResumeTextFragment('Professional').kind).toBe('SECTION_HEADER');
    expect(classifyResumeTextFragment('Qualification').kind).toBe('SECTION_HEADER');
    expect(classifyResumeTextFragment('Work History').kind).toBe('SECTION_HEADER');
    expect(classifyResumeTextFragment('Core Competencies').kind).toBe('SECTION_HEADER');
  });

  it('classifies CS Articleship as education not person name', () => {
    expect(classifyResumeTextFragment('CS Articleship').kind).toBe('EDUCATION');
    expect(classifyResumeTextFragment('CS').kind).toBe('CERTIFICATION');
    expect(classifyResumeTextFragment('Articleship').kind).toBe('EDUCATION');
  });

  it('accepts real person names', () => {
    expect(isClassifiedPersonName('Anam Khan')).toBe(true);
    expect(isClassifiedPersonName('CS Mujahid Ali')).toBe(true);
    expect(isClassifiedPersonName('Rajesh Sharma')).toBe(true);
  });

  it('rejects academia fragments and metric blurbs as person names', () => {
    expect(isClassifiedPersonName('Academia Th')).toBe(false);
    expect(isClassifiedPersonName('turnover of around 1000 Crores)')).toBe(false);
  });

  it('does not split section headers into first and last name', () => {
    const split = splitClassifiedFullName('Professional Qualification');
    expect(split.firstName).toBe('');
    expect(split.lastName).toBe('');
    expect(split.rejected.length).toBeGreaterThan(0);
  });
});
