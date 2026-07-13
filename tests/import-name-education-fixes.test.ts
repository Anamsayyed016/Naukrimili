import {
  enrichPartialNameFromEmail,
  mergeEmailLeadingNameWithHeader,
  expandVowelDroppedNameFromEmail,
  reconcileEducationDegreeAndField,
  sanitizeEducationEntry,
  sanitizeSkillEntry,
} from '@/lib/resume-parser/import-sanitize';
import { detectDegreeFromLine } from '@/lib/resume-parser/custom/education-extraction/degree';
import { detectFieldFromLine } from '@/lib/resume-parser/custom/education-extraction/field';

describe('import name and education fixes', () => {
  it('prepends email leading name when header omits it (Raj Kumar Bhawsar)', () => {
    const email = 'rajbhawsar76@gmail.com';
    expect(mergeEmailLeadingNameWithHeader('Kumar Bhawsar', email)).toBe('Raj Kumar Bhawsar');
    expect(enrichPartialNameFromEmail('Kumar Bhawsar', email)).toBe('Raj Kumar Bhawsar');
  });

  it('does not duplicate names already present in header', () => {
    const email = 'rajkumarbhawsar@gmail.com';
    expect(enrichPartialNameFromEmail('Raj Kumar Bhawsar', email)).toBe('Raj Kumar Bhawsar');
    expect(expandVowelDroppedNameFromEmail('Raj Kumar Bhawsar', email)).toBe('Raj Kumar Bhawsar');
    expect(mergeEmailLeadingNameWithHeader('Qamar Ali', 'qmr.ali@gmail.com')).toBe('Qamar Ali');
    expect(enrichPartialNameFromEmail('Qamar Ali', 'qmr.ali@gmail.com')).toBe('Qamar Ali');
  });

  it('expands vowel-stripped Naukri header names from dotted email', () => {
    expect(expandVowelDroppedNameFromEmail('Qmr Ali', 'qamar.ali@gmail.com')).toBe('Qamar Ali');
  });

  it('dedupes LL.B. degree and field', () => {
    expect(reconcileEducationDegreeAndField('LL.B.', 'LL.B.')).toEqual({
      degree: 'LL.B.',
      field: '',
    });
    expect(reconcileEducationDegreeAndField('LL.B. in', 'LL.B.')).toEqual({
      degree: 'LL.B.',
      field: '',
    });
    expect(reconcileEducationDegreeAndField('Bachelor of Laws', '')).toEqual({
      degree: 'Bachelor of Laws',
      field: '',
    });
    expect(reconcileEducationDegreeAndField('B.Tech in Computer Science', '')).toEqual({
      degree: 'B.Tech',
      field: 'Computer Science',
    });
  });

  it('detects LL.B. as degree not field of study', () => {
    const degree = detectDegreeFromLine('LL.B.');
    expect(degree.degree).toMatch(/LL\.?B/i);
    expect(degree.confidence).toBeGreaterThanOrEqual(35);

    const field = detectFieldFromLine('LL.B.');
    expect(field.fieldOfStudy).toBe('');
  });

  it('sanitizes education entry without duplicate field', () => {
    const row = sanitizeEducationEntry({
      degree: 'LL.B.',
      field: 'LL.B.',
      institution: 'Law College',
      year: '2006',
    });
    expect(row?.degree).toMatch(/LL\.?B/i);
    expect(row?.field).toBe('');
  });

  it('rejects date ranges and experience headings from skills', () => {
    expect(sanitizeSkillEntry('2007 TO Sept')).toBe('');
    expect(sanitizeSkillEntry('Other Inherent Secretarial')).toBe('');
    expect(sanitizeSkillEntry('Compliance')).toBe('Compliance');
  });
});
