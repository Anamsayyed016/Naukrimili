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

  it('recovers global Work Exposure duties onto the current role when job bodies are empty', () => {
    const raw = [
      'ALEX RIVERA',
      'COMPANY SECRETARY',
      '',
      'PRACTICAL EXPERIENCE:',
      'Head Company Secretary-Acme Iron & Steel Co. Ltd, (August. 2021 to Cont.....),',
      'Company Secretary with Northwind Trimex Ltd. (Jan. 2018 to May. 2021)',
      '',
      'TECHNICAL SKILL:',
      'Well versed with MS office, MS excel and Internet.',
      '',
      'Work Exposure:',
      'Secretarial Compliances:',
      'Routine Secretarial Work viz drafting of Notice, Agenda, Directors Report,',
      'Board Committee Resolution and Minutes thereof, Compliance of SEBI LODR Regulations.',
      'Annual Return Finalizing thereof as required by the Company registered under Companies Act,',
      'timely submission of reports and disclosures to the Stock Exchanges online.',
      'Compliance under FEMA: Filing of FC-GPR, FC-TRS, Annual Return on Foreign Liabilities',
      'and Assets with Reserve Bank of India and other related RBI compliances.',
      '',
      'PERSONAL DETAILS',
      'Languages known: English, Hindi',
    ].join('\n');

    const entries = [
      {
        company: 'Acme Iron & Steel Co. Ltd',
        title: 'Head Company Secretary',
        startDate: '2021-08',
        endDate: 'Present',
        current: true,
        description: '',
      },
      {
        company: 'Northwind Trimex Ltd',
        title: 'Company Secretary',
        startDate: '2018-01',
        endDate: '2021-05',
        description: '',
      },
    ];

    const enriched = recoverExperienceBodiesFromRawText(raw, entries);
    const currentBody = String(enriched[0].description || '');
    expect(currentBody.length).toBeGreaterThan(80);
    expect(currentBody.toLowerCase()).toMatch(/secretarial|sebi|fema|companies act/);
    expect(String(enriched[1].description || '').length).toBe(0);
  });
});
