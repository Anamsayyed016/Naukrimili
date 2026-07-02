import { runReliabilitySuite } from '../lib/resume-parser/custom/reliability';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const suite = runReliabilitySuite({
  deterministic: true,
  stressScales: [100],
  includeHumanReports: true,
});

assert(suite.regression.totalCases > 0, 'regression cases run');
assert(suite.stress[0].sampleCount === 100, 'stress scale 100');
assert(suite.stress[0].failureRate < 5, 'failure rate under 5%');
assert(suite.compatibility.cases.length > 0, 'compatibility cases');
assert(suite.readiness.score > 0, 'readiness score computed');
assert(suite.humanReport.includes('Production Readiness'), 'human report');

console.log('smoke-reliability: OK');
console.log(
  JSON.stringify(
    {
      readiness: suite.readiness.score,
      ready: suite.readiness.readyForProduction,
      regressionPass: suite.regression.passRate,
      stressAvgMs: suite.stress[0].parseTimeMs.average,
      failureRate: suite.stress[0].failureRate,
      compatibilityPass: suite.compatibility.passRate,
      blockers: suite.readiness.blockers.length,
    },
    null,
    2
  )
);
