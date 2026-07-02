import {
  buildCanonicalResume,
  buildCanonicalResumeFromValidation,
  deserializeCanonicalResume,
  experienceNodeId,
  freezeCanonicalResume,
  isFrozenCanonicalResume,
  serializeBuilderResume,
  serializeCanonicalResume,
  toExtractedResumeData,
} from '@/lib/resume-parser/custom/canonical-resume';
import { validateAndRepairResume } from '@/lib/resume-parser/custom/validation-repair';
import { extractExperiencesFromSection } from '@/lib/resume-parser/custom/experience-extraction';
import { extractSkillsIntelligence } from '@/lib/resume-parser/custom/skills-intelligence';

describe('canonical resume model', () => {
  const section = [
    'Software Engineer | Technoart Pvt Ltd',
    'Jan 2022 - Present',
    '- Built APIs with Python',
  ].join('\n');

  it('builds immutable graph with stable ids', () => {
    const experiences = extractExperiencesFromSection(section);
    const skills = extractSkillsIntelligence({ skillsSectionText: 'Python, React' });
    const repaired = validateAndRepairResume({
      experiences,
      skills,
      sectionTexts: { experience: section },
      parserConfidence: 70,
    });

    const resume = buildCanonicalResumeFromValidation(repaired);
    expect(isFrozenCanonicalResume(resume)).toBe(true);
    expect(resume.experience.length).toBeGreaterThanOrEqual(1);
    expect(resume.experience[0].id).toMatch(/^exp_[0-9a-f]{8}$/);

    const idAgain = experienceNodeId(0, resume.experience[0].data);
    expect(resume.experience[0].id).toBe(idAgain);
  });

  it('deterministic ids across rebuilds', () => {
    const input = {
      identity: { fullName: 'Jane Doe', email: 'jane@example.com', phone: '+1 555' },
      summary: { summary: 'Experienced developer.' },
      experience: [
        {
          company: 'Acme',
          position: 'Dev',
          startDate: '2020-01',
          endDate: '2022-06',
          current: false,
          description: '',
          achievements: [],
        },
      ],
      projects: [],
      education: [],
      skills: [{ name: 'Python' }],
      languages: [{ name: 'English', proficiency: 'Native' }],
      certifications: [],
      validationReport: {
        errors: [],
        warnings: [],
        manualReview: [],
        sectionConfidence: {
          identity: 80,
          summary: 70,
          experience: 75,
          projects: 0,
          education: 0,
          skills: 80,
          languages: 60,
          certifications: 0,
        },
      },
      repairReport: { repairs: [], repairCount: 0 },
      resumeQualityScore: 75,
      parserConfidenceScore: 72,
    };

    const a = buildCanonicalResume(input);
    const b = buildCanonicalResume(input);
    expect(a.experience[0].id).toBe(b.experience[0].id);
    expect(a.skills[0].id).toBe(b.skills[0].id);
  });

  it('builder export strips metadata and ids', () => {
    const repaired = validateAndRepairResume({
      skills: extractSkillsIntelligence({ skillsSectionText: 'Python' }),
      parserConfidence: 60,
    });
    const resume = buildCanonicalResumeFromValidation(repaired);
    const builder = toExtractedResumeData(resume);
    const builderJson = serializeBuilderResume(resume);
    const parsed = JSON.parse(builderJson) as typeof builder;

    expect(builder.skills).toEqual(['Python']);
    expect(parsed.metadata).toBeUndefined();
    expect((parsed as { experience?: unknown[] }).experience).toBeDefined();
    expect(builder.confidence).toBe(resume.metadata.quality.parserConfidenceScore);
  });

  it('round-trips full canonical snapshot', () => {
    const repaired = validateAndRepairResume({ parserConfidence: 50 });
    const resume = buildCanonicalResumeFromValidation(repaired);
    const json = serializeCanonicalResume(resume);
    const restored = deserializeCanonicalResume(json);

    expect(restored.version).toBe(resume.version);
    expect(restored.metadata.quality.repairCount).toBe(resume.metadata.quality.repairCount);
    expect(isFrozenCanonicalResume(restored)).toBe(true);
  });

  it('stores rejected diagnostics without merging invalid data', () => {
    const resume = buildCanonicalResume({
      identity: { fullName: '', email: '', phone: '' },
      summary: { summary: '' },
      experience: [],
      projects: [],
      education: [],
      skills: [],
      languages: [],
      certifications: [],
      validationReport: {
        errors: [{ severity: 'error', section: 'experience', code: 'invalid', message: 'bad' }],
        warnings: [],
        manualReview: [],
        sectionConfidence: {
          identity: 0,
          summary: 0,
          experience: 0,
          projects: 0,
          education: 0,
          skills: 0,
          languages: 0,
          certifications: 0,
        },
      },
      repairReport: { repairs: [], repairCount: 0 },
      resumeQualityScore: 10,
      parserConfidenceScore: 10,
      rejected: [{ section: 'experience', index: 0, reason: 'Failed validation', code: 'invalid_experience' }],
    });

    expect(resume.experience).toHaveLength(0);
    expect(resume.metadata.rejected).toHaveLength(1);
    expect(resume.metadata.quality.errorCount).toBe(1);
  });

  it('cannot mutate frozen resume', () => {
    const repaired = validateAndRepairResume({ parserConfidence: 50 });
    const resume = buildCanonicalResumeFromValidation(repaired);
    expect(() => {
      (resume as { version: string }).version = '9.9.9';
    }).toThrow();
  });
});
