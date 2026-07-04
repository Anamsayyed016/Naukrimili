/**
 * Canonical Builder Mapping pipeline orchestrator.
 *
 * Parser / upload profile → Canonical Nodes → Validation → Builder Mapping → Recovery → Schema Extension
 */

import { ingestCanonicalNodes } from './ingest';
import { validateCanonicalNodes } from './validate';
import { mapCanonicalNodesToBuilder } from './map-to-builder';
import { recoverBuilderFromNodes } from './recover';
import { extendBuilderSchema } from './extend-schema';
import type { CanonicalMappingResult, CanonicalMappingReport } from './types';
import { CANONICAL_MAPPING_VERSION } from './types';
import { applyBuilderCompatibility } from '@/lib/resume-builder/builder-compatibility';

export interface RunCanonicalMappingOptions {
  importProfile: Record<string, unknown>;
  builderDraft: Record<string, unknown>;
}

function emptyReport(): CanonicalMappingReport {
  return {
    matched: [],
    recovered: [],
    missing: [],
    rejected: [],
    repaired: [],
    dynamicSections: [],
  };
}

export function runCanonicalBuilderMapping(
  options: RunCanonicalMappingOptions
): CanonicalMappingResult {
  const report = emptyReport();

  const rawNodes = ingestCanonicalNodes(options.importProfile);
  const { nodes, rejected, repaired } = validateCanonicalNodes(rawNodes);
  report.rejected.push(...rejected);
  report.repaired.push(...repaired);

  const { builder: mapped, matched } = mapCanonicalNodesToBuilder(nodes, options.builderDraft);
  report.matched.push(...matched);

  const recovered = recoverBuilderFromNodes(mapped, nodes, report);
  const extended = extendBuilderSchema(recovered, nodes);
  const { builder: compatibleBuilder, ledger } = applyBuilderCompatibility(
    extended,
    options.importProfile,
    nodes
  );
  report.ledger = ledger;

  if (compatibleBuilder.extendedSections && typeof compatibleBuilder.extendedSections === 'object') {
    const ext = compatibleBuilder.extendedSections as { extraSections?: Array<{ heading: string }> };
    report.dynamicSections = (ext.extraSections || []).map((s) => s.heading);
  }

  if (process.env.NODE_ENV === 'development' && (report.rejected.length || report.recovered.length)) {
    console.log('[canonical-builder-mapping]', {
      nodes: nodes.length,
      matched: report.matched.length,
      recovered: report.recovered.length,
      rejected: report.rejected.length,
      repaired: report.repaired.length,
      ledger,
    });
  }

  return {
    version: CANONICAL_MAPPING_VERSION,
    nodes,
    builder: compatibleBuilder,
    report,
  };
}

export { ingestCanonicalNodes } from './ingest';
export { validateCanonicalNodes } from './validate';
export { mapCanonicalNodesToBuilder } from './map-to-builder';
export { recoverBuilderFromNodes } from './recover';
export { extendBuilderSchema } from './extend-schema';
export * from './types';
export * from './dictionary';
