import {
  runReliabilitySuite,
  runRegressionSuite,
  runStressTest,
  runCompatibilitySuite,
  RELIABILITY_FIXTURE_CATALOG,
  listReliabilityFixtures,
} from '@/lib/resume-parser/custom/reliability';

describe('custom reliability framework', () => {
  it('runs regression for all parser modules', () => {
    const report = runRegressionSuite(RELIABILITY_FIXTURE_CATALOG);
    expect(report.modules.length).toBe(8);
    expect(report.totalCases).toBeGreaterThan(0);
    expect(report.passRate).toBeGreaterThan(0);
  });

  it('runs stress test at scale 100', () => {
    const stress = runStressTest(100);
    expect(stress.sampleCount).toBe(100);
    expect(stress.failureRate).toBeLessThan(5);
    expect(stress.parseTimeMs.average).toBeLessThan(5000);
  });

  it('runs compatibility suite', () => {
    const compat = runCompatibilitySuite();
    expect(compat.cases.length).toBeGreaterThan(0);
    expect(compat.passRate).toBeGreaterThan(0);
  });

  it('runs full reliability suite with reports', () => {
    const suite = runReliabilitySuite({
      deterministic: true,
      stressScales: [100],
    });

    expect(suite.regression).toBeDefined();
    expect(suite.stress).toHaveLength(1);
    expect(suite.compatibility).toBeDefined();
    expect(suite.performance).toBeDefined();
    expect(suite.failures).toBeDefined();
    expect(suite.recovery).toBeDefined();
    expect(suite.readiness.score).toBeGreaterThan(0);
    expect(suite.humanReport).toContain('RELIABILITY SUITE');
  });

  it('lists fixtures by category', () => {
    const unicode = listReliabilityFixtures(['unicode']);
    expect(unicode.some((f) => f.categories.includes('unicode'))).toBe(true);
  });
});
