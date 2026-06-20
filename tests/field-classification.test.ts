import {
  classifyResumeTextFragment,
  isClassifiedPersonName,
  isEmailOrDomainFragment,
  isExperienceResponsibility,
  isMeasurableAchievement,
  shouldKeepAsGlobalAchievement,
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

  it('rejects email domain fragments as person names', () => {
    expect(isEmailOrDomainFragment('ail.com')).toBe(true);
    expect(isEmailOrDomainFragment('gmail.com')).toBe(true);
    expect(isEmailOrDomainFragment('anamkhan@gmail.com')).toBe(true);
    expect(isClassifiedPersonName('ail.com')).toBe(false);
    expect(isClassifiedPersonName('gmail.com')).toBe(false);
  });

  it('rejects job titles and standalone section headings as person names', () => {
    expect(isClassifiedPersonName('Software Developer')).toBe(false);
    expect(isClassifiedPersonName('Full Stack Developer')).toBe(false);
    expect(isClassifiedPersonName('Chief Executive Officer')).toBe(false);
    expect(isClassifiedPersonName('Summary')).toBe(false);
    expect(isClassifiedPersonName('Career Objective')).toBe(false);
  });

  it('rejects CS self-practise firm lines as person names', () => {
    const { isFirmOrLocationNamePhrase } = require('@/lib/resume-parser/field-classification');
    expect(isClassifiedPersonName('Self Practise Bhopal')).toBe(false);
    expect(isFirmOrLocationNamePhrase('Self Practise Bhopal')).toBe(true);
    expect(isFirmOrLocationNamePhrase('Practise Bhopal')).toBe(true);
  });

  it('does not split section headers into first and last name', () => {
    const split = splitClassifiedFullName('Professional Qualification');
    expect(split.firstName).toBe('');
    expect(split.lastName).toBe('');
    expect(split.rejected.length).toBeGreaterThan(0);
  });

  it('classifies experience responsibilities vs measurable achievements', () => {
    expect(isExperienceResponsibility('Managed daily operations and coordinated team schedules')).toBe(true);
    expect(isExperienceResponsibility('Handled client inquiries and resolved complaints')).toBe(true);
    expect(isMeasurableAchievement('Increased sales by 30% within 6 months')).toBe(true);
    expect(isMeasurableAchievement('Managed team of 50 across 3 regions')).toBe(true);
    expect(isMeasurableAchievement('Managed daily operations and coordinated team schedules')).toBe(false);
    expect(shouldKeepAsGlobalAchievement('Led cross-functional projects')).toBe(false);
    expect(shouldKeepAsGlobalAchievement('Reduced operational cost by 15%')).toBe(true);
    expect(shouldKeepAsGlobalAchievement('B.Tech in Computer Science, IIT Delhi')).toBe(false);
  });
});
