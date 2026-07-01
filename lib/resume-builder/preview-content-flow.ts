/**
 * Live Preview only — natural text flow for long autofill content.
 * Injected in LivePreview iframe; does not modify templates or export pipeline.
 *
 * Preserves all content: no truncation, no font/size changes.
 * Scoped under `.resume-container` so template layout tokens stay intact.
 */

export const PREVIEW_CONTENT_FLOW_CSS = `
/* ── Long content flow (preview only) ── */

.resume-container {
  overflow: visible !important;
  height: auto !important;
  min-height: auto !important;
  max-height: none !important;
}

.resume-container .summary-text,
.resume-container [class*="summary-text"],
.resume-container .professional-summary,
.resume-container .objective-text {
  white-space: pre-line !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  overflow: visible !important;
  max-height: none !important;
}

.resume-container .experience-item .description,
.resume-container .education-item .description,
.resume-container .project-item .description,
.resume-container .certification-item .description,
.resume-container .achievement-item .description,
.resume-container .reference-item .description {
  white-space: pre-line !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  overflow: visible !important;
  max-height: none !important;
}

.resume-container .experience-item,
.resume-container .education-item,
.resume-container .project-item,
.resume-container .certification-item,
.resume-container .achievement-item,
.resume-container .reference-item,
.resume-container section,
.resume-container .content-section,
.resume-container .sidebar-section,
.resume-container [class*="-section"]:not([class*="section-title"]) {
  overflow: visible !important;
  max-height: none !important;
  min-height: auto !important;
  height: auto !important;
}

.resume-container [class*="-body"]:not(body):not(html),
.resume-container .resume-body,
.resume-container .resume-wrapper,
.resume-container main,
.resume-container aside {
  overflow: visible !important;
  min-height: auto !important;
  height: auto !important;
  max-height: none !important;
}

.resume-container .description ul,
.resume-container .experience-list ul,
.resume-container .education-list ul,
.resume-container .projects-list ul {
  overflow: visible !important;
  max-height: none !important;
  list-style-position: outside !important;
}

.resume-container .description li,
.resume-container .experience-item li,
.resume-container .education-item li,
.resume-container .project-item li {
  white-space: pre-line !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  overflow: visible !important;
  max-height: none !important;
}
`;
