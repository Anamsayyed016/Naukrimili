import {
  collapseDecorativeSpacedHeadings,
  recoverStructuredExperienceFromRawText,
  recoverCompetencyBulletsFromRawText,
  recoverExperienceBodiesFromRawText,
  isPlausiblePersonName,
} from '@/lib/resume-parser/import-sanitize';

const EXECUTIVE_SPACED_HEADING_RAW = [
  'An enthusiastic professional for senior level assignments.',
  '',
  'P',
  'R O F I L E',
  'S',
  'U M M A R Y',
  '',
  'A focused professional with over 18+ years of experience in corporate governance.',
  '',
  'O',
  'R G A N I S A T I O N A L',
  'E',
  'X P E R I E N C E',
  '',
  'Dec 2002 – Jul 2004 with Apex Chemicals Limited, Metro as Company Secretary',
  'Sep 2004 – Mar 2015 with Horizon Packaging Limited, Metro as Company Secretary and Legal officer',
  'Mar 2015 – Mar 2022 with Beacon Industries Limited, Metro as Company Secretary & Legal',
  'Apr 2022 – July 2024 with Summit Group of Industries, Metro as Head- Company Secretary & Legal',
  'August, 2024 onwards working on retainer basis handling Secretarial and legal activities of listed group and Startups',
  'ALEX RIVERA',
  'E-Mail: alex.rivera@example.com',
  'Metro Chapter of ICSI',
  '',
  'Languages Known: English & Hindi',
  '',
  'A',
  'C A D E M I C',
  'D',
  'E TA I L S',
  '',
  'C',
  'E R T I F I C A T I O N',
  '',
  'KEY RESULT AREAS',
  '',
  'CORPORATE LAW/FEMA AND CORPORATE GOVERNANCE COMPLIANCES',
  '',
  'Corporate Law Compliances with respect to conducting the Board Meetings, Committee meetings',
  'and Shareholders Meetings. Prepared and maintained minutes of meetings of the board of directors.',
  'Ensure that the company activities comply with legal and regulatory frameworks, mitigating any risk',
  'of non-compliance or penalties. Ensuring timely and accurate filing of statutory returns.',
].join('\n');

describe('executive spaced-heading resume recovery', () => {
  it('collapses decorative vertical/spaced section headings', () => {
    const collapsed = collapseDecorativeSpacedHeadings(EXECUTIVE_SPACED_HEADING_RAW);
    expect(collapsed).toMatch(/PROFILE\s+SUMMARY/i);
    expect(collapsed).toMatch(/ORGANISATIONAL\s+EXPERIENCE/i);
  });

  it('recovers dated with-as employment lines without cross-job merges', () => {
    const rows = recoverStructuredExperienceFromRawText(EXECUTIVE_SPACED_HEADING_RAW);
    expect(rows.length).toBeGreaterThanOrEqual(4);
    expect(rows.some((r) => /apex chemicals/i.test(String(r.company || '')))).toBe(true);
    expect(rows.some((r) => /horizon packaging/i.test(String(r.company || '')))).toBe(true);
    expect(
      rows.every((r) => !/sep 2004|mar 2015 with horizon/i.test(String(r.title || '')))
    ).toBe(true);
  });

  it('recovers KEY RESULT AREAS duty bullets onto the current role', () => {
    const entries = recoverStructuredExperienceFromRawText(EXECUTIVE_SPACED_HEADING_RAW);
    const enriched = recoverExperienceBodiesFromRawText(EXECUTIVE_SPACED_HEADING_RAW, entries);
    const current = enriched.find((e) => e.current === true) || enriched[enriched.length - 1];
    expect(String(current?.description || '').length).toBeGreaterThan(80);
    expect(String(current?.description || '').toLowerCase()).toMatch(
      /board meetings|shareholders|compliance/
    );
  });

  it('does not treat professional chapter memberships as person names', () => {
    expect(isPlausiblePersonName('Metro Chapter of ICSI')).toBe(false);
    expect(isPlausiblePersonName('Alex Rivera')).toBe(true);
  });

  it('extracts competency bullets from KEY RESULT AREAS', () => {
    const bullets = recoverCompetencyBulletsFromRawText(EXECUTIVE_SPACED_HEADING_RAW);
    expect(bullets.length).toBeGreaterThanOrEqual(2);
  });
});
