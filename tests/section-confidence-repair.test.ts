/**
 * Unit tests for confidence-driven section scoring / weak-section selection.
 * Does not call OpenAI — only deterministic scoring + merge gates.
 */

import type { ExtractedResumeData } from '@/lib/enhanced-resume-ai';
import {
  mergeSectionRepairs,
  scoreExtractedSectionConfidence,
  selectWeakSectionsForRepair,
  SECTION_REPAIR_CONFIDENCE_THRESHOLD,
} from '@/lib/resume-parser/section-confidence-repair';

function base(overrides: Partial<ExtractedResumeData> = {}): ExtractedResumeData {
  return {
    fullName: 'Diksha Peswani',
    email: 'diksha@example.com',
    phone: '',
    location: '',
    summary: '',
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
    achievements: [],
    confidence: 50,
    rawText: '',
    ...overrides,
  };
}

describe('section-confidence-repair', () => {
  it('scores empty projects low when Projects heading exists in text', () => {
    const data = base({
      rawText: 'Projects\nBuilt an internal dashboard for finance\nSkills\nExcel',
    });
    const scores = scoreExtractedSectionConfidence(data, data.rawText);
    expect(scores.projects).toBeLessThan(SECTION_REPAIR_CONFIDENCE_THRESHOLD);
    expect(selectWeakSectionsForRepair(scores, data, data.rawText)).toContain('projects');
  });

  it('scores placeholder project titles as weak', () => {
    const data = base({
      projects: [{ name: 'Project 3', description: 'Did work', technologies: [] }],
      rawText: 'Projects\nProject 3\nDid work',
    });
    const scores = scoreExtractedSectionConfidence(data, data.rawText);
    expect(scores.projects).toBeLessThan(SECTION_REPAIR_CONFIDENCE_THRESHOLD);
  });

  it('keeps strong experience high confidence', () => {
    const data = base({
      experience: [
        {
          company: 'Infosys',
          position: 'Accounts Payable Analyst',
          startDate: '2019-01',
          endDate: '2022-06',
          current: false,
          description: 'Managed AP invoices and vendor reconciliations across ERP.',
          achievements: [],
        },
      ],
      rawText: 'Experience\nAccounts Payable Analyst at Infosys',
    });
    const scores = scoreExtractedSectionConfidence(data, data.rawText);
    expect(scores.experience).toBeGreaterThanOrEqual(SECTION_REPAIR_CONFIDENCE_THRESHOLD);
    expect(selectWeakSectionsForRepair(scores, data, data.rawText)).not.toContain('experience');
  });

  it('mergeSectionRepairs never overwrites strong skills with empty patch', () => {
    const data = base({ skills: ['Excel', 'SAP', 'Tally'] });
    const merged = mergeSectionRepairs(data, { skills: [] }, ['skills']);
    expect(merged.skills).toEqual(['Excel', 'SAP', 'Tally']);
  });

  it('mergeSectionRepairs unions skills and rejects placeholder projects', () => {
    const data = base({
      skills: ['Excel'],
      projects: [{ name: 'Legacy Tool', description: 'x', technologies: [] }],
    });
    const merged = mergeSectionRepairs(
      data,
      {
        skills: ['SAP', 'Excel'],
        projects: [
          { name: 'Project 1', description: 'fake', technologies: [] },
          { name: 'ERP Migration', description: 'Led SAP rollout', technologies: ['SAP'] },
        ],
      },
      ['skills', 'projects']
    );
    expect(merged.skills).toEqual(expect.arrayContaining(['Excel', 'SAP']));
    expect(merged.projects?.map((p) => p.name)).toEqual(['ERP Migration']);
  });

  it('does not select optional empty sections without heading evidence', () => {
    const data = base({
      rawText: 'Experience\nEngineer at Acme\nEducation\nB.Tech',
      experience: [
        {
          company: 'Acme',
          position: 'Engineer',
          startDate: '2020',
          endDate: '2021',
          current: false,
          description: 'Built APIs for internal tools and clients.',
          achievements: [],
        },
      ],
      education: [
        {
          institution: 'MIT',
          degree: 'B.Tech',
          field: 'CS',
          startDate: '',
          endDate: '2019',
        },
      ],
    });
    const scores = scoreExtractedSectionConfidence(data, data.rawText);
    const weak = selectWeakSectionsForRepair(scores, data, data.rawText);
    expect(weak).not.toContain('certifications');
    expect(weak).not.toContain('languages');
  });
});
