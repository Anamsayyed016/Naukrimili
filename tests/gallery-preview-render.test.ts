import {
  buildGalleryPreviewDocumentHtml,
  isGalleryCompactPreview,
  resolveDemoGalleryCardRenderPlan,
  resolveGalleryCardRenderPlan,
  resolveGalleryInjectOptions,
} from '@/lib/resume-builder/gallery-preview-render';
import { DEFAULT_DEMO_PROFILE_IMAGE } from '@/lib/resume-builder/demo-profile-image';

describe('gallery preview render helpers', () => {
  it('resolveDemoGalleryCardRenderPlan always returns demo sample (ignores import context)', () => {
    const plan = resolveDemoGalleryCardRenderPlan('soft-coral-executive');
    expect(plan.previewData._galleryDemo).toBe(true);
    expect(plan.previewData.profileImage).toBe(DEFAULT_DEMO_PROFILE_IMAGE);
    expect(plan.injectOptions.galleryPreview).toBe(true);
    expect(plan.injectOptions.gallerySourceLock).toBeUndefined();
  });

  it('uses compact inject options for empty gallery data', () => {
    expect(resolveGalleryInjectOptions('modern-classic', {})).toEqual({
      galleryPreview: true,
      galleryTemplateId: 'modern-classic',
    });
    expect(isGalleryCompactPreview({})).toBe(true);
  });

  it('uses compact inject options for gallery demo sample data', () => {
    const demo = { _galleryDemo: true, firstName: 'Alex', lastName: 'Reed', experience: [{}] };
    expect(resolveGalleryInjectOptions('soft-coral-executive', demo)).toEqual({
      galleryPreview: true,
      galleryTemplateId: 'soft-coral-executive',
    });
    expect(isGalleryCompactPreview(demo)).toBe(true);
  });

  it('locks imported user gallery cards to source object (no live demoFallback)', () => {
    const imported = {
      firstName: 'Qamar',
      lastName: 'Ali',
      _imported: true,
      experience: [{ title: 'CS' }],
    };
    expect(resolveGalleryInjectOptions('soft-coral-executive', imported)).toEqual({
      templateId: 'soft-coral-executive',
      galleryTemplateId: 'soft-coral-executive',
      mode: 'preview',
      gallerySourceLock: true,
    });
    expect(isGalleryCompactPreview(imported)).toBe(false);
  });

  it('resolveGalleryCardRenderPlan picks demo sample when user data is empty', () => {
    const plan = resolveGalleryCardRenderPlan('soft-coral-executive', null);
    expect(plan.previewData._galleryDemo).toBe(true);
    expect(plan.previewData.profileImage).toBe(DEFAULT_DEMO_PROFILE_IMAGE);
    expect(plan.injectOptions.galleryPreview).toBe(true);
  });

  it('resolveGalleryCardRenderPlan keeps imported object atomic', () => {
    const imported = {
      firstName: 'Sam',
      lastName: 'Lee',
      experience: [{ title: 'Dev' }],
      profileImage: 'data:image/png;base64,abc',
    };
    const plan = resolveGalleryCardRenderPlan('soft-coral-executive', imported);
    expect(plan.previewData).toBe(imported);
    expect(plan.injectOptions.gallerySourceLock).toBe(true);
    expect(plan.injectOptions.galleryPreview).toBeUndefined();
  });

  it('builds full-flow document html without compact overflow clipping', () => {
    const html = buildGalleryPreviewDocumentHtml(
      'body{}',
      '<div class="resume-container">x</div>',
      false
    );
    expect(html).toContain('overflow-y: visible');
    expect(html).not.toContain('font-size: 10px');
  });

  it('builds compact document html for demo cards', () => {
    const html = buildGalleryPreviewDocumentHtml('body{}', '<div>x</div>', true);
    expect(html).toContain('overflow: hidden');
    expect(html).toContain('font-size: 10px');
  });
});
