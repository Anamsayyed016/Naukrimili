/**
 * Section Reordering Utility
 * Reorders resume sections in template HTML based on custom order
 */

export type SectionId = 
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'achievements'
  | 'languages'
  | 'hobbies';

// Map section IDs to their placeholder names in templates
const SECTION_PLACEHOLDER_MAP: Record<SectionId, string> = {
  summary: 'SUMMARY',
  experience: 'EXPERIENCE',
  education: 'EDUCATION',
  skills: 'SKILLS',
  projects: 'PROJECTS',
  certifications: 'CERTIFICATIONS',
  achievements: 'ACHIEVEMENTS',
  languages: 'LANGUAGES',
  hobbies: 'HOBBIES',
};

// Default section order (fallback)
const DEFAULT_SECTION_ORDER: SectionId[] = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'achievements',
  'languages',
  'hobbies',
];

/**
 * Extract section blocks from HTML template
 */
function extractSectionBlocks(html: string): Map<string, string> {
  const sections = new Map<string, string>();
  
  // Pattern to match {{#if SECTION}}...{{/if}} blocks
  const sectionPattern = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/gi;
  let match;
  
  while ((match = sectionPattern.exec(html)) !== null) {
    const sectionName = match[1].toUpperCase();
    const sectionContent = match[0]; // Include the {{#if}} tags
    
    // Map to our section IDs
    const sectionId = Object.entries(SECTION_PLACEHOLDER_MAP).find(
      ([_, placeholder]) => placeholder === sectionName
    )?.[0] as SectionId | undefined;
    
    if (sectionId) {
      sections.set(sectionId, sectionContent);
    }
  }
  
  return sections;
}

/**
 * Reorder sections in HTML template based on custom order
 * Simple approach: extract sections, reorder, and reconstruct
 */
export function reorderSections(
  html: string,
  customOrder?: SectionId[]
): string {
  if (!customOrder || customOrder.length === 0) {
    return html; // No custom order, return as-is
  }

  // Extract all section blocks with their full content
  const sectionPattern = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/gi;
  const sectionMap = new Map<string, string>(); // placeholder -> full block
  const sectionOrder: string[] = []; // preserve original order for unknown sections
  
  let match;
  while ((match = sectionPattern.exec(html)) !== null) {
    const placeholder = match[1].toUpperCase();
    const fullBlock = match[0];
    sectionMap.set(placeholder, fullBlock);
    sectionOrder.push(placeholder);
  }
  
  if (sectionMap.size === 0) {
    return html; // No sections found
  }
  
  // Build ordered list: custom order first, then remaining in original order
  const orderedBlocks: string[] = [];
  const processedPlaceholders = new Set<string>();
  
  // Add sections in custom order
  for (const sectionId of customOrder) {
    const placeholder = SECTION_PLACEHOLDER_MAP[sectionId];
    const block = sectionMap.get(placeholder);
    if (block) {
      orderedBlocks.push(block);
      processedPlaceholders.add(placeholder);
    }
  }
  
  // Add remaining sections in original order
  for (const placeholder of sectionOrder) {
    if (!processedPlaceholders.has(placeholder)) {
      const block = sectionMap.get(placeholder);
      if (block) {
        orderedBlocks.push(block);
      }
    }
  }
  
  // Replace all sections with placeholders first
  let result = html;
  for (const [placeholder, block] of sectionMap.entries()) {
    result = result.replace(block, `{{SECTION_${placeholder}_PLACEHOLDER}}`);
  }
  
  // Replace placeholders with reordered sections
  let placeholderIndex = 0;
  const placeholderRegex = /\{\{SECTION_\w+_PLACEHOLDER\}\}/g;
  result = result.replace(placeholderRegex, () => {
    const block = orderedBlocks[placeholderIndex] || '';
    placeholderIndex++;
    return block;
  });
  
  return result;
}

/**
 * Get default section order
 */
export function getDefaultSectionOrder(): SectionId[] {
  return [...DEFAULT_SECTION_ORDER];
}

/**
 * Validate section order
 */
export function validateSectionOrder(order: unknown): order is SectionId[] {
  if (!Array.isArray(order)) return false;
  
  const validIds = new Set(Object.keys(SECTION_PLACEHOLDER_MAP));
  return order.every(id => validIds.has(id));
}

