import {
  buildGalleryPreviewDocumentHtml,
  isGalleryCompactPreview,
  resolveGalleryInjectOptions,
} from '@/lib/resume-builder/gallery-preview-render';

describe('gallery preview render helpers', () => {
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

  it('uses live preview inject options for imported user data', () => {
    const imported = { firstName: 'Qamar', lastName: 'Ali', _imported: true, experience: [{ title: 'CS' }] };
    expect(resolveGalleryInjectOptions('soft-coral-executive', imported)).toEqual({
      templateId: 'soft-coral-executive',
      mode: 'preview',
    });
    expect(isGalleryCompactPreview(imported)).toBe(false);
  });

  it('builds full-flow document html without compact overflow clipping', () => {
    const html = buildGalleryPreviewDocumentHtml('body{}', '<div class="resume-container">x</div>', false);
    expect(html).toContain('overflow-y: visible');
    expect(html).not.toContain('font-size: 10px');
  });

  it('builds compact document html for demo cards', () => {
    const html = buildGalleryPreviewDocumentHtml('body{}', '<div>x</div>', true);
    expect(html).toContain('overflow: hidden');
    expect(html).toContain('font-size: 10px');
  });
});
