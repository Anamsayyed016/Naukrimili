import { resolveSafeRepair } from '@/lib/resume-parser/custom/validation-repair/repair-utils';
import { repairExperienceEntry } from '@/lib/resume-parser/custom/validation-repair/experience';
import { createRepairContext } from '@/lib/resume-parser/custom/validation-repair/types';
import type { CustomExtractedExperience } from '@/lib/resume-parser/custom/experience-extraction/types';
import { normalizeNameLine } from '@/lib/resume-parser/custom/identity-extraction/name';

describe('safe repair utils', () => {
  it('fills empty fields', () => {
    expect(resolveSafeRepair('', 'Acme Corp', 0, 80)).toBe('Acme Corp');
  });

  it('preserves valid existing company', () => {
    expect(
      resolveSafeRepair('State Secretariat', 'Government Specialist', 70, 82, (v) =>
        /secretariat|ministry/i.test(v)
      )
    ).toBe('State Secretariat');
  });

  it('does not overwrite valid designation', () => {
    expect(
      resolveSafeRepair('Nurse Specialist', 'Manipal Hospitals', 75, 80, () => true)
    ).toBe('Nurse Specialist');
  });
});

describe('experience safe repair', () => {
  it('preserves parser-extracted company on pipe headers', () => {
    const exp: CustomExtractedExperience = {
      company: 'Manipal Hospitals',
      designation: 'Nurse Specialist',
      location: '',
      employmentType: '',
      startDate: '2018',
      endDate: null,
      current: true,
      description: '',
      bulletPoints: ['Delivered nurse outcomes'],
      technologies: [],
      confidence: 84,
      fieldConfidence: {
        company: 84,
        designation: 80,
        location: 0,
        employmentType: 0,
        startDate: 75,
        endDate: 0,
        description: 60,
      },
    };
    const ctx = createRepairContext({});
    const repaired = repairExperienceEntry(exp, 0, ctx);
    expect(repaired.company).toBe('Manipal Hospitals');
    expect(repaired.designation).toBe('Nurse Specialist');
  });
});

describe('name line normalization', () => {
  it('strips multi-column section noise from header lines', () => {
    expect(normalizeNameLine('ANAM SAYYED                          SKILLS')).toBe('ANAM SAYYED');
  });
});
