/**
 * Resolve section bodies including custom headings mapped by keyword.
 */

import type { DetectedResumeSections } from '../section-detection/types';

const ACHIEVEMENTS_HEADING_RE =
  /\b(?:achievements?|awards?|honors?|honours?|recognition|accomplishments?|highlights?|key\s+achievements?|professional\s+highlights?|distinctions?|cost\s+sav(?:ing|ings)|savings?\s+activit)\b/i;

const HOBBIES_HEADING_RE =
  /\b(?:hobbies?|interests?|personal\s+interests?|extracurricular|leisure)\b/i;

const LANGUAGES_INLINE_RE =
  /^(?:languages?(?:\s+known)?|linguistic\s+skills?|spoken\s+languages?)\s*[:\-–—]?\s*(.+)$/i;

export function resolveAchievementsSectionText(sections: DetectedResumeSections): string {
  const direct = sections.achievements?.trim();
  if (direct) return direct;

  for (const custom of sections.customSections || []) {
    if (ACHIEVEMENTS_HEADING_RE.test(custom.rawHeading)) {
      return custom.content?.trim() || '';
    }
  }
  return '';
}

export function resolveHobbiesSectionText(sections: DetectedResumeSections): string {
  const direct = sections.hobbies?.trim();
  if (direct) return direct;

  for (const custom of sections.customSections || []) {
    if (HOBBIES_HEADING_RE.test(custom.rawHeading) && !/\bcost\s+sav/i.test(custom.rawHeading)) {
      return custom.content?.trim() || '';
    }
  }
  return '';
}

/** Harvest languages from Personal Details / biodata custom blocks or inline lines. */
export function resolveLanguagesSectionText(sections: DetectedResumeSections): string {
  const direct = sections.languages?.trim();
  if (direct) {
    // Prefer inline language lists over trailing personal-detail debris.
    const lines = direct.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const langLine = lines.find(
      (l) =>
        /^(?:hindi|english|french|spanish|german|arabic|chinese|japanese|korean|portuguese|italian|russian|tamil|telugu|bengali|marathi|gujarati|punjabi|urdu|malayalam|kannada)\b/i.test(
          l
        ) ||
        (/,/.test(l) &&
          /\b(?:hindi|english|french|spanish|german|arabic|chinese|japanese|punjabi|urdu|tamil|telugu|bengali|marathi|gujarati)\b/i.test(
            l
          ) &&
          !/\b(?:exposure|father|blood|marital|dob)\b/i.test(l))
    );
    if (langLine) return langLine.replace(/^languages?\s*[:\-–—]?\s*/i, '').trim();
    // Drop person-name / exposure debris lines from languages body.
    const cleaned = lines
      .filter(
        (l) =>
          !/\b(?:exposure|father|blood|marital|dob|date of birth)\b/i.test(l) &&
          !/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}$/.test(l) // bare person names
      )
      .join(', ');
    if (cleaned && /[a-zA-Z]/.test(cleaned)) return cleaned;
    return direct;
  }

  for (const custom of sections.customSections || []) {
    const heading = custom.rawHeading || '';
    if (/\b(?:languages?|linguistic)\b/i.test(heading)) {
      const inline = heading.match(
        /^(?:languages?(?:\s+known)?|linguistic\s+skills?)\s*[:\-–—]?\s*(.+)$/i
      );
      if (inline?.[1]) return inline[1].trim();
      return custom.content?.trim() || '';
    }
    if (/\b(?:personal\s+details?|personal\s+information|biodata|bio[- ]?data)\b/i.test(heading)) {
      const lines = (custom.content || '').split(/\n/).map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        const m = line.match(LANGUAGES_INLINE_RE);
        if (m?.[1]) return m[1].trim();
        if (/^(?:languages?)\b/i.test(line) && /[,/]/.test(line)) {
          return line.replace(/^languages?\s*[:\-–—]?\s*/i, '').trim();
        }
      }
    }
  }

  // Fall back: scan normalized text for an inline languages line.
  const text = sections.normalizedText || '';
  for (const line of text.split(/\n/)) {
    const m = line.trim().match(LANGUAGES_INLINE_RE);
    if (m?.[1] && m[1].split(/[,/]/).length >= 2) return m[1].trim();
    // "Languages Hindi, English, Punjabi" as a whole line
    const glued = line
      .trim()
      .match(/^languages?\s+((?:[A-Za-z][A-Za-z.]+(?:\s*,\s*|\s+and\s+|\s*\/\s*))+[A-Za-z][A-Za-z.]+)\s*$/i);
    if (glued?.[1]) return glued[1].trim();
  }
  return '';
}
