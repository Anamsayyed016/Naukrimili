import {
  validateAndRepairResume,
  createRepairContext,
  repairExperienceEntry,
} from '@/lib/resume-parser/custom/validation-repair';
import { extractExperiencesFromSection } from '@/lib/resume-parser/custom/experience-extraction';
import { extractSkillsIntelligence } from '@/lib/resume-parser/custom/skills-intelligence';
import type { CustomExtractedExperience } from '@/lib/resume-parser/custom/experience-extraction';

describe('custom validation & repair engine', () => {
  it('repairs current role with end date conflict', () => {
    const exp: CustomExtractedExperience = {
      company: 'Acme Corp',
      designation: 'Software Engineer',
      location: '',
      employmentType: '',
      startDate: '2022-01',
      endDate: '2024-06',
      current: true,
      description: '',
      bulletPoints: ['Built APIs'],
      technologies: ['Python'],
      confidence: 70,
      fieldConfidence: {
        company: 70,
        designation: 70,
        location: 0,
        employmentType: 0,
        startDate: 70,
        endDate: 60,
        description: 50,
      },
    };

    const ctx = createRepairContext({ rawText: '' });
    const repaired = repairExperienceEntry(exp, 0, ctx);

    expect(repaired.current).toBe(true);
    expect(repaired.endDate).toBeNull();
    expect(ctx.repairs.some((r) => r.field === 'endDate')).toBe(true);
  });

  it('normalizes skill aliases and dedupes', () => {
    const skills = extractSkillsIntelligence({
      skillsSectionText: 'ReactJS, React, NodeJS, Python',
    });

    const result = validateAndRepairResume({
      skills,
      parserConfidence: 75,
    });

    const names = result.validated.skills.map((s) => s.name);
    expect(names).toContain('React');
    expect(names).toContain('Node.js');
    expect(names.filter((n) => n === 'React').length).toBe(1);
    expect(result.repairReport.repairCount).toBeGreaterThanOrEqual(1);
  });

  it('full pipeline with experience extraction', () => {
    const section = [
      'Software Engineer | Technoart Pvt Ltd | Bhopal',
      'Jan 2022 - Present',
      '- Developed REST APIs at Technoart using Python and Django',
      '',
      'Junior Developer | Infosys',
      'Jun 2020 - Dec 2021',
      '- Worked on enterprise applications',
    ].join('\n');

    const experiences = extractExperiencesFromSection(section);
    const skills = extractSkillsIntelligence({
      skillsSectionText: 'Python, Django, React',
      experienceTechnologies: experiences.map((e) => e.technologies),
    });

    const result = validateAndRepairResume({
      rawText: section,
      experiences,
      skills,
      sectionTexts: { experience: section, skills: 'Python, Django, React' },
      parserConfidence: 72,
    });

    expect(result.resume.experience.length).toBeGreaterThanOrEqual(1);
    expect(result.resumeQualityScore).toBeGreaterThan(0);
    expect(result.parserConfidenceScore).toBeGreaterThan(0);
    expect(result.validationReport.sectionConfidence.experience).toBeGreaterThan(0);
  });

  it('flags overlapping employment', () => {
    const experiences: CustomExtractedExperience[] = [
      {
        company: 'A Corp',
        designation: 'Dev',
        location: '',
        employmentType: '',
        startDate: '2020-01',
        endDate: '2023-12',
        current: false,
        description: '',
        bulletPoints: [],
        technologies: [],
        confidence: 60,
        fieldConfidence: {
          company: 60,
          designation: 60,
          location: 0,
          employmentType: 0,
          startDate: 60,
          endDate: 60,
          description: 0,
        },
      },
      {
        company: 'B Corp',
        designation: 'Dev',
        location: '',
        employmentType: '',
        startDate: '2022-01',
        endDate: '2024-06',
        current: false,
        description: '',
        bulletPoints: [],
        technologies: [],
        confidence: 60,
        fieldConfidence: {
          company: 60,
          designation: 60,
          location: 0,
          employmentType: 0,
          startDate: 60,
          endDate: 60,
          description: 0,
        },
      },
    ];

    const result = validateAndRepairResume({ experiences });
    expect(
      result.validationReport.warnings.some((w) => w.code === 'overlapping_employment')
    ).toBe(true);
  });

  it('rejects invalid email without inventing replacement', () => {
    const result = validateAndRepairResume({
      identity: {
        fullName: 'Jane Doe',
        professionalHeadline: '',
        email: 'not-an-email',
        phone: '',
        alternatePhone: '',
        linkedin: '',
        github: '',
        portfolio: '',
        website: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        nationality: '',
        dateOfBirth: '',
        currentCompany: '',
        currentDesignation: '',
        professionalTitle: '',
        confidence: 50,
        fieldConfidence: {
          fullName: 50,
          professionalHeadline: 0,
          email: 40,
          phone: 0,
          alternatePhone: 0,
          linkedin: 0,
          github: 0,
          portfolio: 0,
          website: 0,
          address: 0,
          city: 0,
          state: 0,
          country: 0,
          postalCode: 0,
          nationality: 0,
          dateOfBirth: 0,
          currentCompany: 0,
          currentDesignation: 0,
          professionalTitle: 0,
        },
      },
    });

    expect(result.resume.email).toBe('');
    expect(result.validationReport.errors.some((e) => e.code === 'invalid_email')).toBe(true);
  });
});
