import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isImportFresherThanDraft,
  shouldForceImportHydration,
  builderFormChecksum,
  ensureBuilderContactFields,
} from '../lib/resume-builder/builder-hydration';
import {
  resolveExperienceDurationForDisplay,
} from '../lib/resume-builder/experience-entry-sync';

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

  it('ensureBuilderContactFields splits fullName for ContactsStep', () => {
    const out = ensureBuilderContactFields({
      fullName: 'Anam Sayyed',
      email: 'a@b.com',
    });
    assert.equal(out.firstName, 'Anam');
    assert.equal(out.lastName, 'Sayyed');
  });

  it('ensureBuilderContactFields rebuilds from fullName when first/last are empty', () => {
    const out = ensureBuilderContactFields({
      fullName: 'Shishupal Singh Yadav',
      firstName: '',
      lastName: '',
      email: 'ssy@example.com',
    });
    assert.equal(out.firstName, 'Shishupal');
    assert.equal(out.lastName, 'Singh Yadav');
  });

  it('resolveExperienceDurationForDisplay prefers dates over stale Present token', () => {
    const past = resolveExperienceDurationForDisplay({
      Duration: 'Present',
      startDate: '2022-07',
      endDate: '2025-04',
      current: false,
    });
    assert.equal(past, '2022-07 - 2025-04');

    const current = resolveExperienceDurationForDisplay({
      Duration: 'Present',
      startDate: '2025-05',
      current: true,
      isCurrent: true,
    });
    assert.equal(current, '2025-05 - Present');
  });

  it('applyRenderSectionIntegrity keeps long company names in experience', async () => {
    const { applyRenderSectionIntegrity } = await import('../lib/resume-builder/section-visibility');
    const experience = [
      {
        company: 'Shivganga Drillers Limited',
        title: 'Senior Manager Corporate HR',
        startDate: '2025-05',
        current: true,
        Duration: '2025-05 - Present',
        description: 'Led HR operations across multiple sites.',
      },
      {
        company: 'Knovea Pharmaceutical Pvt. Ltd (Injectable Division)',
        title: 'Senior Manager – Plant HR Head',
        startDate: '2022-07',
        endDate: '2025-04',
        current: false,
        Duration: '2022-07 - 2025-04',
        description: 'Managed plant HR and industrial relations.',
      },
    ];
    const out = applyRenderSectionIntegrity({
      experience,
      projects: [],
      achievements: [],
    });
    assert.equal(out.experience.length, 2);
    assert.match(String(out.experience[1].Duration || out.experience[1].duration), /2022-07/);
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
