import { DEFAULT_DEMO_PROFILE_IMAGE } from '@/lib/resume-builder/demo-profile-image';
import { resolveProfileImageForRender } from '@/lib/resume-builder/section-visibility';
import { templateSupportsProfilePhoto } from '@/lib/resume-builder/template-photo-metadata';
import { injectResumeData } from '@/lib/resume-builder/template-loader';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('demo profile image integration', () => {
  it('falls back to demo portrait for photo-enabled templates in live preview', () => {
    const image = resolveProfileImageForRender({}, undefined, {
      demoFallback: templateSupportsProfilePhoto('soft-coral-executive'),
    });
    expect(image).toBe(DEFAULT_DEMO_PROFILE_IMAGE);
  });

  it('prefers user upload over demo fallback', () => {
    const userUrl = 'https://res.cloudinary.com/example/upload/v1/user-photo.jpg';
    const image = resolveProfileImageForRender(
      { profileImage: userUrl },
      undefined,
      { demoFallback: true }
    );
    expect(image).toBe(userUrl);
  });

  it('does not apply demo fallback for templates without profile photos', () => {
    expect(templateSupportsProfilePhoto('soft-coral-executive')).toBe(true);
    const image = resolveProfileImageForRender({}, undefined, {
      demoFallback: templateSupportsProfilePhoto('non-photo-template'),
    });
    expect(image).toBe('');
  });

  it('injectResumeData renders demo image in live mode when no user photo exists', () => {
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

    expect(rendered).toContain(DEFAULT_DEMO_PROFILE_IMAGE);
    expect(rendered).toMatch(/class="profile-image"/);
  });

  it('injectResumeData keeps user photo in live mode after upload', () => {
    const htmlPath = join(
      process.cwd(),
      'public/templates/soft-coral-executive/index.html'
    );
    const html = readFileSync(htmlPath, 'utf8');
    const userUrl = 'https://res.cloudinary.com/example/upload/v1/user-photo.jpg';
    const rendered = injectResumeData(
      html,
      { firstName: 'Alex', lastName: 'Reed', profileImage: userUrl },
      { templateId: 'soft-coral-executive', mode: 'preview' }
    );

    expect(rendered).toContain(userUrl);
    expect(rendered).not.toContain(DEFAULT_DEMO_PROFILE_IMAGE);
  });
});
