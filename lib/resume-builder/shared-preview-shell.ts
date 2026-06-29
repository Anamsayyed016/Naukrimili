/**
 * Shared A4 document shell for Live Preview and PDF/HTML export.
 * Single source of truth — do not duplicate these rules elsewhere.
 *
 * Locks html, body, and .resume-container to 794px with margin: 0 so the
 * resume fills the printable width (no centered gutter when the doc is wider).
 */

/** A4 printable width at 96 DPI — keep in sync with preview-scale.ts */
export const A4_SHELL_WIDTH_PX = 794;

/** Canonical A4 shell CSS consumed by LivePreview and resume-export. */
export const SHARED_A4_SHELL_CSS = `
html {
  margin: 0 !important;
  padding: 0 !important;
  width: ${A4_SHELL_WIDTH_PX}px !important;
  max-width: ${A4_SHELL_WIDTH_PX}px !important;
  min-width: ${A4_SHELL_WIDTH_PX}px !important;
  height: auto !important;
  background-color: #ffffff !important;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0 !important;
  padding: 0 !important;
  background: white !important;
  width: ${A4_SHELL_WIDTH_PX}px !important;
  max-width: ${A4_SHELL_WIDTH_PX}px !important;
  min-width: ${A4_SHELL_WIDTH_PX}px !important;
  height: auto !important;
  min-height: auto !important;
  overflow-x: hidden !important;
  overflow-y: visible !important;
  transform: none !important;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.resume-container {
  width: ${A4_SHELL_WIDTH_PX}px !important;
  max-width: ${A4_SHELL_WIDTH_PX}px !important;
  min-width: ${A4_SHELL_WIDTH_PX}px !important;
  min-height: auto !important;
  height: auto !important;
  max-height: none !important;
  margin: 0 !important;
  box-sizing: border-box !important;
  position: relative !important;
  overflow: visible !important;
  transform: none !important;
}

body > *,
html > * {
  transform: none !important;
}
`;
