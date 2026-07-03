import { BENCHMARK_FIXTURES } from '../lib/resume-parser/custom/benchmark';
import { compareExperience } from '../lib/resume-parser/custom/benchmark/compare/experience';
import { runCustomParserPipeline } from '../lib/resume-parser/custom/reliability/pipeline';

const f = BENCHMARK_FIXTURES[0];
const r = runCustomParserPipeline(f.rawText);
const report = compareExperience(f.groundTruth, r.validation.resume);

console.log(JSON.stringify({
  actual: r.validation.resume.experience,
  expected: f.groundTruth.experience,
  accuracy: report.accuracy,
  missing: report.missingEntries,
  extra: report.extraEntries,
  fields: report.entries.flatMap((e) =>
    e.fieldComparisons.map((fc) => ({
      field: fc.field,
      idx: fc.index,
      expected: fc.expected,
      actual: fc.actual,
      status: fc.status,
    }))
  ),
}, null, 2));
