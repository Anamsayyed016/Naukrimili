import { orchestrateResumeParse } from '../lib/resume-parser/custom/integration';
import { prepareResumeTextForParsing } from '../lib/resume-parser/resume-document-analysis';
import { BENCHMARK_FIXTURES } from '../lib/resume-parser/custom/benchmark';

const raw = BENCHMARK_FIXTURES[0].rawText || '';
const prepared = prepareResumeTextForParsing(raw);

const result = await orchestrateResumeParse(
  {
    normalizedText: prepared.text,
    documentProfile: prepared.profile,
    resumeIdentifier: 'smoke-orchestrator',
  },
  { configOverride: { enabled: false, mode: 'off' } }
);

console.log('smoke-parser-orchestrator: OK');
console.log(
  JSON.stringify(
    {
      selectedParser: result.selectedParser,
      confidence: result.metrics.primary.confidence,
      mode: result.metrics.mode,
      hasEmail: Boolean(result.data.email),
      orchestratorVersion: result.metrics.orchestratorVersion,
    },
    null,
    2
  )
);
