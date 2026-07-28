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
  const hasRole =
    /^\s*(?:role|designation|position|title)\s*[:\-–—]?\s*\S+/im.test(t) ||
    /\bdesignation\s+\S+/i.test(t);
  const hasOrgLabel =
    /^\s*(?:organi[sz]ation|employer|company|client|firm)\s*[:\-–—]\s*\S+/im.test(t) ||
    (/^\s*(?:organi[sz]ation|employer|company|client|firm)\s+\S+/im.test(t) &&
      !/^\s*(?:organi[sz]ation|employer|company|client|firm)\s+(?:remarks?|course|designation|duration|division|education|year|s\.?\s*\/?\s*no\.?)\b/im.test(
        t
      ));
  const hasDurationLabel =
    /^\s*(?:duration|period|tenure)\s*[:\-–—]?\s*\S+/im.test(t) ||
    /\bduration\s+\d/i.test(t);
  const hasResponsibility =
    /\b(?:key\s+)?responsibilit(?:y|ies)\s*[:\-–—]?/i.test(t);
  const hasTeamSize = /\bteam\s*size\s*:/i.test(t);
  const hasDates =
    (/\b(?:19|20)\d{2}\b/.test(t) ||
      /\b\d{1,2}[-/.]\d{1,2}[-/.](?:19|20)\d{2}\b/.test(t)) &&
    /(?:present|current|till\s*date|to\s*date|still\s*date|[-–—]|to\s+)/i.test(t);
  const hasCompanySuffix =
    /\b(?:ltd|limited|pvt|private\s+limited|llc|inc|corp|corporation|gmbh|plc)\b\.?/i.test(t) ||
    // Glued OCR employers: "NAHARPOLYFILMSLTD", "LupinLtdmandideep"
    /[a-z](?:ltd|limited|llc|inc|corp)\b/i.test(t);
  // Parenthetical / pipe tenures common on ops / security / manufacturing CVs:
  // "Liaison Officer (03 Jun 2019 to 29/05/2023) | CTC: 5.4 lakh"
  const hasInlineTenure =
    /\((?:[^)\n]{0,48}\b(?:19|20)\d{2}[^)\n]{0,48}\b(?:to|[-–—]|till|until)\b[^)\n]{0,48})\)/i.test(
      t
    ) ||
    /\b(?:19|20)\d{2}\s*[-–—to]+\s*(?:(?:19|20)\d{2}|present|current|till\s*date)\b/i.test(t) ||
    /\b\d{1,2}[-/.]\d{1,2}[-/.](?:19|20)\d{2}\s*(?:to|[-–—])\s*(?:\d{1,2}[-/.]\d{1,2}[-/.](?:19|20)\d{2}|still\s*date|present|current)\b/i.test(
      t
    ) ||
    // Glued month-year tenures: "01JULY2015TO 30 May2019"
    /\b\d{1,2}(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s*(?:19|20)\d{2}\s*(?:to|[-–—])/i.test(
      t
    );
  const hasCompSignal =
    /\b(?:ctc|c\.t\.c|lakh|lac|p\.?a\.?|per\s+annum|salary|remuneration)\b/i.test(t);
  const employmentHeading =
    /\b(?:professional|work|employment)\s*experience\b|\bemployment\s+history\b|\bworkexperience\b/i.test(
      t
    );
  // "Since Mon YYYY to till date" tenure openers used on many civil/infra CVs.
  const hasSinceTenure =
    /\bsince\s+(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+)?(?:19|20)\d{2}\b/i.test(
      t
    );
  // Numbered / colon employer entries: "(1).ACME LTD: …" / "RajSecurityForce: A …"
  const employerColonLines = (
    t.match(
      /(?:^|\n)\s*(?:\(?\s*\d+\s*\)\s*\.?\s*)?(?!key\s*areas?\b|role\b|designation\b|duration\b|organization\b|organisation\b)[A-Za-z][A-Za-z0-9.&'/]{2,}[^:\n]{0,48}:\s*[A-Za-z]/gim
    ) || []
  ).length;
  // Labeled ATS blocks: Organization + Designation + Duration (colons optional).
  if (hasOrgLabel && hasRole && (hasDates || hasDurationLabel || hasResponsibility)) return true;
  if (hasOrgLabel && hasDurationLabel && (hasRole || hasResponsibility || hasCompanySuffix)) {
    return true;
  }
  if (hasRole && (hasDates || hasCompanySuffix || hasResponsibility || hasTeamSize)) return true;
  if (hasTeamSize && hasResponsibility && (hasDates || hasCompanySuffix)) return true;
  if (hasCompanySuffix && hasDates && hasResponsibility) return true;
  // Employer-suffix + date range is enough even without Role:/Responsibilities: labels.
  if (hasCompanySuffix && hasDates && (hasInlineTenure || hasCompSignal || t.length >= 200)) {
    return true;
  }
  if (
    hasCompanySuffix &&
    hasSinceTenure &&
    t.length >= 160 &&
    (t.match(/\b(?:ltd|limited|pvt|llc|inc|corp)\b/gi) || []).length >= 2
  ) {
    return true;
  }
  if (employmentHeading && hasDates && (hasCompanySuffix || hasInlineTenure) && t.length >= 120) {
    return true;
  }
  if (hasInlineTenure && hasCompSignal && hasDates && t.length >= 120) return true;
  // Multi-employer colon resumes (ops/security/manufacturing) without legal suffixes.
  if (
    employerColonLines >= 2 &&
    (hasDates || hasInlineTenure || hasCompSignal) &&
    t.length >= 100
  ) {
    return true;
  }
  if (
    employerColonLines >= 1 &&
    hasInlineTenure &&
    hasCompSignal &&
    t.length >= 80
  ) {
    return true;
  }
  return false;
}

/**
 * True when a section is a project portfolio (client projects under employers),
 * not a work-history block — even if employer suffixes and dates appear.
 */
export function looksLikeProjectPortfolioText(text: string): boolean {
  const t = String(text || '');
  if (t.trim().length < 40) return false;
  const underCount = (t.match(/\bprojects?\s+under\b/gi) || []).length;
  const titleLabels = (t.match(/^\s*title\s*:/gim) || []).length;
  const durationLabels = (t.match(/^\s*duration\s*:/gim) || []).length;
  if (underCount >= 2) return true;
  if (underCount >= 1 && titleLabels >= 1) return true;
  if (titleLabels >= 2 && durationLabels >= 1) return true;
  return false;
}

/**
 * Reclassify sections whose bodies are clearly employment history.
 * Protect genuine project-portfolio sections from false promotion into experience.
 * Also recover employment blocks that OCR/column order parked under languages.
 */
export function reclassifyEmploymentShapedSections(
  sections: DetectedSectionBlock[]
): DetectedSectionBlock[] {
  return sections.map((section) => {
    if (
      section.type !== 'projects' &&
      section.type !== 'certifications' &&
      section.type !== 'achievements' &&
      section.type !== 'languages' &&
      section.type !== 'skills'
    ) {
      return section;
    }
    // Key Projects / Project under X portfolios must stay projects.
    if (section.type === 'projects' && looksLikeProjectPortfolioText(section.content)) {
      return section;
    }
    // Course / qualification tables (Course | Organization | Remarks) are not employment.
    if (
      section.type === 'certifications' &&
      /^(?:course|organization|organisation|remarks?|s\.?\s*\/?\s*no\.?)\b/im.test(section.content) &&
      (section.content.match(/^(?:course|organization|organisation|remarks?)\s*$/gim) || []).length >= 2
    ) {
      return section;
    }
    // Genuine skill lists (comma stacks / short bullets) must stay skills even when
    // a single employer name appears nearby.
    if (
      section.type === 'skills' &&
      !looksLikeEmploymentShapedText(section.content) &&
      (section.content.match(/,/g) || []).length >= 2 &&
      section.content.length < 400
    ) {
      return section;
    }
    // Career/Professional Highlights that are really work history → experience.
    if (!looksLikeEmploymentShapedText(section.content)) return section;
    // Don't steal project portfolios that were mis-typed as achievements.
    if (section.type === 'achievements' && looksLikeProjectPortfolioText(section.content)) {
      return {
        ...section,
        type: 'projects' as NormalizedSectionType,
        confidence: Math.max(section.confidence, 58),
      };
    }
    // Languages / skills headings that captured Organization/Designation blocks
    // (column bleed) or mid-experience Key Area duty clusters with employers.
    if (section.type === 'languages' || section.type === 'skills') {
      return {
        ...section,
        type: 'experience' as NormalizedSectionType,
        confidence: Math.max(section.confidence, 56),
      };
    }
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
        /^(?:skills?|technical\s+skills|core\s+skills|it\s+skills|strengths?\s*(?:&|and)?\s*it\s+skills|competencies|expertise|specialt(?:y|ies)|core\s+specialt(?:y|ies)|key\s+areas?\s+of\s+expertise)\s*:?\s*(.+)$/i
      );
      if (inline?.[1]?.includes(',')) {
        out.skills = inline[1].trim();
        break;
      }
      // Labeled tech stacks parked away from the skills heading (column OCR).
      const labeledTech = line.match(
        /^(?:operating\s+systems?|os|packages?|tools?|software|applications?)\s*[:\-–—]\s*(.+)$/i
      );
      if (labeledTech?.[1] && labeledTech[1].length >= 4) {
        const chunk = [line];
        for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
          const nxt = lines[j];
          if (
            /^(?:operating\s+systems?|os|packages?|tools?|software|applications?)\s*[:\-–—]\s*/i.test(
              nxt
            ) ||
            (nxt.length <= 80 && /[A-Za-z]/.test(nxt) && !/^(?:declaration|place|date|yours)\b/i.test(nxt))
          ) {
            if (
              /^(?:operating\s+systems?|os|packages?|tools?|software|applications?)\s*[:\-–—]\s*/i.test(
                nxt
              )
            ) {
              chunk.push(nxt);
            } else if (chunk.length === 1 && /tally|excel|word|net|erp|ms\b/i.test(nxt)) {
              chunk.push(nxt);
            } else {
              break;
            }
          } else {
            break;
          }
        }
        out.skills = chunk.join('\n');
        break;
      }
      if (
        /^(?:strengths?\s*(?:&|and)?\s*(?:it\s+)?skills?|technical\s+skills|core\s+skills|key\s+skills|it\s+skills|core\s+specialt(?:y|ies)(?:\s*(?:&|and)\s*key\s+areas?)?|key\s+areas?\s+of\s+expertise)\s*:?\s*$/i.test(
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
        const captured = inline[1].trim();
        // Glued OCR headings ("OBJECTIVE PROFESSIONAL ACCOMPLISHMENTS") must not
        // become the summary body — only narrative objective prose qualifies.
        if (
          /^(?:professional\s+accomplishments?|key\s+achievements?|career\s+achievements?|academic\s+credentials?|work\s+experience|technical\s+skills?|personal\s+(?:profile|details)|resume|cv)\b/i.test(
            captured
          ) ||
          (captured.split(/\s+/).length <= 6 &&
            !/[.!?,]/.test(captured) &&
            /^(?:[A-Z][A-Za-z]+\s+){1,5}[A-Z][A-Za-z]+$/.test(captured))
        ) {
          continue;
        }
        out.summary = captured;
        break;
      }
    }
  }
  // Prefer a dedicated objective sentence when present (even if a weak summary exists).
  {
    const headingLikeSummary =
      !!out.summary &&
      (/^(?:professional\s+accomplishments?|key\s+achievements?|academic\s+credentials?|objective|summary|profile)\s*$/i.test(
        out.summary.trim()
      ) ||
        out.summary.trim().split(/\s+/).length <= 4);
    const objective = lines.find(
      (l) =>
        /\blooking\s+for\b/i.test(l) &&
        l.length >= 40 &&
        !/^(?:organi[sz]ation|designation|duration)\b/i.test(l) &&
        !/\b(?:organi[sz]ation|designation|duration)\s*[:\-–—]/i.test(l)
    );
    if (
      objective &&
      (!out.summary ||
        out.summary.length < 40 ||
        headingLikeSummary ||
        /accomplishments?|credentials?/i.test(out.summary))
    ) {
      // Collect following wrapped objective lines until a blank / heading / bullet cluster.
      const idx = lines.indexOf(objective);
      const chunk = [objective];
      for (let j = idx + 1; j < Math.min(lines.length, idx + 4); j++) {
        const nxt = lines[j];
        if (!nxt || nxt.length < 12) break;
        // Stop at real section/field headings, not mid-sentence wraps that happen
        // to start with words like "organization which…".
        if (
          /^(?:academic|education|experience|personal|language|technical|professional)\b/i.test(
            nxt
          ) &&
          nxt.split(/\s+/).length <= 6
        ) {
          break;
        }
        if (/^(?:organi[sz]ation|designation|duration)\s*[:\-–—]?\s*$/i.test(nxt)) break;
        if (/^(?:organi[sz]ation|designation|duration)\s*[:\-–—]\s*\S+/i.test(nxt)) break;
        if (/^[A-Z][a-z]+(?:\s+[a-z]+){0,4}$/.test(nxt) && nxt.length < 50) break;
        if (/\b(?:high energy|good learner|innovative|committed|sound knowledge)\b/i.test(nxt)) break;
        chunk.push(nxt);
      }
      out.summary = chunk.join(' ').replace(/\s+/g, ' ').trim();
    } else if (headingLikeSummary) {
      out.summary = '';
    }
  }
  // Contact-heavy "Personal Profile" bodies are not career summaries — recover an
  // objective sentence from the document when present.
  if (
    out.summary &&
    /\b(?:contact\s+number|e-?mail|date\s+of\s+birth|permanent\s+address|nationality|marital\s+status)\b/i.test(
      out.summary
    )
  ) {
    const objective = lines.find(
      (l) =>
        /\blooking\s+for\b/i.test(l) &&
        l.length >= 40 &&
        !/^(?:organi[sz]ation|designation|duration)\b/i.test(l) &&
        !/\b(?:organi[sz]ation|designation|duration)\s*[:\-–—]/i.test(l)
    );
    if (objective) {
      out.summary = objective;
    } else {
      out.summary = '';
    }
  }

  // Labeled Organization / Designation / Duration blocks (colons optional).
  const labeledOrgBlocks: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bareOrgHeader = /^(?:organi[sz]ation|employer|company)\s*$/i.test(line);
    const nextLine = (lines[i + 1] || '').trim();
    // Table column stubs: "Organization" / "Remarks" / "Course" — never employers.
    if (
      bareOrgHeader &&
      (/^(?:remarks?|course|designation|duration|division|education|year|board|university|s\.?\s*\/?\s*no\.?)\s*$/i.test(
        nextLine
      ) ||
        !nextLine)
    ) {
      continue;
    }
    if (
      !/^(?:organi[sz]ation|employer|company)\s*[:\-–—]?\s*\S+/i.test(line) &&
      !(bareOrgHeader && nextLine.length >= 3)
    ) {
      continue;
    }
    // Same-line table header glue: "Organization Remarks"
    if (
      /^(?:organi[sz]ation|employer|company)\s+(?:remarks?|course|designation|duration)\b/i.test(
        line
      )
    ) {
      continue;
    }
    const block = [line];
    for (let j = i + 1; j < Math.min(lines.length, i + 12); j++) {
      const nxt = lines[j];
      if (
        /^(?:organi[sz]ation|employer|company)\s*[:\-–—]?\s*\S+/i.test(nxt) ||
        (/^(?:organi[sz]ation|employer|company)\s*$/i.test(nxt) && j > i + 1)
      ) {
        break;
      }
      if (/^(?:declaration|place\s*:|date\s*:|yours\s+sincerely|technical\s+skills|language\s+proficiency)\b/i.test(nxt)) {
        break;
      }
      block.push(nxt);
      if (/^responsibilit/i.test(nxt) && block.length >= 4) {
        // include a few duty lines then stop at next org
        continue;
      }
    }
    if (
      block.some((l) => /(?:designation|duration|responsibilit)/i.test(l)) ||
      (block.length >= 3 &&
        !block.some((l) =>
          /^(?:remarks?|course|s\.?\s*\/?\s*no\.?|division|education|year)\s*$/i.test(l)
        ))
    ) {
      labeledOrgBlocks.push(block.join('\n'));
    }
  }
  if (labeledOrgBlocks.length > 0) {
    const joined = labeledOrgBlocks.join('\n\n');
    if (!out.experience || out.experience.length < joined.length * 0.6) {
      out.experience = out.experience ? `${joined}\n\n${out.experience}`.trim() : joined;
    } else if (!/organi[sz]ation|designation/i.test(out.experience)) {
      out.experience = `${joined}\n\n${out.experience}`.trim();
    }
  }

  if (!out.experience) {
    const blocks: string[] = [];
    const educationHeaderRe =
      /\b(?:b\.?(?:tech|e|a|sc|com)|m\.?(?:tech|ba|sc|com)|ph\.?d|mba|bachelor|master|degree|diploma|certificate|university|college|institute|school|academy|gpa|cgpa)\b/i;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!/\b(19|20)\d{2}\b/.test(line) || !/present|current|[-–—to]|still\s*date/i.test(line)) continue;
      const header = lines[i - 1] || '';
      if (!header || header.length > 100 || /@/.test(header)) continue;
      if (educationHeaderRe.test(header)) continue;
      if (/^(?:education|academic|qualification|degree)/i.test(lines[i - 2] || '')) continue;
      const bullets = lines.slice(i + 1, i + 5).filter((l) => /^[-•*·]/.test(l));
      blocks.push([header, line, ...bullets].join('\n'));
    }
    if (blocks.length > 0) out.experience = blocks.join('\n\n');
  }

  // Recover education rows when the education body is missing or polluted with objective prose.
  const eduRows: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      !/\b(?:19|20)\d{2}\b/.test(line) &&
      !/^(?:apr|may|jun|jul|aug|sep|oct|nov|dec|jan|feb|mar)\b/i.test(line)
    ) {
      continue;
    }
    if (
      !/\b(?:bachelor|master|diploma|certificate|secondary|matriculation|intermediate|commerce|science|arts|b\.?\s*com|m\.?\s*com|b\.?\s*sc|high(?:er)?\s+secondary)\b/i.test(
        line
      )
    ) {
      continue;
    }
    const chunk = [line];
    for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
      const nxt = lines[j];
      if (/^(?:organi[sz]ation|designation|duration|personal\s+profile|language|contact)\b/i.test(nxt)) break;
      // Next credential header — stop so institutions stay with their own degree.
      if (
        /^(?:apr|may|jun|jul|aug|sep|oct|nov|dec|jan|feb|mar)\b.+\b(?:19|20)\d{2}\b/i.test(nxt) ||
        (/\b(?:19|20)\d{2}\b/.test(nxt) &&
          /\b(?:bachelor|master|diploma|certificate|secondary|matriculation|commerce|b\.?\s*com|m\.?\s*com)\b/i.test(
            nxt
          ))
      ) {
        break;
      }
      if (/\b(?:bachelor|master|secondary|certificate|aggregate|board|college|school)\b/i.test(nxt) || nxt.length <= 60) {
        chunk.push(nxt);
      } else {
        break;
      }
    }
    eduRows.push(chunk.join('\n'));
  }
  if (eduRows.length >= 1) {
    const joinedEdu = eduRows.join('\n\n');
    if (
      !out.education ||
      /\blooking\s+for\b|\bchallenging\s+and\s+rewarding\b/i.test(out.education) ||
      out.education.length < joinedEdu.length
    ) {
      out.education = joinedEdu;
    }
  }

  if (!out.achievements) {
    for (let i = 0; i < lines.length; i++) {
      const headingLine = lines[i];
      const isAccomplishmentsHeading =
        /^(?:achievements?|awards?|honors?|recognition|accomplishments?|highlights?|key\s+achievements?|professional\s+highlights?|professional\s+accomplishments?|cost\s+sav(?:ing|ings)(?:\s+activit(?:y|ies))?)\s*:?\s*$/i.test(
          headingLine
        ) ||
        // Glued OCR: "OBJECTIVE PROFESSIONAL ACCOMPLISHMENTS"
        /\bprofessional\s+accomplishments?\b|\bkey\s+achievements?\b/i.test(headingLine);
      if (!isAccomplishmentsHeading) continue;
      const body = lines
        .slice(i + 1, i + 14)
        .filter(
          (l) =>
            l.length >= 6 &&
            l.length <= 120 &&
            !/\b(?:looking\s+for|organi[sz]ation|designation|duration|bachelor|secondary|aggregate|operating\s+systems?|packages?\s*:)\b/i.test(
              l
            ) &&
            !/^(?:academic|education|experience|technical|language|personal|apr|may|jun|jul|aug|sep|oct|nov|dec|jan|feb|mar)\b/i.test(
              l
            ) &&
            !/\b(?:college|collage|school|university)\b/i.test(l)
        );
      // Prefer short soft-skill / accomplishment bullets over long prose.
      const soft = body.filter(
        (l) =>
          l.split(/\s+/).length <= 14 &&
          !/\b(?:apr|may|jun|jul|aug|sep|oct|nov|dec)\b.+\b(?:19|20)\d{2}\b/i.test(l)
      );
      const chosen = soft
        .filter((l) => !/^\s*(?:packages?|operating\s+systems?|tools?|software)\s*:/i.test(l))
        .slice(0, 8);
      const chosenBody =
        chosen.length >= 2
          ? chosen
          : body
              .slice(0, 6)
              .filter((l) => !/^\s*(?:packages?|operating\s+systems?|tools?|software)\s*:/i.test(l));
      const cleaned = chosenBody.filter(
        (l) =>
          l.length >= 12 &&
          !/^(?:revealed|organization which|andexperience)\b/i.test(l) &&
          !/^[a-z]/.test(l)
      );
      if (cleaned.length >= 1) {
        out.achievements = cleaned.join('\n');
        break;
      }
    }
  }

  if (!out.languages) {
    for (const line of lines) {
      const m = line.match(
        /^(?:languages?(?:\s+known)?|linguistic\s+skills?)\s*[:\-–—]?\s*(.+)$/i
      );
      if (m?.[1] && /[A-Za-z]/.test(m[1])) {
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
