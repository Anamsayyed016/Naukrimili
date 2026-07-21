import { DEFAULT_DEMO_PROFILE_IMAGE } from '@/lib/resume-builder/demo-profile-image';
import { buildGallerySampleFormData } from '@/lib/resume-builder/gallery-demo';
import { resolveGalleryInjectOptions } from '@/lib/resume-builder/gallery-preview-render';
import {
  PROFILE_IMAGE_STORAGE_KEY,
  prepareFormDataForResumeRender,
  readPersistedProfileImage,
  shouldMergePersistedProfileImageForRender,
} from '@/lib/resume-builder/profile-image-persistence';
import { injectResumeData } from '@/lib/resume-builder/template-loader';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const USER_PHOTO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function installBrowserStorageMock() {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
  vi.stubGlobal('window', {} as Window);
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('sessionStorage', storage);
  return store;
}

describe('profile image data isolation', () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = installBrowserStorageMock();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not merge persisted photo into gallery demo form data', () => {
    store.set(PROFILE_IMAGE_STORAGE_KEY, USER_PHOTO);
    expect(readPersistedProfileImage()).toBe(USER_PHOTO);
    const demoData = buildGallerySampleFormData('soft-coral-executive');

    expect(shouldMergePersistedProfileImageForRender(demoData)).toBe(false);
    expect(prepareFormDataForResumeRender(demoData).profileImage).toBe(
      DEFAULT_DEMO_PROFILE_IMAGE
    );
  });

  it('merges persisted photo for editor/resume renders', () => {
    store.set(PROFILE_IMAGE_STORAGE_KEY, USER_PHOTO);
    const editorData = { firstName: 'Alex', lastName: 'Reed' };

    expect(shouldMergePersistedProfileImageForRender(editorData)).toBe(true);
    expect(prepareFormDataForResumeRender(editorData).profileImage).toBe(USER_PHOTO);
  });

  it('gallery demo inject ignores global user photo store', () => {
    store.set(PROFILE_IMAGE_STORAGE_KEY, USER_PHOTO);
    const htmlPath = join(
      process.cwd(),
      'public/templates/soft-coral-executive/index.html'
    );
    const html = readFileSync(htmlPath, 'utf8');
    const demoData = buildGallerySampleFormData('soft-coral-executive');
    const injectOptions = resolveGalleryInjectOptions('soft-coral-executive', demoData);

    const rendered = injectResumeData(html, demoData, injectOptions);

    expect(rendered).toContain(DEFAULT_DEMO_PROFILE_IMAGE);
    expect(rendered).not.toContain(USER_PHOTO);
  });

  it('editor inject keeps user photo from form data and global store', () => {
    store.set(PROFILE_IMAGE_STORAGE_KEY, USER_PHOTO);
    const htmlPath = join(
      process.cwd(),
      'public/templates/soft-coral-executive/index.html'
    );
    const html = readFileSync(htmlPath, 'utf8');
    const rendered = injectResumeData(
      html,
      { firstName: 'Alex', lastName: 'Reed' },
      { templateId: 'soft-coral-executive', mode: 'preview' }
    );

    expect(rendered).toContain(USER_PHOTO);
    expect(rendered).not.toContain(DEFAULT_DEMO_PROFILE_IMAGE);
  });

  it('gallery import preview still shows user photo when resume data exists', () => {
    store.set(PROFILE_IMAGE_STORAGE_KEY, USER_PHOTO);
    const htmlPath = join(
      process.cwd(),
      'public/templates/soft-coral-executive/index.html'
    );
    const html = readFileSync(htmlPath, 'utf8');
    const userResume = {
      firstName: 'Alex',
      lastName: 'Reed',
      profileImage: USER_PHOTO,
      experience: [{ title: 'Engineer', company: 'Acme' }],
    };
    const injectOptions = resolveGalleryInjectOptions('soft-coral-executive', userResume);

    const rendered = injectResumeData(html, userResume, injectOptions);

    expect(injectOptions.galleryPreview).toBeUndefined();
    expect(rendered).toContain(USER_PHOTO);
  });
});
