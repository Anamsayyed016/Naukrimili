import {
  ingestCanonicalNodes,
  validateCanonicalNodes,
  runCanonicalBuilderMapping,
} from '@/lib/resume-builder/canonical-mapping';
import { coalesceBuilderImportPayload } from '@/lib/resume-builder/import-transformer';

describe('canonical-builder-mapping', () => {
  const RAW = [
    'WORK EXPERIENCE',
    'Full Stack Developer                 Digital Solutions Pvt Ltd',
    'Bhopal                               2022-01 - Present',
    '- Designed secure APIs.',
  ].join('\n');

  it('ingests experience as independent parent nodes with children', () => {
    const nodes = ingestCanonicalNodes({
      experience: [
        {
          title: 'Full Stack Developer',
          company: 'Digital Solutions Pvt Ltd',
          startDate: '2022-01',
          current: true,
        },
      ],
    });
    const parents = nodes.filter((n) => n.type === 'EXPERIENCE');
    expect(parents.length).toBe(1);
    const company = nodes.find((n) => n.type === 'COMPANY' && n.parent === parents[0].id);
    const title = nodes.find((n) => n.type === 'JOB_TITLE' && n.parent === parents[0].id);
    expect(company?.value).toBe('Digital Solutions Pvt Ltd');
    expect(title?.value).toBe('Full Stack Developer');
  });

  it('rejects Present as company node', () => {
    const { nodes, rejected } = validateCanonicalNodes(
      ingestCanonicalNodes({
        experience: [{ company: 'Present', title: 'Developer' }],
      })
    );
    expect(rejected.some((r) => r.includes('invalid-company'))).toBe(true);
    expect(nodes.find((n) => n.type === 'COMPANY' && n.value === 'Present')).toBeUndefined();
  });

  it('maps nodes to builder without merging experiences', () => {
    const result = runCanonicalBuilderMapping({
      importProfile: {
        experience: [
          { title: 'Developer A', company: 'Acme', startDate: '2020-01' },
          { title: 'Engineer B', company: 'Globex', startDate: '2022-01' },
        ],
        skills: ['Python', 'React'],
        languages: ['English'],
      },
      builderDraft: { experience: [], skills: [], languages: [] },
    });
    expect((result.builder.experience as unknown[]).length).toBe(2);
    expect((result.builder.skills as string[]).length).toBe(2);
    expect((result.builder.languages as unknown[]).length).toBe(1);
  });

  it('coalesce nested payload uses canonical mapping', () => {
    const coalesced = coalesceBuilderImportPayload({
      rawText: RAW,
      experience: [{ title: 'Full Stack Developer', startDate: '2022-01', current: true }],
      builderFormData: {
        experience: [
          {
            title: 'Full Stack Developer',
            company: '',
            startDate: '2022-01',
            current: true,
          },
        ],
      },
    });
    const exp = (coalesced.experience as Record<string, unknown>[])[0];
    expect(exp.company).toBe('Digital Solutions Pvt Ltd');
    expect(exp.title).toBe('Full Stack Developer');
    expect(String(exp.company)).not.toBe('Present');
  });

  it('routes awards to extended sections, not achievements', () => {
    const result = runCanonicalBuilderMapping({
      importProfile: {
        achievements: ['Shipped product X'],
        awards: ['Employee of the Year'],
      },
      builderDraft: { achievements: [], extendedSections: {} },
    });
    const achievements = result.builder.achievements as string[];
    const awards = (result.builder.extendedSections as { awards: string[] }).awards;
    expect(achievements).toContain('Shipped product X');
    expect(achievements).not.toContain('Employee of the Year');
    expect(awards).toContain('Employee of the Year');
  });

  it('preserves language proficiency through canonical mapping', () => {
    const result = runCanonicalBuilderMapping({
      importProfile: {
        languages: [{ language: 'French', proficiency: 'Native' }],
      },
      builderDraft: { languages: [] },
    });
    const langs = result.builder.languages as Array<{ language: string; proficiency: string }>;
    expect(langs[0]?.language).toBe('French');
    expect(langs[0]?.proficiency).toBe('Native');
  });
});
