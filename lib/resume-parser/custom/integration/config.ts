/**
 * Orchestrator feature flags — isolated config, disabled by default.
 *
 * NOT wired to ultimate-upload in Phase 1.
 */

export type CustomParserMode = 'off' | 'shadow' | 'primary' | 'fallback';

export interface OrchestratorConfig {
  enabled: boolean;
  mode: CustomParserMode;
  confidenceThreshold: number;
  qualityThreshold: number;
  /** Minimum identity section confidence for primary mode acceptance. */
  minIdentityConfidence: number;
  /** Minimum experience section confidence for primary mode acceptance. */
  minExperienceConfidence: number;
}

export const ORCHESTRATOR_ENV = {
  ENABLED: 'CUSTOM_PARSER_ENABLED',
  MODE: 'CUSTOM_PARSER_MODE',
  CONFIDENCE_THRESHOLD: 'CUSTOM_PARSER_CONFIDENCE_THRESHOLD',
  QUALITY_THRESHOLD: 'CUSTOM_PARSER_QUALITY_THRESHOLD',
} as const;

const DEFAULT_CONFIG: OrchestratorConfig = {
  enabled: false,
  mode: 'off',
  confidenceThreshold: 70,
  qualityThreshold: 70,
  minIdentityConfidence: 50,
  minExperienceConfidence: 45,
};

function parseMode(raw: string | undefined): CustomParserMode {
  const v = (raw || '').trim().toLowerCase();
  if (v === 'shadow' || v === 'primary' || v === 'fallback') return v;
  return 'off';
}

function parseBool(raw: string | undefined): boolean {
  if (!raw) return false;
  const v = raw.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

function parseThreshold(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Read orchestrator config from environment. Defaults: disabled, mode=off. */
export function getOrchestratorConfig(): OrchestratorConfig {
  const enabled = parseBool(process.env[ORCHESTRATOR_ENV.ENABLED]);
  let mode = parseMode(process.env[ORCHESTRATOR_ENV.MODE]);

  if (!enabled) {
    mode = 'off';
  } else if (mode === 'off') {
    mode = 'primary';
  }

  return {
    enabled,
    mode,
    confidenceThreshold: parseThreshold(
      process.env[ORCHESTRATOR_ENV.CONFIDENCE_THRESHOLD],
      DEFAULT_CONFIG.confidenceThreshold
    ),
    qualityThreshold: parseThreshold(
      process.env[ORCHESTRATOR_ENV.QUALITY_THRESHOLD],
      DEFAULT_CONFIG.qualityThreshold
    ),
    minIdentityConfidence: DEFAULT_CONFIG.minIdentityConfidence,
    minExperienceConfidence: DEFAULT_CONFIG.minExperienceConfidence,
  };
}

export function resolveOrchestratorConfig(
  override?: Partial<OrchestratorConfig>
): OrchestratorConfig {
  return { ...getOrchestratorConfig(), ...override };
}

export function isCustomParserActive(config: OrchestratorConfig): boolean {
  return config.enabled && config.mode !== 'off' && config.mode !== 'fallback';
}
