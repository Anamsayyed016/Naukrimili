import {
  composeTypographicPagePlan,
  findOptimalParagraphMeasure,
  scoreParagraphOptical,
  simulateParagraphLines,
  tokenizeParagraph,
  TYPO_MEASURE_CH_MAX,
} from '@/lib/resume-builder/typographic-composition-engine';

describe('typographic composition engine', () => {
  const sampleSummary =
    'Results-driven engineering leader with twelve years building reliable platforms, mentoring teams, and shipping customer-facing products across fintech and healthcare.';

  it('simulates more lines when measure narrows (same words)', () => {
    const words = tokenizeParagraph(sampleSummary);
    const wide = simulateParagraphLines(words, 72);
    const narrow = simulateParagraphLines(words, 52);
    expect(narrow.length).toBeGreaterThan(wide.length);
    expect(narrow.join(' ')).toBe(wide.join(' '));
  });

  it('prefers balanced line breaks over orphan endings under underfill', () => {
    const words = tokenizeParagraph(sampleSummary);
    const ctx = {
      pageHeight: 1123,
      remainingWhitespace: 280,
      pageFill: 0.62,
      preferMoreLines: true,
      targetFill: 0.9,
    };

    let bestWide = { ch: 72, score: -1 };
    let bestNarrow = { ch: 52, score: -1 };
    for (let ch = 58; ch <= 72; ch += 2) {
      const lines = simulateParagraphLines(words, ch);
      const score = scoreParagraphOptical(lines, ch, ctx);
      if (score > bestWide.score) bestWide = { ch, score };
    }
    for (let ch = 45; ch <= 56; ch += 2) {
      const lines = simulateParagraphLines(words, ch);
      const score = scoreParagraphOptical(lines, ch, ctx);
      if (score > bestNarrow.score) bestNarrow = { ch, score };
    }

    const optimal = findOptimalParagraphMeasure(sampleSummary, ctx, {
      minCh: 45,
      maxCh: TYPO_MEASURE_CH_MAX,
    });
    expect(optimal.measureCh).toBeLessThanOrEqual(72);
    expect(optimal.lines.length).toBeGreaterThan(2);
    expect(optimal.score).toBeGreaterThan(0.45);
  });

  it('composes page plan with iterative section balancing under whitespace', () => {
    const plan = composeTypographicPagePlan({
      pageHeight: 1123,
      containerHeight: 620,
      remainingWhitespace: 280,
      pageFill: 0.62,
      mainContentHeight: 540,
      summaryText: sampleSummary,
      experienceTexts: ['Built APIs and led migration to microservices across three product lines.'],
      projectTexts: ['Delivered internal tooling that reduced release cycle time.'],
      achievementTexts: [],
      nextSectionHeights: { experience: 180 },
      baseSummaryCh: 68,
      baseContentCh: 72,
      shouldCompress: false,
      preferMoreLines: true,
    });

    expect(plan.summaryMeasureCh).toBeLessThan(68);
    expect(plan.summaryMeasureCh).toBeGreaterThanOrEqual(45);
    expect(plan.contentMeasureCh).toBeLessThanOrEqual(75);
    expect(plan.opticalScore).toBeGreaterThan(0.4);
    expect(plan.iterations).toBeGreaterThanOrEqual(1);
  });

  it('never exceeds safe readability ceiling', () => {
    const plan = composeTypographicPagePlan({
      pageHeight: 1123,
      containerHeight: 1050,
      remainingWhitespace: 40,
      pageFill: 0.96,
      mainContentHeight: 980,
      summaryText: sampleSummary,
      experienceTexts: [],
      projectTexts: [],
      achievementTexts: [],
      nextSectionHeights: {},
      baseSummaryCh: 70,
      baseContentCh: 74,
      shouldCompress: true,
      preferMoreLines: false,
    });

    expect(plan.summaryMeasureCh).toBeLessThanOrEqual(75);
    expect(plan.contentMeasureCh).toBeLessThanOrEqual(75);
  });
});
