/**
 * Production Parser Orchestrator — public exports (Phase 1, not wired to upload).
 */

export {
  orchestrateResumeParse,
  PARSER_ORCHESTRATOR_VERSION,
} from './parser-orchestrator';

export {
  getOrchestratorConfig,
  resolveOrchestratorConfig,
  isCustomParserActive,
  ORCHESTRATOR_ENV,
} from './config';

export {
  runCustomParserAdapter,
  runAffindaAdapter,
  runApilayerAdapter,
  runHybridAdapter,
  runLegacyProductionParser,
  hybridResumeDataToExtracted,
  passesCustomQualityGates,
} from './adapter';

export {
  createParserRunMetrics,
  buildOrchestratorMetrics,
} from './metrics';

export { logOrchestratorMetrics } from './production-log';

export type {
  OrchestratorInput,
  OrchestratorResult,
  OrchestratorOptions,
  ParserAdapterResult,
  ParserId,
  CustomParserMode,
  OrchestratorConfig,
  ParserRunMetrics,
  OrchestratorMetrics,
} from './types';
