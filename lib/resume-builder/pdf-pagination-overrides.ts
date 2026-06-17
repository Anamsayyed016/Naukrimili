/**
 * Centralized PDF / print pagination overrides.
 * Export-only — used by resume-export.ts (Puppeteer) and FinalizeStep (browser print).
 * Never import from LivePreview (screen preview must stay unchanged).
 */

/** Core pagination rules (Puppeteer applies these with emulateMediaType('screen')). */
export const PDF_PAGINATION_EXPORT_CSS = `
/* ── PDF export pagination (global, all templates) ── */

@page {
  size: A4 portrait;
  margin: 0;
}

html,
body {
  height: auto !important;
  min-height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}

/* Root shell — natural height, no clipping */
.resume-container,
[class*='-resume'] {
  min-height: auto !important;
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
  page-break-inside: auto !important;
  break-inside: auto !important;
}

/* Frame / background / decorative layers — must not force 297mm */
[class*='-frame'],
[class*='frame-art'],
[class*='bg-architecture'],
[class*='-shell'],
[class*='-mesh'],
[class*='-glow'],
[class*='body-rail'],
[class*='side-accent'],
.eel-luxury-frame,
.eel-bg-architecture,
.re-mesh,
.re-glow,
.vre-sidebar-glass {
  min-height: auto !important;
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}

/* Flex / grid body rows — disable equal-height stretch (primary blank-page fix) */
.resume-wrapper,
.re-body,
.eel-body,
.vre-body,
.tm-body,
[class*='-body']:not(body):not(html),
[class*='-layout'],
[class*='-columns'],
[class*='col-main'],
[class*='col-side'],
[class*='col-left'],
[class*='col-right'],
.eel-col-main,
.eel-col-side,
.re-main,
.re-sidebar,
.main-content,
.main-column,
.content-column,
.sidebar,
.side-column,
.content,
.mpe-body,
.fge-body,
.olx-body,
.ole-body,
.vhe-body,
.boardroom-body,
.graphite-body {
  align-items: flex-start !important;
  align-self: auto !important;
  min-height: auto !important;
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
  page-break-inside: auto !important;
  break-inside: auto !important;
}

/* CSS grid regions (skills rings, project grids) */
.skills-list,
.skills-rings,
[class*='project-grid'],
[class*='edu-grid'],
[class*='project-showcase'],
.psp-skills-progress .skills-list {
  page-break-inside: auto !important;
  break-inside: auto !important;
}

.psp-skill-item,
.psp-language-item {
  min-height: auto !important;
  page-break-inside: auto !important;
  break-inside: auto !important;
}

/* Large blocks — split across pages (override template break-inside: avoid) */
.experience-item,
.education-item,
.project-item,
.certification-item,
.achievement-item,
.reference-item,
[class*='timeline'] .experience-item,
[class*='timeline'] .certification-item,
[class*='timeline'] .education-item,
.experience-list,
.education-list,
.projects-list,
.certifications-list,
[class*='timeline'],
[class*='-section'],
section,
.section,
.content-section,
.sidebar-section,
.re-section,
.eel-section,
.vhe-section,
.vre-section {
  page-break-inside: auto !important;
  break-inside: auto !important;
}

/* Descriptions and list bullets may continue on the next page */
.experience-item .description,
.education-item .description,
.project-item .description,
.certification-item .description,
.experience-item li,
.project-item li,
.education-item li,
.description ul,
.description ol {
  page-break-inside: auto !important;
  break-inside: auto !important;
}

/* Compact units — keep together */
h1,
.name,
.header-name,
h2,
.section-title,
.sidebar-section-title,
[class*='-heading'],
.experience-header,
.education-header,
.project-header,
.duration,
.year,
.date,
.hobby-item,
.contact-item,
.contact-list > li {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
  break-after: avoid-page;
  page-break-after: avoid;
}

/* Timeline markers — small; avoid splitting the glyph only */
[class*='timeline'] .experience-item::before,
[class*='timeline'] .experience-item::after,
[class*='timeline'] .certification-item::before {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}
`;

/** Browser print fallback — same rules inside @media print. */
export const PDF_PAGINATION_PRINT_CSS = `@media print {\n${PDF_PAGINATION_EXPORT_CSS}\n}`;
