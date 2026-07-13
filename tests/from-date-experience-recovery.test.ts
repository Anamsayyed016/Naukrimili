import {
  recoverStructuredExperienceFromRawText,
  recoverExecutiveProfileSummaryFromRawText,
  recoverLanguagesFromPersonalDetails,
} from '@/lib/resume-parser/import-sanitize';

const FROM_DATE_EXPERIENCE_TEXT = `VINOD K SHARMA (CS & LLB)
An accomplished and results-driven Company Secretary & Compliance Officer with over 13.5 years of
extensive experience in both Public and Private Sector organizations, specializing in Secretarial
Compliance, Listing Compliances, Legal Affairs, and Corporate Governance.

From February, 2025 working with Example Cables Pvt Ltd (Under IPO Process)
[Product: Manufacturer of Aluminium Rode]

Job Profile
Led end-to-end IPO readiness activities including corporate restructuring and governance alignment.
Managed SEBI and Stock Exchange filings, including submission of DRHP.

From October, 2023 to August, 2024 worked with Example Industries Limited, (Listed on NSE & BSE) As Company Secretary & Compliance Officer
[Product: Automotive Components]

Job Profile
Executed capital market transactions for listed entities, including Preferential Allotment.
Ensured end-to-end compliance with SEBI (LODR) Regulations.

From Feb' 2017 to Sep' 2023 worked with Example Manufacturing Mills Limited As Company Secretary & Compliance officer
Job Profile
Advising Board of Directors and Management on various Strategic Decisions.

Jun'13– Sept'14 Example Engineering Systems Limited, [Listed on BSE & NSE] As Trainee (Secretarial Department)
Job Profile
Compliance with Companies Act and allied Acts.`;

describe('from-date experience recovery', () => {
  it('recovers executive profile summary paragraph', () => {
    const summary = recoverExecutiveProfileSummaryFromRawText(FROM_DATE_EXPERIENCE_TEXT);
    expect(summary.toLowerCase()).toMatch(/accomplished/);
    expect(summary.toLowerCase()).toMatch(/13\.5 years/);
  });

  it('recovers From DATE working with / worked with experience lines', () => {
    const rows = recoverStructuredExperienceFromRawText(FROM_DATE_EXPERIENCE_TEXT);
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(rows.some((e) => String(e.company || '').toLowerCase().includes('example cables'))).toBe(
      true
    );
    expect(rows.some((e) => String(e.company || '').toLowerCase().includes('example industries'))).toBe(
      true
    );
    expect(
      rows.some(
        (e) =>
          e.current === true ||
          String(e.endDate || '')
            .toLowerCase()
            .includes('present')
      )
    ).toBe(true);
  });

  it('recovers languages from colon format', () => {
    const langs = recoverLanguagesFromPersonalDetails('Languages : English & Hindi Address : Jaipur');
    expect(langs.map((l) => l.toLowerCase())).toEqual(expect.arrayContaining(['english', 'hindi']));
  });
});
