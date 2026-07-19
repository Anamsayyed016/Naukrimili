/**
 * Dynamic resume section detection engine (custom parser only).
 *
 * Input: plain resume text.
 * Output: isolated section bodies + metadata — no field parsing.
 */

import { prepareResumeTextForParsing } from '@/lib/resume-parser/resume-document-analysis';
import { analyzeResumeDocument } from '@/lib/resume-parser/dynamic-document-analysis';
import { deriveAdaptiveParseStrategy } from '@/lib/resume-parser/adaptive-parse-strategy';

import { buildLineIndex, lineContentDensity, sliceTextByLines } from './line-index';
import {
  buildCoverageReport,
  dedupeContentLines,
  harvestEmploymentFromCustomSections,
  inferSectionsFromContent,
  reclassifyEmploymentShapedSections,
  repairGapsIntoPreamble,
  toCustomSectionBlock,
} from './partition';
import { rescoreWithContent, scoreHeadingCandidate } from './score-heading';
import { scoreHeadingKeywords } from './taxonomy';
import {
  SECTION_DETECTION_VERSION,
  type DetectedResumeSections,
  type DetectedSectionBlock,
  type HeadingCandidate,
  type LineSpan,
  type NormalizedSectionType,
} from './types';

const MIN_SECONDARY_SECTION_SCORE = 42;

const KNOWN_FIELD_KEYS: Array<Exclude<NormalizedSectionType, 'custom'>> = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'languages',
  'certifications',
  'achievements',
  'hobbies',
  'references',
  'volunteer',
  'publications',
];

function emptySectionMap(): Record<Exclude<NormalizedSectionType, 'custom'>, string> {
  return {
    summary: '',
    experience: '',
    education: '',
    skills: '',
    projects: '',
    languages: '',
    certifications: '',
    achievements: '',
    hobbies: '',
    references: '',
    volunteer: '',
    publications: '',
  };
}

function detectHeadingCandidates(
  lines: LineSpan[],
  profile: ReturnType<typeof prepareResumeTextForParsing>['profile']
): HeadingCandidate[] {
  const candidates: HeadingCandidate[] = [];

  for (let i = 0; i < lines.length; i++) {
    const previewEnd = Math.min(lines.length, i + 12);
    const density = lineContentDensity(lines, i + 1, previewEnd);
    const candidate = scoreHeadingCandidate(i, lines, profile, density);
    if (candidate) candidates.push(candidate);
  }

  return resolveHeadingCollisions(candidates);
}

function resolveHeadingCollisions(candidates: HeadingCandidate[]): HeadingCandidate[] {
  const byLine = new Map<number, HeadingCandidate>();
  for (const c of candidates) {
    const prev = byLine.get(c.lineIndex);
    if (!prev || c.confidence > prev.confidence) byLine.set(c.lineIndex, c);
  }
  const sorted = [...byLine.values()].sort((a, b) => a.lineIndex - b.lineIndex);

  const filtered: HeadingCandidate[] = [];
  for (const c of sorted) {
    const last = filtered[filtered.length - 1];
    if (last && c.lineIndex - last.lineIndex <= 1 && c.confidence <= last.confidence + 5) {
      continue;
    }
    filtered.push(c);
  }
  return filtered;
}

function buildSectionBlocks(
  text: string,
  lines: LineSpan[],
  headings: HeadingCandidate[]
): { preamble: string; preambleEndLine: number; sections: DetectedSectionBlock[] } {
  if (headings.length === 0) {
    return { preamble: text.trim(), preambleEndLine: lines.length, sections: [] };
  }

  const firstHeadingLine = headings[0].lineIndex;
  const preamble = sliceTextByLines(lines, 0, firstHeadingLine, text);
  const sections: DetectedSectionBlock[] = [];

  for (let h = 0; h < headings.length; h++) {
    const heading = headings[h];
    const contentStart = heading.lineIndex + 1;
    const contentEnd =
      h + 1 < headings.length ? headings[h + 1].lineIndex : lines.length;

    const density = lineContentDensity(lines, contentStart, contentEnd);
    const refined = rescoreWithContent(heading, density);

    const content = dedupeContentLines(sliceTextByLines(lines, contentStart, contentEnd, text));
    const startIndex = lines[heading.lineIndex].start;
    const endIndex = contentEnd > contentStart ? lines[contentEnd - 1].end : lines[heading.lineIndex].end;

    sections.push({
      type: refined.type,
      confidence: refined.confidence,
      startIndex,
      endIndex,
      lineStart: heading.lineIndex,
      lineEnd: contentEnd - 1,
      rawHeading: refined.rawHeading,
      content,
      scores: refined.scores,
    });
  }

  return { preamble, preambleEndLine: firstHeadingLine, sections };
}

function mergeSectionsIntoFields(sections: DetectedSectionBlock[]) {
  const fields = emptySectionMap();
  const customSections = sections.filter((s) => s.type === 'custom').map(toCustomSectionBlock);

  for (const section of sections) {
    if (section.type === 'custom') continue;
    const key = section.type;
    fields[key] = fields[key] ? `${fields[key]}\n\n${section.content}`.trim() : section.content;

    // Combined headings ("Certifications & Languages") — mirror body into every
    // strongly matched section type so secondary extractors still see the text.
    const typeScores = scoreHeadingKeywords(section.rawHeading);
    const headingLower = section.rawHeading.toLowerCase();
    // Role / responsibilities headings are experience subsections — never projects.
    const isRolesHeading =
      /\broles?\b/i.test(headingLower) && /\bresponsibilit/i.test(headingLower);
    const isExperienceSummary =
      /\bexperience\s+summary\b|\bsummary\s+of\s+experience\b/i.test(headingLower);

    for (const [type, score] of Object.entries(typeScores) as Array<
      [NormalizedSectionType, number]
    >) {
      if (type === key || type === 'custom') continue;
      if ((score ?? 0) < MIN_SECONDARY_SECTION_SCORE) continue;
      if (!(type in fields)) continue;
      if (type === 'projects' && (isRolesHeading || isExperienceSummary || key === 'experience')) {
        continue;
      }
      if (type === 'summary' && isExperienceSummary) continue;
      // Educational qualification blocks should not flood certifications.
      if (
        type === 'certifications' &&
        key === 'education' &&
        /\beducational?\b|\bqualification/i.test(headingLower)
      ) {
        continue;
      }
      const typed = type as Exclude<NormalizedSectionType, 'custom'>;
      fields[typed] = fields[typed]
        ? `${fields[typed]}\n\n${section.content}`.trim()
        : section.content;
    }
  }

  return { fields, customSections };
}

/**
 * Detect resume sections from plain text using hybrid scoring.
 * Does not parse fields or touch ExtractedResumeData.
 */
export function detectResumeSections(resumeText: string): DetectedResumeSections {
  const { text, profile } = prepareResumeTextForParsing(resumeText ?? '');
  const documentAnalysis = analyzeResumeDocument(text);
  const parseStrategy = deriveAdaptiveParseStrategy(documentAnalysis);
  const lines = buildLineIndex(text);

  if (text.trim().length < 20 || lines.length === 0) {
    return {
      detectionVersion: SECTION_DETECTION_VERSION,
      normalizedText: text,
      documentProfile: profile,
      documentAnalysis,
      parseStrategy,
      preamble: text.trim(),
      ...emptySectionMap(),
      customSections: [],
      sections: [],
      coverage: {
        complete: true,
        assignedChars: text.length,
        totalChars: text.length,
        gaps: [],
        overlaps: [],
      },
    };
  }

  const headingCandidates = detectHeadingCandidates(lines, profile);
  let { preamble, preambleEndLine, sections } = buildSectionBlocks(text, lines, headingCandidates);

  const preambleStart = 0;
  const preambleEnd = preambleEndLine > 0 ? lines[preambleEndLine - 1]?.end ?? 0 : 0;
  let coverage = buildCoverageReport(text, lines, sections, {
    start: preambleStart,
    end: preambleEnd,
  });

  if (!coverage.complete) {
    const repaired = repairGapsIntoPreamble(text, lines, preambleEndLine, sections, coverage, {
      gapRepairMode: parseStrategy.gapRepairMode,
    });
    preamble = repaired.preamble;
    sections = repaired.sections;
    coverage = buildCoverageReport(text, lines, sections, {
      start: preambleStart,
      end: preambleEnd,
    });
  }

  sections = reclassifyEmploymentShapedSections(sections);
  const { fields: mergedFields, customSections } = mergeSectionsIntoFields(sections);
  const withHarvest = harvestEmploymentFromCustomSections(mergedFields, customSections);
  const fields = inferSectionsFromContent(text, withHarvest);

  return {
    detectionVersion: SECTION_DETECTION_VERSION,
    normalizedText: text,
    documentProfile: profile,
    documentAnalysis,
    parseStrategy,
    preamble,
    ...fields,
    customSections,
    sections,
    coverage,
  };
}
