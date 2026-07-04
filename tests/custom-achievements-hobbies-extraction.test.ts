import { extractAchievementsFromSection } from '@/lib/resume-parser/custom/achievements-extraction';
import { parseAchievementLine } from '@/lib/resume-parser/custom/achievements-extraction/parse';
import { extractHobbiesFromSection } from '@/lib/resume-parser/custom/hobbies-extraction';
import { parseHobbyLine } from '@/lib/resume-parser/custom/hobbies-extraction/parse';
import { runCustomParserPipeline } from '@/lib/resume-parser/custom/reliability/pipeline';

describe('achievements extraction', () => {
  it('parses bullet achievements and rejects MBA lines', () => {
    const section = [
      'ACHIEVEMENTS',
      'Won Best Employee Award 2023',
      'Increased revenue by 25% through process optimization',
      'Master of Business Administration (MBA)',
    ].join('\n');
    const items = extractAchievementsFromSection(section);
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items.map((a) => a.text.toLowerCase())).not.toContain(
      expect.stringMatching(/master of business/)
    );
    expect(parseAchievementLine('Led team at Infosys for billing platform')).toBeNull();
  });
});

describe('hobbies extraction', () => {
  it('parses comma-separated hobbies and rejects technical skills', () => {
    const section = ['HOBBIES', 'Reading, Travel, Photography, Cricket'].join('\n');
    const items = extractHobbiesFromSection(section);
    expect(items.map((h) => h.name.toLowerCase())).toEqual(
      expect.arrayContaining(['reading', 'travel', 'photography', 'cricket'])
    );
    expect(parseHobbyLine('Python, Java, React').length).toBe(0);
  });
});

describe('pipeline achievements and hobbies wiring', () => {
  it('populates global achievements and hobbies from detected sections', () => {
    const text = [
      'Jane Doe',
      'jane@example.com',
      '',
      'ACHIEVEMENTS',
      'Employee of the Year 2022',
      'Published research in IEEE conference',
      '',
      'HOBBIES',
      'Reading, Chess, Travel',
      '',
      'EXPERIENCE',
      'Analyst | Acme Corp',
      '2020 - Present',
    ].join('\n');

    const result = runCustomParserPipeline(text);
    expect(result.validation.resume.achievements?.length).toBeGreaterThanOrEqual(2);
    expect(result.validation.resume.hobbies?.length).toBeGreaterThanOrEqual(3);
    expect(result.validation.resume.experience?.[0]?.company).toMatch(/acme/i);
    expect(result.validation.resume.experience?.[0]?.position).toMatch(/analyst/i);
  });
});
