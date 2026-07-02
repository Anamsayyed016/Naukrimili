import {
  extractIdentityFromSections,
  extractIdentityWithMeta,
  toCanonicalIdentity,
  normalizePhoneNumber,
  scoreNameCandidate,
} from '@/lib/resume-parser/custom/identity-extraction';

describe('custom identity extraction engine', () => {
  it('ATS header — name, title, email, phone, linkedin', () => {
    const header = [
      'Anam Sayyed',
      'Full Stack Developer',
      'anam@example.com | +91 98765 43210',
      'linkedin.com/in/anamsayyed',
      'Bhopal, Madhya Pradesh, India',
    ].join('\n');

    const identity = extractIdentityFromSections({ headerText: header });
    expect(identity.fullName).toMatch(/Anam Sayyed/i);
    expect(identity.professionalHeadline).toMatch(/Full Stack Developer/i);
    expect(identity.email).toBe('anam@example.com');
    expect(identity.phone).toMatch(/98765|43210/);
    expect(identity.linkedin).toMatch(/linkedin\.com/i);
    expect(identity.city || identity.state || identity.country).toBeTruthy();
    expect(identity.confidence).toBeGreaterThan(30);

    const canonical = toCanonicalIdentity(identity);
    expect(canonical.fullName).toMatch(/Anam/i);
    expect(canonical.email).toBe('anam@example.com');
  });

  it('two-column style contact block', () => {
    const contact = [
      'CONTACT',
      'john.doe@work.com',
      '+1 (415) 555-0199',
      'github.com/johndoe',
      'https://johndoe.dev',
    ].join('\n');
    const header = ['John Doe', 'Senior Python Developer'].join('\n');

    const identity = extractIdentityFromSections({
      headerText: header,
      contactSectionText: contact,
    });
    expect(identity.fullName).toMatch(/John Doe/i);
    expect(identity.email).toBe('john.doe@work.com');
    expect(identity.github).toMatch(/github\.com/i);
    expect(identity.portfolio || identity.website).toMatch(/johndoe\.dev/i);
  });

  it('creative resume — name not assumed first line', () => {
    const preamble = [
      'Portfolio 2025',
      '',
      'Jane Smith',
      'UI/UX Designer',
      'jane@design.io',
    ].join('\n');

    const identity = extractIdentityFromSections({ preambleText: preamble });
    expect(identity.fullName).toMatch(/Jane Smith/i);
    expect(identity.professionalHeadline).toMatch(/UI\/UX Designer/i);
    expect(identity.email).toBe('jane@design.io');
  });

  it('international phone and alternate email', () => {
    const text = [
      'Mohammad Arif Khan',
      'm.arif@company.co.uk | arif.personal@gmail.com',
      '+44 20 7946 0958 | +91 9876543210',
    ].join('\n');

    const identity = extractIdentityFromSections({ headerText: text });
    expect(identity.fullName).toMatch(/Mohammad|Arif|Khan/i);
    expect(identity.email).toBeTruthy();
    expect(identity.phone).toBeTruthy();
  });

  it('rejects company name as person name', () => {
    expect(scoreNameCandidate('Infosys Technologies Ltd', 80)).toBe(0);
    expect(scoreNameCandidate('Technoart Pvt Ltd', 80)).toBe(0);
  });

  it('academic CV metadata', () => {
    const text = [
      'Dr. Priya Sharma',
      'Research Scientist',
      'Nationality: Indian',
      'Date of Birth: 12 March 1990',
      'priya.sharma@university.ac.in',
    ].join('\n');

    const identity = extractIdentityFromSections({ headerText: text });
    expect(identity.fullName).toMatch(/Priya Sharma/i);
    expect(identity.nationality).toMatch(/Indian/i);
    expect(identity.dateOfBirth).toMatch(/1990/i);
  });

  it('phone normalization', () => {
    expect(normalizePhoneNumber('+919876543210')).toMatch(/\+91/);
    expect(normalizePhoneNumber('9876543210')).toMatch(/\(\d{3}\)/);
  });

  it('returns empty shell for blank input', () => {
    const { identity, hasIdentity } = extractIdentityWithMeta({});
    expect(hasIdentity).toBe(false);
    expect(identity.fullName).toBe('');
  });
});
