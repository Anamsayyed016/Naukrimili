import {
  recoverExperienceBodiesFromRawText,
  recoverStructuredExperienceFromRawText,
} from '@/lib/resume-parser/import-sanitize';
import { extractDescriptionFromBlock } from '@/lib/resume-parser/custom/experience-extraction/description';

const EXECUTIVE_CS_RAW = [
  'RAJ KUMAR BHAWSAR',
  'Company Secretary',
  'raj@example.com',
  '',
  'ORGANISATIONAL EXPERIENCE',
  '',
  'Company Secretary',
  'Sterling Industries Limited',
  'Jan 2020 - Present',
  'Key Result Areas',
  '- Ensured compliance with Companies Act and SEBI regulations across subsidiaries.',
  '- Coordinated board meetings and maintained statutory registers.',
  '',
  'Company Secretary',
  'National Power Corporation Ltd',
  'Mar 2015 - Dec 2019',
  'Key Responsibilities',
  '- Filed annual returns and managed shareholder communication.',
  '- Advised management on corporate governance matters.',
  '',
  'EDUCATION',
  'LLB — Law College',
].join('\n');

describe('experience body recovery', () => {
  it('recovers bullets for title-company-date executive layout', () => {
    const entries = [
      {
        company: 'Sterling Industries Limited',
        title: 'Company Secretary',
        startDate: '2020-01',
        endDate: 'Present',
      },
      {
        company: 'National Power Corporation Ltd',
        title: 'Company Secretary',
        startDate: '2015-03',
        endDate: '2019-12',
      },
    ];

    const enriched = recoverExperienceBodiesFromRawText(EXECUTIVE_CS_RAW, entries);
    expect(enriched[0].achievements?.length || 0).toBeGreaterThanOrEqual(2);
    expect(enriched[1].achievements?.length || 0).toBeGreaterThanOrEqual(2);
  });

  it('parses year-with-at-as structured experience lines', () => {
    const blob = [
      'ORGANISATIONAL EXPERIENCE',
      '2015 - 2019 at Horizon Manufacturing Ltd as Company Secretary',
      '2012 - 2014 at Delta Holdings Pvt Ltd as Assistant Company Secretary',
    ].join(' ');
    const rows = recoverStructuredExperienceFromRawText(blob);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(String(rows[0].company || '')).toMatch(/Horizon/i);
  });

  it('skips subsection headings in description extraction', () => {
    const result = extractDescriptionFromBlock([
      'Key Result Areas',
      '- Maintained statutory compliance registers for the group.',
      '- Prepared board agendas and minutes.',
    ]);
    expect(result.bulletPoints.length).toBe(2);
    expect(result.description).not.toMatch(/Key Result Areas/i);
  });
});
