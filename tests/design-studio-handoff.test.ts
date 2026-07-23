import {
  DESIGN_STUDIO_STATE_KEY,
  clearDesignStudioHandoff,
  readDesignStudioHandoff,
  stripProfileImagesForHandoff,
  writeDesignStudioHandoff,
} from '@/lib/resume-builder/design-studio-handoff';
import { PROFILE_IMAGE_STORAGE_KEY } from '@/lib/resume-builder/profile-image-persistence';

const USER_PHOTO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function makeStorage(store: Map<string, string>) {
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
}

function installStorage() {
  const localStore = new Map<string, string>();
  const sessionStore = new Map<string, string>();
  const localStorage = makeStorage(localStore);
  const sessionStorage = makeStorage(sessionStore);
  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorage,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: sessionStorage,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'window', {
    value: { localStorage, sessionStorage },
    configurable: true,
  });
  return { localStore, sessionStore };
}

describe('design studio live handoff', () => {
  let localStore: Map<string, string>;
  let sessionStore: Map<string, string>;

  beforeEach(() => {
    ({ localStore, sessionStore } = installStorage());
  });

  it('strips embedded profile images from the handoff payload', () => {
    const stripped = stripProfileImagesForHandoff({
      firstName: 'Anam',
      lastName: 'Sayyed',
      profileImage: USER_PHOTO,
      photo: USER_PHOTO,
    });
    expect(stripped.firstName).toBe('Anam');
    expect(stripped.profileImage).toBeUndefined();
    expect(stripped.photo).toBeUndefined();
  });

  it('clears a stale prior handoff before writing the current resume', () => {
    sessionStore.set(
      DESIGN_STUDIO_STATE_KEY,
      JSON.stringify({
        templateId: 'soft-coral-executive',
        formData: { firstName: 'Trilokinath', lastName: 'Upadhyaya' },
        at: 1,
        v: 1,
      })
    );

    const ok = writeDesignStudioHandoff('soft-coral-executive', {
      firstName: 'Anam',
      lastName: 'Sayyed',
      profileImage: USER_PHOTO,
      experience: [{ title: 'Python Developer' }],
    });
    expect(ok).toBe(true);

    const raw = sessionStore.get(DESIGN_STUDIO_STATE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed.formData.firstName).toBe('Anam');
    expect(parsed.formData.lastName).toBe('Sayyed');
    expect(parsed.formData.profileImage).toBeUndefined();
    // Photo lives in the dedicated localStorage key, not the handoff JSON.
    expect(localStore.get(PROFILE_IMAGE_STORAGE_KEY)).toBe(USER_PHOTO);
  });

  it('restores the user photo when reading the handoff', () => {
    writeDesignStudioHandoff('soft-coral-executive', {
      firstName: 'Anam',
      lastName: 'Sayyed',
      profileImage: USER_PHOTO,
      experience: [{ title: 'Dev' }],
    });

    const restored = readDesignStudioHandoff('soft-coral-executive');
    expect(restored?.firstName).toBe('Anam');
    expect(restored?.profileImage).toBe(USER_PHOTO);
  });

  it('rejects handoff for a different template id', () => {
    writeDesignStudioHandoff('template-a', {
      firstName: 'Anam',
      experience: [{ title: 'Dev' }],
    });
    expect(readDesignStudioHandoff('template-b')).toBeNull();
  });

  it('clearDesignStudioHandoff removes the live state key', () => {
    writeDesignStudioHandoff('soft-coral-executive', {
      firstName: 'Anam',
      experience: [{ title: 'Dev' }],
    });
    clearDesignStudioHandoff();
    expect(readDesignStudioHandoff('soft-coral-executive')).toBeNull();
  });
});
