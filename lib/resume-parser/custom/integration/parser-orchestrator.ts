/**
 * Production Parser Orchestrator — centralized parser selection.
 *
 * Returns ExtractedResumeData only — no normalize, validate downstream, or form mapping.
 * With deferProductionFallback, production upload runs the full legacy chain on fallback.
 */

import { resolveOrchestratorConfig } from './config';
import {
  passesCustomQualityGates,
  runCustomParserAdapter,
  runLegacyProductionParser,
} from './adapter';
import { buildOrchestratorMetrics, createParserRunMetrics } from './metrics';
import type {
  OrchestratorInput,
  OrchestratorOptions,
  OrchestratorResult,
  ParserAdapterResult,
} from './types';
import { PARSER_ORCHESTRATOR_VERSION } from './types';

function adapterToMetrics(
  result: ParserAdapterResult,
  input: OrchestratorInput,
  extra?: { fallbackTriggered?: boolean; fallbackReason?: string }
) {
  return createParserRunMetrics({
    parserName: result.parserId,
    parserVersion: result.parserVersion,
    executionTimeMs: result.executionTimeMs,
    confidence: result.confidence,
    resumeQuality: result.resumeQuality,
    sectionScores: result.sectionScores,
    resumeIdentifier: input.resumeIdentifier,
    fallbackTriggered: extra?.fallbackTriggered,
    fallbackReason: extra?.fallbackReason,
  });
}

function deferredProductionMetrics(
  input: OrchestratorInput,
  reason: string,
  executionTimeMs: number
) {
  return createParserRunMetrics({
    parserName: 'text-recovery',
    parserVersion: 'production-deferred',
    executionTimeMs,
    confidence: 0,
    resumeQuality: 0,
    resumeIdentifier: input.resumeIdentifier,
    fallbackTriggered: true,
    fallbackReason: reason,
  });
}

async function runShadowCustom(
  input: OrchestratorInput
): Promise<ParserAdapterResult | null> {
  try {
    return await runCustomParserAdapter(input);
  } catch {
    return null;
  }
}

function buildDeferredResult(input: {
  config: ReturnType<typeof resolveOrchestratorConfig>;
  configSnapshot: OrchestratorResult['metrics']['configSnapshot'];
  t0: number;
  input: OrchestratorInput;
  fallbackReason: string;
  shadow?: ParserAdapterResult;
  customAttempt?: ParserAdapterResult | null;
}): OrchestratorResult {
  const primaryMetrics =
    input.customAttempt != null
      ? adapterToMetrics(input.customAttempt, input.input, {
          fallbackTriggered: true,
          fallbackReason: input.fallbackReason,
        })
      : deferredProductionMetrics(input.input, input.fallbackReason, performance.now() - input.t0);

  const shadowMetrics = input.shadow
    ? adapterToMetrics(input.shadow, input.input)
    : undefined;

  const metrics = buildOrchestratorMetrics({
    mode: input.config.mode,
    selectedParser: 'production-deferred',
    totalExecutionTimeMs: performance.now() - input.t0,
    primary: primaryMetrics,
    shadow: shadowMetrics,
    config: input.configSnapshot,
  });

  return {
    data: null,
    selectedParser: 'production-deferred',
    config: input.config,
    metrics,
    deferToProductionParser: true,
    fallbackReason: input.fallbackReason,
  };
}

/**
 * Select and execute parser(s) per feature-flag mode.
 * Default: legacy production chain only (flags disabled).
 */
export async function orchestrateResumeParse(
  input: OrchestratorInput,
  options?: OrchestratorOptions
): Promise<OrchestratorResult> {
  const t0 = performance.now();
  const config = resolveOrchestratorConfig(options?.configOverride);
  const deferProduction = Boolean(options?.deferProductionFallback);
  const configSnapshot = {
    enabled: config.enabled,
    mode: config.mode,
    confidenceThreshold: config.confidenceThreshold,
    qualityThreshold: config.qualityThreshold,
  };

  let selected: ParserAdapterResult;
  let shadow: ParserAdapterResult | undefined;
  let deferToProductionParser = false;
  let fallbackReason: string | undefined;

  switch (config.mode) {
    case 'shadow': {
      if (deferProduction) {
        shadow = (await runShadowCustom(input)) || undefined;
        return buildDeferredResult({
          config,
          configSnapshot,
          t0,
          input,
          fallbackReason: 'shadow mode — production parser owns response',
          shadow,
        });
      }
      const [legacy, customShadow] = await Promise.all([
        runLegacyProductionParser(input),
        runShadowCustom(input),
      ]);
      selected = legacy;
      shadow = customShadow || undefined;
      break;
    }

    case 'primary': {
      let customResult: ParserAdapterResult | null = null;
      try {
        customResult = await runCustomParserAdapter(input);
      } catch {
        customResult = null;
      }

      if (customResult) {
        const gate = passesCustomQualityGates(
          customResult.confidence,
          customResult.resumeQuality ?? 0,
          customResult.sectionScores,
          config,
          {
            validationErrorCount: customResult.validationErrorCount,
            experienceEntryCount: customResult.data.experience?.length ?? 0,
          }
        );
        if (gate.passed) {
          selected = customResult;
          break;
        }
        fallbackReason = gate.reason || 'custom quality gates failed';
        if (deferProduction) {
          return buildDeferredResult({
            config,
            configSnapshot,
            t0,
            input,
            fallbackReason,
            customAttempt: customResult,
          });
        }
        const legacy = await runLegacyProductionParser(input);
        selected = {
          ...legacy,
          fallbackTriggered: true,
          fallbackReason,
        };
        break;
      }

      fallbackReason = 'custom parser execution failed';
      if (deferProduction) {
        return buildDeferredResult({
          config,
          configSnapshot,
          t0,
          input,
          fallbackReason,
        });
      }
      const legacy = await runLegacyProductionParser(input);
      selected = {
        ...legacy,
        fallbackTriggered: true,
        fallbackReason,
      };
      break;
    }

    case 'off':
    case 'fallback':
    default: {
      if (deferProduction) {
        return buildDeferredResult({
          config,
          configSnapshot,
          t0,
          input,
          fallbackReason: `mode ${config.mode} — production parser owns response`,
        });
      }
      selected = await runLegacyProductionParser(input);
      break;
    }
  }

  const primaryMetrics = adapterToMetrics(selected, input, {
    fallbackTriggered: selected.fallbackTriggered,
    fallbackReason: selected.fallbackReason,
  });

  const shadowMetrics = shadow ? adapterToMetrics(shadow, input) : undefined;

  const metrics = buildOrchestratorMetrics({
    mode: config.mode,
    selectedParser: selected.parserId,
    totalExecutionTimeMs: performance.now() - t0,
    primary: primaryMetrics,
    shadow: shadowMetrics,
    config: configSnapshot,
  });

  return {
    data: selected.data,
    selectedParser: selected.parserId,
    config,
    metrics,
    deferToProductionParser,
    fallbackReason: selected.fallbackReason,
  };
}

export { PARSER_ORCHESTRATOR_VERSION };
