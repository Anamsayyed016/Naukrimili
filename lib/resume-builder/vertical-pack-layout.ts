/**
 * Shared content-aware vertical packing for resume layout shells.
 * Used by Live Preview (screen) and PDF export (print).
 *
 * Mirrors the blush-executive-watercolor "Content-aware vertical packing" pattern
 * across all templates without per-template duplication.
 *
 * Does NOT change typography, colors, spacing tokens, or borders — only resets
 * artificial full-page height, equal-height column stretch, and timeline rails
 * that reserve empty vertical space.
 */

/** Layout packing rules scoped under `.resume-container`. */
export const VERTICAL_PACK_LAYOUT_CSS = `
/* Root shell — content-driven height, never forced 297mm */
.resume-container,
.resume-container[class*='-'],
.resume-container[class*='-resume'] {
  min-height: auto !important;
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}

/* Flex / grid wrappers — disable equal-height stretch (primary blank-region fix) */
.resume-container .resume-wrapper,
.resume-container .resume-body,
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
.resume-container [class*='-main'],
.resume-container [class*='-sidebar'],
.resume-container main[class*='-'],
.resume-container aside[class*='-'],
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
.resume-container .main-panel,
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
}

/* Timeline rails — drop min-height:100% that inherits forced page-height parents */
.resume-container [class*='-timeline-line'],
.resume-container [class*='timeline-line'],
.resume-container [class*='timeline-accent'],
.resume-container [class*='-timeline-accent'] {
  min-height: auto !important;
  max-height: none !important;
}

/* Trailing sections — collapse bottom gap before page edge */
.resume-container .content-section:last-child,
.resume-container .sidebar-section:last-child,
.resume-container .main-content > section:last-child,
.resume-container .sidebar > section:last-child,
.resume-container .sidebar > .sidebar-panel:last-child,
.resume-container [class*='-main'] > [class*='-section']:last-child,
.resume-container [class*='-sidebar'] > [class*='-section']:last-child,
.resume-container [class*='-side'] > section:last-child,
.resume-container [class*='-section']:last-of-type {
  margin-bottom: 0 !important;
}

/* Prevent flex auto-margin from isolating trailing blocks */
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
`;
