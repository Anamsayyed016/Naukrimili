/**
 * Generic renderer for extended / dynamic Builder sections in preview and export.
 * Appends sections after standard template content — templates unchanged.
 */

import { readExtendedSections, getActiveDynamicSections } from '@/lib/resume-builder/dynamic-section-registry';
import type { DynamicSectionSpec } from '@/lib/resume-builder/dynamic-section-registry';
import { filterMeaningfulListItems } from '@/lib/resume-builder/dynamic-section-visibility';
import type { ExtendedBuilderSections } from '@/lib/resume-builder/canonical-mapping/types';
import {
  isRenderableResumeFieldKey,
  isRenderableResumeSection,
} from '@/lib/resume-builder/renderable-resume-sections';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderStringListItems(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return `<p>${escapeHtml(items[0])}</p>`;
  return `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;
}

function renderRecordList(
  items: Array<Record<string, unknown>>,
  spec: DynamicSectionSpec
): string {
  if (items.length === 0) return '';
  return items
    .map((entry) => {
      const fields = spec.recordFields || [];
      const parts = fields
        .map((f) => {
          const v = String(entry[f.key] ?? '').trim();
          return v ? `<div class="extended-field"><strong>${escapeHtml(f.label)}:</strong> ${escapeHtml(v)}</div>` : '';
        })
        .filter(Boolean)
        .join('');
      return `<div class="extended-record-item">${parts || escapeHtml(String(entry.name || ''))}</div>`;
    })
    .join('');
}

function renderSectionBlock(heading: string, innerHtml: string): string {
  if (!innerHtml.trim()) return '';
  const slug = heading.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `
    <section class="extended-section extended-section--${slug}" data-extended-section="${escapeHtml(heading)}">
      <h2 class="extended-section-title section-title">${escapeHtml(heading)}</h2>
      <div class="extended-section-body description">
        ${innerHtml}
      </div>
    </section>
  `;
}

function renderSpecSection(spec: DynamicSectionSpec, extended: ExtendedBuilderSections): string {
  const value = extended[spec.fieldKey];
  if (spec.kind === 'stringList') {
    const items = filterMeaningfulListItems(Array.isArray(value) ? value : [], {
      sectionLabel: spec.label,
    });
    return renderSectionBlock(spec.label, renderStringListItems(items));
  }
  if (spec.kind === 'recordList') {
    const items = (Array.isArray(value) ? value : []) as Array<Record<string, unknown>>;
    return renderSectionBlock(spec.label, renderRecordList(items, spec));
  }
  if (spec.kind === 'textarea') {
    const text = typeof value === 'string' ? value.trim() : '';
    return renderSectionBlock(spec.label, text ? `<p>${escapeHtml(text)}</p>` : '');
  }
  if (spec.kind === 'keyValue') {
    const kv = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, string>) : {};
    const inner = Object.entries(kv)
      .filter(([k, v]) => isRenderableResumeFieldKey(k, v) && String(v).trim())
      .map(([k, v]) => `<div class="extended-field"><strong>${escapeHtml(k)}:</strong> ${escapeHtml(String(v))}</div>`)
      .join('');
    return renderSectionBlock(spec.label, inner);
  }
  return '';
}

/** Build HTML for all active extended sections. */
export function renderExtendedBuilderSections(formData: Record<string, unknown>): string {
  const extended = readExtendedSections(formData);
  const activeSpecs = getActiveDynamicSections(formData);
  const blocks: string[] = [];

  for (const spec of activeSpecs) {
    if (!isRenderableResumeSection(spec.label)) continue;
    const html = renderSpecSection(spec, extended);
    if (html.trim()) blocks.push(html);
  }

  return blocks.join('\n');
}

export function appendExtendedSectionsToHtml(
  renderedHtml: string,
  formData: Record<string, unknown>
): string {
  const extension = renderExtendedBuilderSections(formData);
  if (!extension.trim()) return renderedHtml;

  const styleBlock = `
    <style>
      .extended-section { margin-top: 1.25rem; page-break-inside: avoid; }
      .extended-section-title { font-size: 1.05rem; font-weight: 700; margin: 0 0 0.5rem; }
      .extended-section-body ul { margin: 0.25rem 0 0 1.1rem; padding: 0; }
      .extended-section-body li { margin-bottom: 0.25rem; }
      .extended-record-item { margin-bottom: 0.75rem; }
      .extended-field { margin-bottom: 0.2rem; font-size: 0.92rem; }
    </style>
  `;

  const mainMatch = renderedHtml.match(/(<main[^>]*>[\s\S]*?)(\s*<\/main>)/i);
  if (mainMatch) {
    return renderedHtml.replace(mainMatch[0], `${mainMatch[1]}\n${extension}\n${mainMatch[2]}`);
  }

  const containerMatch = renderedHtml.match(
    /(<div[^>]*class="[^"]*resume-container[^"]*"[^>]*>[\s\S]*?)(\s*<\/div>\s*$)/i
  );
  if (containerMatch) {
    return renderedHtml.replace(containerMatch[0], `${containerMatch[1]}\n${extension}\n${containerMatch[2]}`);
  }

  if (/<\/body>/i.test(renderedHtml)) {
    return renderedHtml.replace(/<\/body>/i, `${styleBlock}\n${extension}\n</body>`);
  }

  return `${renderedHtml}\n${styleBlock}\n${extension}`;
}
