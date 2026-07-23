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

const USER_PHOTO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

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
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: storage,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'window', {
    value: { localStorage: storage, sessionStorage: storage },
    configurable: true,
  });
  return store;
}

function softCoralHtml(): string {
  return readFileSync(
    join(process.cwd(), 'public/templates/soft-coral-executive/index.html'),
    'utf8'
  );
}

describe('profile image data isolation', () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = installBrowserStorageMock();
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
    const demoData = buildGallerySampleFormData('soft-coral-executive');
    const injectOptions = resolveGalleryInjectOptions('soft-coral-executive', demoData);

    const rendered = injectResumeData(softCoralHtml(), demoData, injectOptions);

    expect(injectOptions.galleryPreview).toBe(true);
    expect(rendered).toContain(DEFAULT_DEMO_PROFILE_IMAGE);
    expect(rendered).not.toContain(USER_PHOTO);
  });

  it('marketing gallery with user content forces demo photo, keeps user name', () => {
    store.set(PROFILE_IMAGE_STORAGE_KEY, USER_PHOTO);
    const userResume = {
      firstName: 'Anam',
      lastName: 'Sayyed',
      profileImage: USER_PHOTO,
      experience: [{ title: 'Python Developer', company: 'Acme' }],
    };
    const injectOptions = resolveGalleryInjectOptions('soft-coral-executive', userResume);
    const rendered = injectResumeData(softCoralHtml(), userResume, injectOptions);

    expect(injectOptions.galleryForceDemoPhoto).toBe(true);
    expect(rendered).toContain('Anam');
    expect(rendered).toContain(DEFAULT_DEMO_PROFILE_IMAGE);
    expect(rendered).not.toContain(USER_PHOTO);
  });

  it('editor inject keeps user photo from form data and global store', () => {
    store.set(PROFILE_IMAGE_STORAGE_KEY, USER_PHOTO);
    const rendered = injectResumeData(
      softCoralHtml(),
      { firstName: 'Alex', lastName: 'Reed' },
      { templateId: 'soft-coral-executive', mode: 'preview' }
    );

    expect(rendered).toContain(USER_PHOTO);
    expect(rendered).not.toContain(DEFAULT_DEMO_PROFILE_IMAGE);
  });

  it('editor without photo uses demo portrait as initial placeholder', () => {
    const rendered = injectResumeData(
      softCoralHtml(),
      { firstName: 'Alex', lastName: 'Reed' },
      { templateId: 'soft-coral-executive', mode: 'preview' }
    );
    expect(rendered).toContain(DEFAULT_DEMO_PROFILE_IMAGE);
  });

  it('editor replaces a demo portrait placeholder with the persisted user photo', () => {
    store.set(PROFILE_IMAGE_STORAGE_KEY, USER_PHOTO);
    const demoPortrait = { firstName: 'Alex', profileImage: DEFAULT_DEMO_PROFILE_IMAGE };
    expect(shouldMergePersistedProfileImageForRender(demoPortrait)).toBe(true);
    expect(prepareFormDataForResumeRender(demoPortrait).profileImage).toBe(USER_PHOTO);
  });

  it('change-template locked cards keep user photo (no forced demo)', () => {
    store.set(PROFILE_IMAGE_STORAGE_KEY, 'data:image/png;base64,other');
    const userResume = {
      firstName: 'Alex',
      lastName: 'Reed',
      profileImage: USER_PHOTO,
      experience: [{ title: 'Engineer', company: 'Acme' }],
    };
    const rendered = injectResumeData(softCoralHtml(), userResume, {
      templateId: 'soft-coral-executive',
      mode: 'preview',
      gallerySourceLock: true,
    });
    expect(rendered).toContain(USER_PHOTO);
    expect(rendered).not.toContain(DEFAULT_DEMO_PROFILE_IMAGE);
  });
});
