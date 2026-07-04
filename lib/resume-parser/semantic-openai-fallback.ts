/**
 * Selective OpenAI section classification — only for ambiguous / low-confidence sections.
 * Parser output always wins; OpenAI fills classification gaps only.
 */

import {
  classifySectionHeading,
  getDefinitionById,
  type SemanticSectionDefinition,
} from '@/lib/resume-builder/semantic-registry';

export const SECTION_CLASSIFY_CONFIDENCE_THRESHOLD = Number(
  process.env.SECTION_CLASSIFY_CONFIDENCE_THRESHOLD ?? '65'
);

export interface AmbiguousSectionInput {
  heading: string;
  body: string;
  parserConfidence?: number;
  source?: string;
}

export interface ClassifiedSectionResult {
  heading: string;
  body: string;
  definition: SemanticSectionDefinition;
  confidence: number;
  source: string;
  classifiedBy: 'parser' | 'registry' | 'openai';
}

export function findAmbiguousSections(sections: AmbiguousSectionInput[]): AmbiguousSectionInput[] {
  return sections.filter((sec) => {
    const classified = classifySectionHeading(sec.heading);
    const parserConf = sec.parserConfidence ?? 0;
    if (parserConf >= SECTION_CLASSIFY_CONFIDENCE_THRESHOLD) return false;
    if (classified && classified.confidence >= SECTION_CLASSIFY_CONFIDENCE_THRESHOLD) return false;
    return sec.body.trim().length >= 20;
  });
}

export function classifySectionsWithRegistry(
  sections: AmbiguousSectionInput[]
): ClassifiedSectionResult[] {
  const results: ClassifiedSectionResult[] = [];
  for (const sec of sections) {
    const classified = classifySectionHeading(sec.heading);
    if (!classified || classified.confidence < SECTION_CLASSIFY_CONFIDENCE_THRESHOLD) continue;
    results.push({
      heading: sec.heading,
      body: sec.body,
      definition: classified.definition,
      confidence: classified.confidence,
      source: sec.source || sec.heading,
      classifiedBy: 'registry',
    });
  }
  return results;
}

export function mergeSectionClassifications(
  existing: ClassifiedSectionResult[],
  fromOpenAI: Array<{ heading: string; sectionId: string; confidence?: number }>,
  bodyByHeading: Map<string, string>
): ClassifiedSectionResult[] {
  const out = [...existing];
  const seen = new Set(existing.map((e) => e.heading.toLowerCase()));

  for (const item of fromOpenAI) {
    const heading = String(item.heading || '').trim();
    if (!heading || seen.has(heading.toLowerCase())) continue;
    const def = getDefinitionById(item.sectionId);
    if (!def) continue;
    const reg = classifySectionHeading(heading);
    if (reg && reg.confidence >= SECTION_CLASSIFY_CONFIDENCE_THRESHOLD) {
      out.push({
        heading,
        body: bodyByHeading.get(heading) || '',
        definition: reg.definition,
        confidence: reg.confidence,
        source: heading,
        classifiedBy: 'registry',
      });
    } else {
      out.push({
        heading,
        body: bodyByHeading.get(heading) || '',
        definition: def,
        confidence: Math.min(90, Number(item.confidence) || 70),
        source: heading,
        classifiedBy: 'openai',
      });
    }
    seen.add(heading.toLowerCase());
  }
  return out;
}

export function buildAmbiguousSectionClassificationPrompt(
  sections: AmbiguousSectionInput[]
): string {
  const blocks = sections
    .map((s, i) => `SECTION ${i + 1} HEADING: ${s.heading}\nBODY:\n${s.body.slice(0, 1500)}`)
    .join('\n\n---\n\n');
  return `Classify each resume section below. Return JSON array: [{ "heading": "...", "sectionId": "...", "confidence": 0-100 }].
Use sectionId from: professional-highlights, professional-qualifications, training, seminars, strengths, awards, volunteer, memberships, research, publications, patents, references, declaration, personal-details, core-competencies, soft-skills, technical-skills, industry-expertise, achievements, skills, certifications, education, experience, hobbies, extra.
Do NOT invent content. Classify headings only.

${blocks}`;
}
