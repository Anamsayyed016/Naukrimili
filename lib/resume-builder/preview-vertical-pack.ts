/**
 * Screen-only vertical packing for Live Preview.
 * Single source injected into the preview iframe — do not duplicate in templates.
 *
 * PDF export uses the same layout core via pdf-pagination-overrides.ts.
 */

import { VERTICAL_PACK_LAYOUT_CSS } from './vertical-pack-layout';

/** Injected after SHARED_A4_SHELL_CSS in LivePreview. */
export const PREVIEW_VERTICAL_PACK_CSS = VERTICAL_PACK_LAYOUT_CSS;
