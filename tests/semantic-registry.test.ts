import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifySectionHeading,
  normalizeSemanticHeading,
  buildTextRecoverySectionAliases,
} from '../lib/resume-builder/semantic-registry.ts';
import { routeSectionBodyToBuilder } from '../lib/resume-builder/semantic-routing.ts';
import { renderExtendedBuilderSections } from '../lib/resume-builder/render-extended-sections.ts';

describe('semantic-registry', () => {
  it('routes Professional Highlights to extended bucket not summary', () => {
    const c = classifySectionHeading('Professional Highlights');
    assert.equal(c?.definition.id, 'professional-highlights');
    assert.deepEqual(c?.definition.builderTarget, {
      kind: 'extended',
      field: 'professionalHighlights',
    });
  });

  it('routes Professional Qualification to extended qualifications', () => {
    const c = classifySectionHeading('Professional Qualifications');
    assert.equal(c?.definition.id, 'professional-qualifications');
    assert.equal(c?.definition.builderTarget.kind, 'extended');
  });

  it('routes Strengths to strengths extended field', () => {
    const c = classifySectionHeading('Strengths');
    assert.equal(c?.definition.id, 'strengths');
  });

  it('routes Key Responsibilities to experience body', () => {
    const c = classifySectionHeading('Key Responsibilities');
    assert.equal(c?.definition.builderTarget.kind, 'experience_body');
  });

  it('buildTextRecoverySectionAliases excludes highlights from summary bucket', () => {
    const aliases = buildTextRecoverySectionAliases();
    assert.equal(aliases.summary.includes('professional highlights'), false);
  });
});

describe('semantic-routing', () => {
  it('appends highlights body to professionalHighlights', () => {
    const out = routeSectionBodyToBuilder(
      {},
      'Professional Highlights',
      'Led 3 regional teams.\nReduced costs 12%.',
      80
    );
    const ext = out.extendedSections as { professionalHighlights?: string[] };
    assert.ok((ext?.professionalHighlights?.length ?? 0) > 0);
  });
});

describe('render-extended-sections', () => {
  it('renders dynamic sections in generic HTML', () => {
    const html = renderExtendedBuilderSections({
      professionalHighlights: ['Expanded into 4 new markets'],
      awards: ['Employee of the Year 2024'],
    });
    assert.match(html, /Professional Highlights/);
    assert.match(html, /Expanded into 4 new markets/);
    assert.match(html, /Awards/);
  });
});

describe('normalizeSemanticHeading', () => {
  it('strips trailing punctuation', () => {
    assert.equal(normalizeSemanticHeading('Core Competencies:'), 'core competencies');
  });
});
