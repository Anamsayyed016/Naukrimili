import {
  orchestrateResumeParse,
  resolveOrchestratorConfig,
  getOrchestratorConfig,
} from '@/lib/resume-parser/custom/integration';
import { prepareResumeTextForParsing } from '@/lib/resume-parser/resume-document-analysis';
import { BENCHMARK_FIXTURES } from '@/lib/resume-parser/custom/benchmark';

describe('parser orchestrator (phase 1)', () => {
  const rawText = BENCHMARK_FIXTURES[0].rawText || '';
  const prepared = prepareResumeTextForParsing(rawText);

  it('defaults to off mode — legacy chain only', () => {
    const config = getOrchestratorConfig();
    expect(config.enabled).toBe(false);
    expect(config.mode).toBe('off');
  });

  it('returns ExtractedResumeData from legacy mode', async () => {
    const result = await orchestrateResumeParse(
      {
        normalizedText: prepared.text,
        documentProfile: prepared.profile,
        resumeIdentifier: 'test-dev-resume',
      },
      { configOverride: { enabled: false, mode: 'off' } }
    );

    expect(result.data).toBeDefined();
    expect(result.data.fullName !== undefined || result.data.email !== undefined).toBe(true);
    expect(result.selectedParser).toBeTruthy();
    expect(result.metrics.primary.parserName).toBe(result.selectedParser);
    expect(result.metrics.orchestratorVersion).toBeTruthy();
  });

  it('shadow mode runs custom silently and returns legacy output', async () => {
    const result = await orchestrateResumeParse(
      {
        normalizedText: prepared.text,
        documentProfile: prepared.profile,
      },
      {
        configOverride: {
          enabled: true,
          mode: 'shadow',
          confidenceThreshold: 50,
          qualityThreshold: 50,
        },
      }
    );

    expect(result.selectedParser).not.toBe('custom');
    expect(result.metrics.mode).toBe('shadow');
    if (result.metrics.shadow) {
      expect(result.metrics.shadow.parserName).toBe('custom');
    }
  });

  it('primary mode falls back when quality gates fail', async () => {
    const result = await orchestrateResumeParse(
      {
        normalizedText: prepared.text,
        documentProfile: prepared.profile,
      },
      {
        configOverride: {
          enabled: true,
          mode: 'primary',
          confidenceThreshold: 99,
          qualityThreshold: 99,
        },
      }
    );

    expect(result.selectedParser).not.toBe('custom');
    expect(result.metrics.primary.fallbackTriggered).toBe(true);
  });

  it('does not call mapExtractedToUploadProfile', async () => {
    const result = await orchestrateResumeParse(
      { normalizedText: prepared.text },
      { configOverride: { enabled: false, mode: 'off' } }
    );

    expect((result.data as { builderFormData?: unknown }).builderFormData).toBeUndefined();
    expect((result.data as { name?: string }).name).toBeUndefined();
  });
});
