import {

  extractPlainTextFromHtml,

  formatProseIntoParagraphs,

  groupSentencesIntoParagraphs,

  normalizeProseWhitespace,

  planParagraphSizes,

  proseNeedsParagraphFormatting,

  splitIntoSentences,

  injectParagraphFormattingIntoHtml,

  buildFormattedParagraphHtml,

} from '@/lib/resume-builder/paragraph-formatting-engine';



describe('paragraph formatting engine', () => {

  it('splits sentences without breaking decimals or abbreviations', () => {

    const text =

      'Dr. Smith leads platform work at U.S. Corp. Version 3.14 shipped on time. He mentors engineers across three teams.';

    const sentences = splitIntoSentences(text);

    expect(sentences).toHaveLength(3);

    expect(sentences[0]).toContain('Dr. Smith');

    expect(sentences[0]).toContain('U.S. Corp.');

    expect(sentences[1]).toContain('3.14');

  });



  it('groups sentences into 2–4 sentence paragraphs', () => {

    const sentences = [

      'Sentence one here.',

      'Sentence two here.',

      'Sentence three here.',

      'Sentence four here.',

      'Sentence five here.',

    ];

    expect(planParagraphSizes(4)).toEqual([4]);

    expect(planParagraphSizes(5)).toEqual([3, 2]);

    expect(planParagraphSizes(7)).toEqual([4, 3]);

    expect(groupSentencesIntoParagraphs(sentences)).toHaveLength(2);

    expect(groupSentencesIntoParagraphs(sentences)[0].split(/[.!?]/).length - 1).toBe(3);

  });



  it('preserves all words when regrouping paragraphs', () => {

    const text =

      'Results-driven engineer with twelve years of experience. Built reliable APIs and data pipelines. Led cross-functional delivery in fintech. Mentored junior developers and improved release quality. Delivered measurable cost savings for the business.';

    const paragraphs = formatProseIntoParagraphs(text);

    const joined = normalizeProseWhitespace(paragraphs.join(' '));

    expect(joined).toBe(normalizeProseWhitespace(text));

    expect(paragraphs.length).toBeGreaterThan(1);

  });



  it('does not split single-sentence short prose', () => {

    const text = 'Full-stack developer focused on React and Node.';

    expect(formatProseIntoParagraphs(text)).toEqual([text]);

    expect(proseNeedsParagraphFormatting(text)).toBe(false);

  });



  it('never emits narrower ch max-width on paragraphs', () => {

    const html = buildFormattedParagraphHtml([

      'Results-driven engineer with twelve years of experience building platforms.',

      'Mentored teams and delivered measurable outcomes across fintech products.',

    ]);

    expect(html).not.toMatch(/max-width\s*:\s*min\(/i);

    expect(html).not.toMatch(/\d+ch/i);

    expect(html).toContain('pfe-paragraph');

  });



  it('formats summary HTML into full-width multi-paragraph prose', () => {

    const summary =

      'Sentence one with enough length to qualify. Sentence two with enough length to qualify. Sentence three with enough length to qualify. Sentence four with enough length to qualify. Sentence five with enough length to qualify.';

    const html = `

      <div class="resume-container sce-resume">

        <main>

          <p class="summary-text">${summary}</p>

        </main>

      </div>

    `;

    const result = injectParagraphFormattingIntoHtml(html, { htmlTemplate: '<main>' });

    expect(result).toContain('pfe-prose');

    expect(result).toContain('pfe-paragraph');

    expect((result.match(/class="pfe-paragraph"/g) || []).length).toBeGreaterThanOrEqual(1);

    expect(result).toContain('max-width: none !important');

    expect(result).toContain('width: 100% !important');

    expect(result).not.toMatch(/style="[^"]*max-width:\s*min\(100%,\s*\d+ch\)/i);

    expect(extractPlainTextFromHtml(result)).toBe(normalizeProseWhitespace(summary));

  });

});


