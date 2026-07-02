/**
 * Reliability fixture catalog — categorized test resumes (text-based).
 */

import { BENCHMARK_FIXTURES } from '../../benchmark/fixtures/registry';
import type { ReliabilityFixture } from '../types';

const UNICODE_RESUME = [
  'José García-Müller',
  'jose.garcia@example.com | München, Germany',
  '',
  'SUMMARY',
  'Ingénieur logiciel avec expérience en développement web — 日本語のプロジェクト経験あり。',
  '',
  'SKILLS',
  'Python, JavaScript, Docker, Kubernetes',
].join('\n');

const RTL_MIXED_RESUME = [
  'Ahmed Al-Rashid',
  'ahmed@example.com | Dubai, UAE',
  '',
  'SUMMARY',
  'Bilingual professional — English / العربية project delivery experience.',
  '',
  'EXPERIENCE',
  'Consultant | Gulf Tech LLC',
  '2019 - Present',
].join('\n');

const TWO_COLUMN_SIMULATED = [
  'Priya Nair                    | SKILLS',
  'priya@example.com             | Java, Spring, AWS',
  'Bangalore, India              |',
  '                              | EXPERIENCE',
  'SUMMARY                       | Developer | Infosys',
  'Backend engineer              | 2021 - Present',
].join('\n');

const TABLE_RESUME = [
  'Skills Table',
  '| Skill      | Level    |',
  '| Python     | Expert   |',
  '| SQL        | Advanced |',
  '',
  'EXPERIENCE',
  'Data Analyst | Gov Agency',
  '2020 - 2023',
].join('\n');

const DUPLICATE_SECTIONS = [
  'Alex Kim',
  'alex@example.com',
  '',
  'SKILLS',
  'Python, SQL',
  '',
  'SKILLS',
  'Python, Java',
  '',
  'EXPERIENCE',
  'Analyst | Corp',
  '2022 - Present',
].join('\n');

const EMPTY_SECTIONS = [
  'Minimal User',
  'minimal@example.com',
  '',
  'SUMMARY',
  '',
  'SKILLS',
  '',
].join('\n');

const MISSING_SECTIONS = ['Chris Lee', 'chris@example.com', 'Open to opportunities.'].join('\n');

const LOW_QUALITY_OCR = [
  'J0hn D0e',
  'john . doe @ gm ai1 . c0m',
  'SUMMARY',
  'S0ftware eng1neer w1th 5+ years expenence',
  'EXPERlENCE',
  'Dev | Acme C0rp',
  '2O2O - Present',
].join('\n');

const MULTI_PAGE = Array.from({ length: 40 }, (_, i) =>
  [
    `Section Block ${i + 1}`,
    `Line content for page simulation ${i + 1}`,
    'EXPERIENCE',
    `Role ${i} | Company ${i}`,
    '2020 - 2021',
  ].join('\n')
).join('\n\n');

const VERY_LARGE = Array.from({ length: 200 }, (_, i) =>
  `Experience line ${i}: contributed to enterprise platform module ${i}`
).join('\n');

const HEALTHCARE = [
  'Dr. Sarah Mitchell',
  'sarah.mitchell@hospital.org | +1 555-0100',
  '',
  'SUMMARY',
  'Board-certified physician with 10 years clinical and research experience.',
  '',
  'EXPERIENCE',
  'Attending Physician | City General Hospital',
  '2015 - Present',
  '',
  'EDUCATION',
  'MD | Johns Hopkins University',
  '2008 - 2012',
].join('\n');

const GOVERNMENT = [
  'Rajesh Kumar',
  'rajesh.kumar@gov.in | New Delhi',
  '',
  'EXPERIENCE',
  'Administrative Officer | Ministry of Finance',
  '2010 - Present',
  '- Policy analysis and public sector reporting',
].join('\n');

const EXECUTIVE = [
  'Victoria Sterling',
  'v.sterling@executive.com',
  '',
  'SUMMARY',
  'C-suite executive with 20+ years leading global operations and M&A.',
  '',
  'EXPERIENCE',
  'Chief Operating Officer | Global Holdings Inc',
  '2015 - Present',
  '- P&L ownership $500M+',
].join('\n');

const CREATIVE = [
  'Maya Chen — Creative Director',
  'maya@studio.com | portfolio.maya.design',
  '',
  'SUMMARY',
  '★ Award-winning designer specializing in brand systems & digital experiences ★',
  '',
  'PROJECTS',
  'Brand Refresh — Fortune 500 Client',
  'Led visual identity redesign',
].join('\n');

function fromBenchmark(): ReliabilityFixture[] {
  return BENCHMARK_FIXTURES.map((b) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    categories: b.tags.map((t) => {
      if (t === 'single_column') return 'one_column';
      if (t === 'developer') return 'it';
      if (t === 'scanned_ocr') return 'ocr_scanned';
      if (t === 'multi_page') return 'multi_page';
      return t;
    }) as ReliabilityFixture['categories'],
    format: b.format,
    rawText: b.rawText || '',
    groundTruth: b.groundTruth,
    validationExpectation: b.validationExpectation,
    skillExpectations: b.skillExpectations,
    modules: ['identity', 'summary', 'experience', 'education', 'skills', 'projects', 'validation', 'canonical'],
  }));
}

export const RELIABILITY_FIXTURE_CATALOG: ReliabilityFixture[] = [
  ...fromBenchmark(),
  {
    id: 'unicode-multilingual',
    name: 'Unicode & Multilingual Resume',
    categories: ['unicode', 'multiple_languages', 'international'],
    compatibilityProfiles: ['unicode_text'],
    rawText: UNICODE_RESUME,
    modules: ['identity', 'summary', 'skills', 'validation', 'canonical'],
  },
  {
    id: 'rtl-bilingual',
    name: 'RTL-safe Bilingual Resume',
    categories: ['international', 'unicode', 'multiple_languages'],
    compatibilityProfiles: ['rtl_safe', 'unicode_text'],
    rawText: RTL_MIXED_RESUME,
    modules: ['identity', 'summary', 'experience', 'validation', 'canonical'],
  },
  {
    id: 'two-column-simulated',
    name: 'Two-column Layout (text simulation)',
    categories: ['two_column', 'mixed_formatting'],
    rawText: TWO_COLUMN_SIMULATED,
    modules: ['identity', 'skills', 'experience', 'validation', 'canonical'],
  },
  {
    id: 'three-column-simulated',
    name: 'Three-column Layout (text simulation)',
    categories: ['three_column', 'mixed_formatting'],
    rawText: TWO_COLUMN_SIMULATED + '\n' + '| Col A | Col B | Col C |',
    modules: ['identity', 'validation', 'canonical'],
  },
  {
    id: 'table-format',
    name: 'Table-formatted Skills',
    categories: ['tables', 'government', 'ats'],
    compatibilityProfiles: ['microsoft_word_docx'],
    format: 'docx',
    rawText: TABLE_RESUME,
    modules: ['skills', 'experience', 'validation', 'canonical'],
  },
  {
    id: 'duplicate-sections',
    name: 'Duplicate Skills Sections',
    categories: ['duplicate_sections', 'ats'],
    rawText: DUPLICATE_SECTIONS,
    modules: ['skills', 'validation', 'canonical'],
  },
  {
    id: 'empty-sections',
    name: 'Empty Sections',
    categories: ['empty_sections', 'fresher'],
    rawText: EMPTY_SECTIONS,
    modules: ['identity', 'summary', 'skills', 'validation', 'canonical'],
  },
  {
    id: 'missing-sections',
    name: 'Missing Major Sections',
    categories: ['missing_sections', 'fresher'],
    rawText: MISSING_SECTIONS,
    modules: ['identity', 'validation', 'canonical'],
  },
  {
    id: 'low-quality-ocr',
    name: 'Low-quality OCR Text',
    categories: ['low_quality_ocr', 'ocr_scanned'],
    compatibilityProfiles: ['ocr_pdf', 'scanned_image'],
    format: 'pdf',
    rawText: LOW_QUALITY_OCR,
    modules: ['identity', 'summary', 'experience', 'validation', 'canonical'],
  },
  {
    id: 'multi-page',
    name: 'Multi-page Resume',
    categories: ['multi_page', 'experienced'],
    format: 'pdf',
    compatibilityProfiles: ['windows_pdf', 'mac_pdf'],
    rawText: MULTI_PAGE,
    modules: ['experience', 'validation', 'canonical'],
  },
  {
    id: 'very-large',
    name: 'Very Large Resume',
    categories: ['very_large', 'experienced'],
    rawText: VERY_LARGE,
    modules: ['validation', 'canonical'],
  },
  {
    id: 'healthcare-cv',
    name: 'Healthcare CV',
    categories: ['healthcare', 'academic', 'experienced'],
    rawText: HEALTHCARE,
    modules: ['identity', 'summary', 'experience', 'education', 'validation', 'canonical'],
  },
  {
    id: 'government-resume',
    name: 'Government Resume',
    categories: ['government', 'ats'],
    rawText: GOVERNMENT,
    modules: ['identity', 'experience', 'validation', 'canonical'],
  },
  {
    id: 'executive-cv',
    name: 'Executive CV',
    categories: ['executive', 'mba', 'experienced'],
    rawText: EXECUTIVE,
    modules: ['identity', 'summary', 'experience', 'validation', 'canonical'],
  },
  {
    id: 'creative-resume',
    name: 'Creative Resume',
    categories: ['creative', 'icons', 'mixed_formatting'],
    compatibilityProfiles: ['google_docs_docx'],
    format: 'docx',
    rawText: CREATIVE,
    modules: ['identity', 'summary', 'projects', 'validation', 'canonical'],
  },
  {
    id: 'libreoffice-docx-sim',
    name: 'LibreOffice DOCX (text export simulation)',
    categories: ['docx', 'ats'],
    compatibilityProfiles: ['libreoffice_docx'],
    format: 'docx',
    rawText: fromBenchmark()[0]?.rawText || '',
    groundTruth: fromBenchmark()[0]?.groundTruth,
    modules: ['identity', 'experience', 'skills', 'validation', 'canonical'],
  },
];

export function getReliabilityFixture(id: string): ReliabilityFixture | undefined {
  return RELIABILITY_FIXTURE_CATALOG.find((f) => f.id === id);
}

export function listReliabilityFixtures(
  categories?: ReliabilityTestCategory[]
): ReliabilityFixture[] {
  if (!categories?.length) return [...RELIABILITY_FIXTURE_CATALOG];
  return RELIABILITY_FIXTURE_CATALOG.filter((f) =>
    categories.some((c) => f.categories.includes(c))
  );
}
