/**
 * Centralized PDF / print pagination overrides.
 * Export-only — used by resume-export.ts (Puppeteer) and FinalizeStep (browser print).
 * Never import from LivePreview (screen preview must stay unchanged).
 *
 * Selectors are scoped under `.resume-container` so specificity beats template-level
 * `min-height: var(--page-height) !important` and `align-items: stretch !important`.
 */

/** Core pagination + print-safe rules (injected into export HTML; applies under print emulation). */
export const PDF_PAGINATION_EXPORT_CSS = `
/* ── PDF export pagination (scoped — beats template !important) ── */

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

/* Root shell — content-driven height, never forced 297mm */
.resume-container,
.resume-container[class*='-'],
.resume-container[class*='-resume'] {
  min-height: auto !important;
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
  page-break-inside: auto !important;
  break-inside: auto !important;
}

/* Flex / grid wrappers — disable equal-height stretch (primary blank-page fix) */
.resume-container .resume-wrapper,
.resume-container [class*='-body']:not(body):not(html),
.resume-container [class*='-layout'],
.resume-container [class*='-columns'],
.resume-container [class*='-shell'],
.resume-container [class*='-frame'],
.resume-container [class*='-inner'],
.resume-container [class*='col-main'],
.resume-container [class*='col-side'],
.resume-container [class*='col-left'],
.resume-container [class*='col-right'],
.resume-container .re-body,
.resume-container .eel-body,
.resume-container .vre-body,
.resume-container .tm-body,
.resume-container .mpe-body,
.resume-container .fge-body,
.resume-container .olx-body,
.resume-container .ole-body,
.resume-container .vhe-body,
.resume-container .boardroom-body,
.resume-container .graphite-body,
.resume-container .ebd-body,
.resume-container .esl-body,
.resume-container .eel-col-main,
.resume-container .eel-col-side,
.resume-container .re-main,
.resume-container .re-sidebar,
.resume-container .main-content,
.resume-container .main-column,
.resume-container .content-column,
.resume-container .sidebar,
.resume-container .side-column,
.resume-container .content,
.resume-container .column-inner,
.resume-container [class*='sidebar-inner'],
.resume-container [class*='main-inner'] {
  align-items: flex-start !important;
  align-self: auto !important;
  justify-content: flex-start !important;
  min-height: auto !important;
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
  page-break-inside: auto !important;
  break-inside: auto !important;
}

/* Trailing sections — collapse bottom gap before page edge */
.resume-container .content-section:last-child,
.resume-container .sidebar-section:last-child,
.resume-container .main-content > section:last-child,
.resume-container .sidebar > section:last-child,
.resume-container .sidebar > .sidebar-panel:last-child,
.resume-container [class*='-section']:last-of-type {
  margin-bottom: 0 !important;
  padding-bottom: 0 !important;
}

/* Prevent flex auto-margin from isolating Interests / trailing blocks */
.resume-container .main-content > section,
.resume-container .sidebar > section,
.resume-container .main-content > [class*='-section'],
.resume-container .sidebar > [class*='-section'],
.resume-container .main-content > .content-section,
.resume-container .sidebar > .sidebar-section {
  margin-top: 0 !important;
  flex-grow: 0 !important;
}

/* Decorative / frame layers — must not force full page height */
.resume-container [class*='-frame'],
.resume-container [class*='frame-art'],
.resume-container [class*='bg-architecture'],
.resume-container [class*='-mesh'],
.resume-container [class*='-glow'],
.resume-container [class*='body-rail'],
.resume-container [class*='side-accent'],
.resume-container .eel-luxury-frame,
.resume-container .eel-bg-architecture,
.resume-container .re-mesh,
.resume-container .re-glow,
.resume-container .vre-sidebar-glass {
  min-height: auto !important;
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}

/* CSS grid regions */
.resume-container .skills-list,
.resume-container .skills-rings,
.resume-container [class*='project-grid'],
.resume-container [class*='edu-grid'],
.resume-container [class*='project-showcase'],
.resume-container .psp-skills-progress .skills-list {
  page-break-inside: auto !important;
  break-inside: auto !important;
}

.resume-container .psp-skill-item,
.resume-container .psp-language-item {
  min-height: auto !important;
  page-break-inside: auto !important;
  break-inside: auto !important;
}

/* Sections & cards — allow natural splits across pages */
.resume-container .experience-item,
.resume-container .education-item,
.resume-container .project-item,
.resume-container .certification-item,
.resume-container .achievement-item,
.resume-container .reference-item,
.resume-container [class*='timeline'] .experience-item,
.resume-container [class*='timeline'] .certification-item,
.resume-container [class*='timeline'] .education-item,
.resume-container [class*='timeline'] .project-item,
.resume-container .experience-list,
.resume-container .education-list,
.resume-container .projects-list,
.resume-container .certifications-list,
.resume-container .achievements-list,
.resume-container [class*='timeline'],
.resume-container [class*='-section'],
.resume-container section,
.resume-container .section,
.resume-container .content-section,
.resume-container .sidebar-section,
.resume-container .re-section,
.resume-container .eel-section,
.resume-container .vhe-section,
.resume-container .vre-section,
.resume-container .ebd-section,
.resume-container .mpe-section {
  page-break-inside: auto !important;
  break-inside: auto !important;
  overflow: visible !important;
}

/* Descriptions & bullets — continue on next page */
.resume-container .experience-item .description,
.resume-container .education-item .description,
.resume-container .project-item .description,
.resume-container .certification-item .description,
.resume-container .achievement-item .description,
.resume-container .experience-item li,
.resume-container .project-item li,
.resume-container .education-item li,
.resume-container .achievement-item li,
.resume-container .description ul,
.resume-container .description ol,
.resume-container .description p {
  page-break-inside: auto !important;
  break-inside: auto !important;
  orphans: 2;
  widows: 2;
}

/* Section titles — keep with following content */
.resume-container h2,
.resume-container .section-title,
.resume-container .sidebar-section-title,
.resume-container [class*='-heading'] {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
  page-break-after: avoid !important;
  break-after: avoid-page !important;
}

/* Job / role title only — first content line stays attached; body may split */
.resume-container .experience-item h3,
.resume-container .education-item h3,
.resume-container .project-item h3,
.resume-container .certification-item h3,
.resume-container .achievement-item h3 {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
  page-break-after: avoid !important;
  break-after: avoid-page !important;
}

/* Small atomic units */
.resume-container h1,
.resume-container .name,
.resume-container .header-name,
.resume-container .hobby-item,
.resume-container .contact-item,
.resume-container .contact-list > li {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}

/* Timeline glyphs — do not split pseudo-elements */
.resume-container [class*='timeline'] .experience-item::before,
.resume-container [class*='timeline'] .experience-item::after,
.resume-container [class*='timeline'] .certification-item::before,
.resume-container [class*='timeline'] .project-item::before {
  page-break-inside: avoid !important;
  break-inside: avoid !important;
}

/* ── Print-safe rendering (export only — neutralize Chromium PDF artifacts) ── */
.resume-container [class*='glass'],
.resume-container [class*='-glow'],
.resume-container [class*='-mesh'],
.resume-container [class*='frame-art'],
.resume-container [class*='bg-architecture'] {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.resume-container [class*='-glow'],
.resume-container [class*='frame-art'] {
  filter: none !important;
}

.resume-container * {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

/* Reinforce when Puppeteer emulateMediaType('print') — beats template @media print min-heights */
@media print {
  .resume-container,
  .resume-container[class*='-'],
  .resume-container .resume-wrapper,
  .resume-container [class*='-body']:not(body):not(html),
  .resume-container [class*='-shell'],
  .resume-container .sidebar,
  .resume-container .main-content,
  .resume-container .content {
    min-height: auto !important;
    height: auto !important;
    max-height: none !important;
    align-items: flex-start !important;
  }

  .resume-container .experience-item,
  .resume-container .project-item,
  .resume-container .education-item,
  .resume-container .achievement-item,
  .resume-container [class*='-section'],
  .resume-container .content-section {
    page-break-inside: auto !important;
    break-inside: auto !important;
  }
}
`;

/** Browser print fallback — same rules inside @media print. */
export const PDF_PAGINATION_PRINT_CSS = `@media print {\n${PDF_PAGINATION_EXPORT_CSS}\n}`;
