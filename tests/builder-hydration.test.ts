import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isImportFresherThanDraft,
  shouldForceImportHydration,
  builderFormChecksum,
} from '../lib/resume-builder/builder-hydration';

describe('builder-hydration', () => {
  it('shouldForceImportHydration when prefill or pending session', () => {
    assert.equal(
      shouldForceImportHydration({ shouldPrefill: true, sourceImport: false }),
      true
    );
    assert.equal(
      shouldForceImportHydration({ shouldPrefill: false, sourceImport: true }),
      true
    );
  });

  it('isImportFresherThanDraft respects user edits after import', () => {
    const meta = { importId: 'a', importedAt: 1000, source: 'upload' as const };
    const draft = { _userEdited: true, _userEditedAt: 2000, summary: 'edited' };
    assert.equal(isImportFresherThanDraft(draft, meta), false);

    const staleDraft = { summary: 'old', _importedAt: 500 };
    assert.equal(isImportFresherThanDraft(staleDraft, meta), true);
  });

  it('builderFormChecksum is stable for same payload', () => {
    const data = { firstName: 'Ada', experience: [{ title: 'Eng' }] };
    assert.equal(builderFormChecksum(data), builderFormChecksum({ ...data }));
  });
});
