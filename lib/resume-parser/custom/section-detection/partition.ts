/**
 * Partition validation — full coverage, no overlaps, no duplicate lines.
 */

import { sliceTextByLines } from './line-index';
import type {
  CustomSectionBlock,
  DetectedSectionBlock,
  LineSpan,
  NormalizedSectionType,
  SectionCoverageReport,
} from './types';

export function assignLineOwnership(
  lines: LineSpan[],
  headings: Array<{ lineIndex: number; sectionIndex: number }>
): Int16Array {
  const owner = new Int16Array(lines.length).fill(-1);
  const sorted = [...headings].sort((a, b) => a.lineIndex - b.lineIndex);

  for (let h = 0; h < sorted.length; h++) {
    const startLine = sorted[h].lineIndex;
    const endLine = h + 1 < sorted.length ? sorted[h + 1].lineIndex : lines.length;
    for (let li = startLine; li < endLine; li++) {
      if (li === startLine) {
        owner[li] = -2;
        continue;
      }
      owner[li] = sorted[h].sectionIndex;
    }
  }

  for (let li = 0; li < lines.length; li++) {
    if (owner[li] !== -1) continue;
    const nextHeading = sorted.find((h) => h.lineIndex > li);
    if (!nextHeading) {
      owner[li] = -1;
      continue;
    }
    owner[li] = -1;
  }

  return owner;
}

export function buildCoverageReport(
  text: string,
  lines: LineSpan[],
  sections: DetectedSectionBlock[],
  preamble: { start: number; end: number }
): SectionCoverageReport {
  const totalChars = text.length;
  const assigned = new Uint8Array(totalChars);
  const mark = (start: number, end: number) => {
    for (let i = Math.max(0, start); i < Math.min(totalChars, end); i++) assigned[i] = 1;
  };

  if (preamble.end > preamble.start) mark(preamble.start, preamble.end);
  for (const s of sections) mark(s.startIndex, s.endIndex);

  const gaps: SectionCoverageReport['gaps'] = [];
  let gapStart = -1;
  for (let i = 0; i < totalChars; i++) {
    if (assigned[i] === 0 && text[i] !== '\n') {
      if (gapStart < 0) gapStart = i;
    } else if (gapStart >= 0) {
      gaps.push({ start: gapStart, end: i, text: text.slice(gapStart, i) });
      gapStart = -1;
    }
  }
  if (gapStart >= 0) gaps.push({ start: gapStart, end: totalChars, text: text.slice(gapStart) });

  const overlaps: SectionCoverageReport['overlaps'] = [];
  for (let a = 0; a < sections.length; a++) {
    for (let b = a + 1; b < sections.length; b++) {
      const start = Math.max(sections[a].startIndex, sections[b].startIndex);
      const end = Math.min(sections[a].endIndex, sections[b].endIndex);
      if (start < end) overlaps.push({ sectionA: a, sectionB: b, start, end });
    }
  }

  const assignedChars = assigned.reduce((n, v) => n + (v ? 1 : 0), 0);
  return {
    complete: gaps.length === 0 && overlaps.length === 0,
    assignedChars,
    totalChars,
    gaps,
    overlaps,
  };
}

export function repairGapsIntoPreamble(
  text: string,
  lines: LineSpan[],
  preambleEndLine: number,
  sections: DetectedSectionBlock[],
  coverage: SectionCoverageReport,
  options?: { gapRepairMode?: 'default' | 'preamble-first' | 'infer-section' }
): { preamble: string; sections: DetectedSectionBlock[] } {
  if (coverage.complete || coverage.gaps.length === 0) {
    return {
      preamble: sliceTextByLines(lines, 0, preambleEndLine, text),
      sections,
    };
  }

  const gapText = coverage.gaps.map((g) => g.text.trim()).filter(Boolean).join('\n');
  const preamble = [sliceTextByLines(lines, 0, preambleEndLine, text), gapText]
    .filter(Boolean)
    .join('\n')
    .trim();

  const gapMode = options?.gapRepairMode ?? 'default';
  const repaired = sections.map((s) => ({ ...s }));

  if (gapMode === 'preamble-first') {
    return { preamble, sections: repaired };
  }

  for (const gap of coverage.gaps) {
    const inside = repaired.findIndex((s) => gap.start >= s.startIndex && gap.end <= s.endIndex);
    if (inside >= 0) continue;

    if (gapMode === 'infer-section') {
      const inferred = inferSectionsFromContent(gap.text, {
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
      });
      const targetType = (
        ['skills', 'languages', 'certifications', 'projects', 'experience', 'education'] as const
      ).find((k) => inferred[k]?.trim());
      if (targetType) {
        const idx = repaired.findIndex((s) => s.type === targetType);
        if (idx >= 0) {
          repaired[idx] = {
            ...repaired[idx],
            content: `${repaired[idx].content}\n${gap.text}`.trim(),
            endIndex: Math.max(repaired[idx].endIndex, gap.end),
          };
          continue;
        }
      }
    }

    const before = repaired.filter((s) => s.endIndex <= gap.start);
    if (before.length > 0) {
      const target = before[before.length - 1];
      const idx = repaired.indexOf(target);
      const merged = `${target.content}\n${gap.text}`.trim();
      repaired[idx] = {
        ...target,
        content: merged,
        endIndex: Math.max(target.endIndex, gap.end),
      };
    }
  }

  return { preamble, sections: repaired };
}

/** Remove consecutive duplicate lines (sidebar bleed), not repeated lines across jobs/degrees. */
export function dedupeContentLines(content: string): string {
  const out: string[] = [];
  let prevKey = '';
  for (const line of content.split('\n')) {
    const key = line.trim().toLowerCase();
    if (!key) {
      if (out.length > 0 && out[out.length - 1] !== '') out.push('');
      prevKey = '';
      continue;
    }
    if (key === prevKey) continue;
    prevKey = key;
    out.push(line);
  }
  return out.join('\n').trim();
}

export function toCustomSectionBlock(section: DetectedSectionBlock): CustomSectionBlock {
  return {
    rawHeading: section.rawHeading,
    content: section.content,
    confidence: section.confidence,
    startIndex: section.startIndex,
    endIndex: section.endIndex,
  };
}

type SectionFieldMap = Record<Exclude<NormalizedSectionType, 'custom'>, string>;

/** Structural signals that a block is employment history, not projects/certs. */
export function looksLikeEmploymentShapedText(text: string): boolean {
  const t = String(text || '');
  if (t.trim().length < 40) return false;
  const hasRole = /^\s*(?:role|designation|position|title)\s*:/im.test(t);
  const hasResponsibility = /\b(?:key\s+)?responsibilit(?:y|ies)\s*:/i.test(t);
  const hasTeamSize = /\bteam\s*size\s*:/i.test(t);
  const hasDates =
    /\b(?:19|20)\d{2}\b/.test(t) &&
    /(?:present|current|till\s*date|to\s*date|[-–—]|to\s+)/i.test(t);
  const hasCompanySuffix =
    /\b(?:ltd|limited|pvt|private\s+limited|llc|inc|corp|corporation|gmbh|plc)\b\.?/i.test(t);
  // Parenthetical / pipe tenures common on ops / security / manufacturing CVs:
  // "Liaison Officer (03 Jun 2019 to 29/05/2023) | CTC: 5.4 lakh"
  const hasInlineTenure =
    /\((?:[^)\n]{0,40}\b(?:19|20)\d{2}[^)\n]{0,40}\b(?:to|[-–—]|till|until)\b[^)\n]{0,40})\)/i.test(
      t
    ) ||
    /\b(?:19|20)\d{2}\s*[-–—to]+\s*(?:(?:19|20)\d{2}|present|current|till\s*date)\b/i.test(t);
  const hasCompSignal =
    /\b(?:ctc|c\.t\.c|lakh|lac|p\.?a\.?|per\s+annum|salary|remuneration)\b/i.test(t);
  const employmentHeading =
    /\b(?:professional|work|employment)\s+experience\b|\bemployment\s+history\b/i.test(t);
  if (hasRole && (hasDates || hasCompanySuffix || hasResponsibility || hasTeamSize)) return true;
  if (hasTeamSize && hasResponsibility && (hasDates || hasCompanySuffix)) return true;
  if (hasCompanySuffix && hasDates && hasResponsibility) return true;
  // Employer-suffix + date range is enough even without Role:/Responsibilities: labels.
  if (hasCompanySuffix && hasDates && (hasInlineTenure || hasCompSignal || t.length >= 200)) {
    return true;
  }
  if (employmentHeading && hasDates && (hasCompanySuffix || hasInlineTenure) && t.length >= 120) {
    return true;
  }
  if (hasInlineTenure && hasCompSignal && hasDates && t.length >= 120) return true;
  return false;
}

/**
 * Reclassify project/certification sections whose bodies are clearly employment
 * history (Role:/Team Size:/Key Responsibility: patterns). Generic — no
 * resume-specific keywords.
 */
export function reclassifyEmploymentShapedSections(
  sections: DetectedSectionBlock[]
): DetectedSectionBlock[] {
  return sections.map((section) => {
    if (section.type !== 'projects' && section.type !== 'certifications') return section;
    if (!looksLikeEmploymentShapedText(section.content)) return section;
    return {
      ...section,
      type: 'experience' as NormalizedSectionType,
      confidence: Math.max(section.confidence, 55),
    };
  });
}

/**
 * Append employment-shaped custom blocks into the experience field so sidebar
 * / pre-heading employer entries are not dropped.
 */
export function harvestEmploymentFromCustomSections(
  fields: SectionFieldMap,
  customSections: CustomSectionBlock[]
): SectionFieldMap {
  const out = { ...fields };
  const extras: string[] = [];
  for (const custom of customSections) {
    const blob = [custom.rawHeading, custom.content].filter(Boolean).join('\n');
    if (!looksLikeEmploymentShapedText(blob) && !looksLikeEmploymentShapedText(custom.content)) {
      continue;
    }
    extras.push(blob.trim());
  }
  if (extras.length === 0) return out;
  const joined = extras.join('\n\n').trim();
  out.experience = out.experience ? `${joined}\n\n${out.experience}`.trim() : joined;
  return out;
}

/**
 * Infer section bodies from content patterns when headings are missing or non-standard.
 */
export function inferSectionsFromContent(text: string, fields: SectionFieldMap): SectionFieldMap {
  const out = { ...fields };
  const lines = text.replace(/\r\n/g, '\n').split('\n').map((l) => l.trim()).filter(Boolean);

  if (!out.skills) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const inline = line.match(
        /^(?:skills?|technical\s+skills|core\s+skills|it\s+skills|strengths?\s*(?:&|and)?\s*it\s+skills|competencies|expertise|specialt(?:y|ies)|core\s+specialt(?:y|ies)|key\s+areas?)\s*:?\s*(.+)$/i
      );
      if (inline?.[1]?.includes(',')) {
        out.skills = inline[1].trim();
        break;
      }
      if (
        /^(?:strengths?\s*(?:&|and)?\s*(?:it\s+)?skills?|technical\s+skills|core\s+skills|key\s+skills|it\s+skills|core\s+specialt(?:y|ies)(?:\s*(?:&|and)\s*key\s+areas?)?|key\s+areas?)\s*:?\s*$/i.test(
          line
        )
      ) {
        const body = lines.slice(i + 1, i + 20).filter((l) => /^[-•*·]/.test(l) || l.length <= 80);
        if (body.length >= 2) {
          out.skills = body.join('\n');
          break;
        }
      }
    }
  }

  if (!out.summary) {
    for (const line of lines) {
      const inline = line.match(/^(?:objective|profile|about)\s*:?\s*(.+)$/i);
      if (inline?.[1] && inline[1].length >= 20) {
        out.summary = inline[1].trim();
        break;
      }
    }
  }

  if (!out.experience) {
    const blocks: string[] = [];
    const educationHeaderRe =
      /\b(?:b\.?(?:tech|e|a|sc|com)|m\.?(?:tech|ba|sc|com)|ph\.?d|mba|bachelor|master|degree|diploma|certificate|university|college|institute|school|academy|gpa|cgpa)\b/i;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!/\b(19|20)\d{2}\b/.test(line) || !/present|current|[-–—to]/i.test(line)) continue;
      const header = lines[i - 1] || '';
      if (!header || header.length > 100 || /@/.test(header)) continue;
      if (educationHeaderRe.test(header)) continue;
      if (/^(?:education|academic|qualification|degree)/i.test(lines[i - 2] || '')) continue;
      const bullets = lines.slice(i + 1, i + 5).filter((l) => /^[-•*·]/.test(l));
      blocks.push([header, line, ...bullets].join('\n'));
    }
    if (blocks.length > 0) out.experience = blocks.join('\n\n');
  }

  if (!out.achievements) {
    for (let i = 0; i < lines.length; i++) {
      if (
        !/^(?:achievements?|awards?|honors?|recognition|accomplishments?|highlights?|key\s+achievements?|professional\s+highlights?|cost\s+sav(?:ing|ings)(?:\s+activit(?:y|ies))?)\s*:?\s*$/i.test(
          lines[i]
        )
      ) {
        continue;
      }
      const body = lines.slice(i + 1, i + 12).filter((l) => l.length >= 6);
      if (body.length >= 1) {
        out.achievements = body.join('\n');
        break;
      }
    }
  }

  if (!out.languages) {
    for (const line of lines) {
      const m = line.match(
        /^(?:languages?(?:\s+known)?|linguistic\s+skills?)\s*[:\-–—]?\s*(.+)$/i
      );
      if (m?.[1] && /[,/]/.test(m[1])) {
        out.languages = m[1].trim();
        break;
      }
    }
  }

  if (!out.hobbies) {
    for (let i = 0; i < lines.length; i++) {
      if (
        !/^(?:hobbies?|interests?|personal\s+interests?|extracurricular)\s*:?\s*$/i.test(
          lines[i]
        )
      ) {
        continue;
      }
      const inline = lines[i].match(
        /^(?:hobbies?|interests?|personal\s+interests?|extracurricular)\s*:?\s*(.+)$/i
      );
      if (inline?.[1]?.includes(',')) {
        out.hobbies = inline[1].trim();
        break;
      }
      const body = lines.slice(i + 1, i + 8).filter((l) => l.length >= 2);
      if (body.length >= 1) {
        out.hobbies = body.join('\n');
        break;
      }
    }
  }

  return out;
}
