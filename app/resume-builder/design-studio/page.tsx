'use client';

/**
 * Resume Builder — Design Studio
 *
 * Full-page customizer that REPLACES the cramped "Change Template" modal.
 * Reuses every existing system:
 *   - `LivePreview` for the big right-hand preview (single source of truth)
 *   - `templates.json` for the template registry
 *   - `color-theme` + `ColorPicker` palette resolution
 *   - `formData` from per-template `localStorage` so user data flows back
 *     to the editor when they click "Apply".
 *
 * State on this page is purely local — applying mutations writes back to
 * localStorage and navigates to `/resume-builder/editor?template=…` which
 * is the normal editor reload path. Editor auto-loads from the same key.
 *
 * Behaviour intentionally preserved:
 *   - "Cancel" / "Back" returns to the editor on the same template.
 *   - "Apply" copies current formData under the new template's key first,
 *     so changing template does NOT erase the user's filled-in data — fixes
 *     a long-standing footgun of the old modal.
 */

import './design-studio.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Layers,
  Palette,
  Sliders,
  Type,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import LivePreview from '@/components/resume-builder/LivePreview';
import TemplateGalleryPanel from '@/components/resume-builder/design-studio/TemplateGalleryPanel';
import ColorPanel from '@/components/resume-builder/design-studio/ColorPanel';
import TypographyPanel from '@/components/resume-builder/design-studio/TypographyPanel';
import { useToast } from '@/hooks/use-toast';
import type { Template } from '@/lib/resume-builder/types';
import {
  buildTypographyCss,
  DEFAULT_TYPOGRAPHY,
  readTypographyFromFormData,
  writeTypographyToFormData,
  type TypographyOverrides,
} from '@/lib/resume-builder/typography';
import { cn } from '@/lib/utils';
import {
  mergePersistedProfileImageIntoFormData,
  syncPersistedProfileImageFromFormData,
} from '@/lib/resume-builder/profile-image-persistence';
import {
  clearDesignStudioHandoff,
  readDesignStudioHandoff,
  writeDesignStudioHandoff,
} from '@/lib/resume-builder/design-studio-handoff';
import { hasImportableContent } from '@/lib/resume-builder/import-transformer';

type SidebarTab = 'templates' | 'colors' | 'typography';

const DESIGN_STUDIO_RETURN_KEY = 'resume-builder-design-studio-return';

function readLocalFormData(templateId: string): Record<string, unknown> {
  if (typeof window === 'undefined') return mergePersistedProfileImageIntoFormData({});
  // Prefer the live editor handoff over a possibly stale per-template draft.
  const handoff = readDesignStudioHandoff(templateId);
  if (handoff && hasImportableContent(handoff)) {
    return mergePersistedProfileImageIntoFormData(handoff);
  }
  try {
    const raw = localStorage.getItem(`resume-${templateId}`);
    if (!raw) return mergePersistedProfileImageIntoFormData({});
    const parsed = JSON.parse(raw);
    const data = parsed && typeof parsed === 'object' ? parsed : {};
    return mergePersistedProfileImageIntoFormData(data);
  } catch {
    return mergePersistedProfileImageIntoFormData({});
  }
}

function writeLocalFormData(
  templateId: string,
  data: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;
  const payload = {
    ...mergePersistedProfileImageIntoFormData(data),
    _userEdited: true,
    _userEditedAt: Date.now(),
  };
  syncPersistedProfileImageFromFormData(payload);
  try {
    localStorage.setItem(`resume-${templateId}`, JSON.stringify(payload));
  } catch {
    // ignore quota errors — preview still works in memory
  }
  writeDesignStudioHandoff(templateId, payload);
}

export default function DesignStudioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const originalTemplateId = searchParams.get('template') || '';
  const typeId = searchParams.get('type') || '';
  const initialColor = searchParams.get('color') || '';

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    originalTemplateId
  );
  const [selectedColorId, setSelectedColorId] = useState<string>(initialColor);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [tab, setTab] = useState<SidebarTab>('templates');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveBadge, setSaveBadge] = useState<'idle' | 'saving' | 'saved'>(
    'saved'
  );

  // Load template registry (lazy to avoid TDZ on initial chunk)
  useEffect(() => {
    let mounted = true;
    import('@/lib/resume-builder/templates.json').then((data) => {
      if (!mounted) return;
      setTemplates(((data.default.templates as Template[]) || []) as Template[]);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Read form data + initial color from localStorage / template defaults.
  useEffect(() => {
    if (!originalTemplateId) {
      router.push('/resume-builder/templates');
      return;
    }
    const stored = readLocalFormData(originalTemplateId);
    setFormData(stored);
  }, [originalTemplateId, router]);

  // When the templates list arrives, fall back to the default colour for the
  // *originally* requested template if URL didn't have one.
  useEffect(() => {
    if (selectedColorId || templates.length === 0) return;
    const tpl = templates.find((t) => t.id === originalTemplateId);
    if (tpl) {
      setSelectedColorId(tpl.defaultColor || tpl.colors[0]?.id || '');
    }
  }, [templates, originalTemplateId, selectedColorId]);

  const selectedTemplate = useMemo<Template | null>(() => {
    if (!templates.length) return null;
    return (
      templates.find((t) => t.id === selectedTemplateId) ||
      templates.find((t) => t.id === originalTemplateId) ||
      templates[0] ||
      null
    );
  }, [templates, selectedTemplateId, originalTemplateId]);

  // Typography state is the single source of truth (formData.__typography).
  const typography: TypographyOverrides = useMemo(
    () => readTypographyFromFormData(formData) ?? DEFAULT_TYPOGRAPHY,
    [formData]
  );

  const typographyCss = useMemo(
    () => buildTypographyCss(typography),
    [typography]
  );

  // Debounced auto-save under the *original* template key — so cancelling
  // restores the user's previous work intact.
  useEffect(() => {
    if (!originalTemplateId || Object.keys(formData).length === 0) return;
    setSaveBadge('saving');
    const id = window.setTimeout(() => {
      writeLocalFormData(originalTemplateId, formData);
      setSaveBadge('saved');
    }, 400);
    return () => window.clearTimeout(id);
  }, [formData, originalTemplateId]);

  const handleTemplateSelect = useCallback(
    (templateId: string) => {
      setSelectedTemplateId(templateId);
      const tpl = templates.find((t) => t.id === templateId);
      if (tpl) {
        const defaultColor =
          tpl.colors.find((c) => c.id === tpl.defaultColor) || tpl.colors[0];
        if (defaultColor) setSelectedColorId(defaultColor.id);
      }
    },
    [templates]
  );

  const handleColorChange = useCallback((colorId: string) => {
    setSelectedColorId(colorId);
  }, []);

  const handleTypographyChange = useCallback((next: TypographyOverrides) => {
    setFormData((prev) => writeTypographyToFormData(prev, next));
  }, []);

  const handleTypographyReset = useCallback(() => {
    setFormData((prev) => writeTypographyToFormData(prev, null));
  }, []);

  const goBackToEditor = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(DESIGN_STUDIO_RETURN_KEY);
      clearDesignStudioHandoff();
    }
    const url = `/resume-builder/editor?template=${originalTemplateId}${
      typeId ? `&type=${typeId}` : ''
    }`;
    router.push(url);
  }, [originalTemplateId, typeId, router]);

  const handleApply = useCallback(() => {
    if (!selectedTemplate) return;

    const payload = {
      ...mergePersistedProfileImageIntoFormData(formData),
      _userEdited: true,
      _userEditedAt: Date.now(),
    };

    // Migrate CURRENT studio form (cloned from editor handoff) onto the destination
    // template key. Never reload import session / gallery demo here.
    const movingTemplate = selectedTemplate.id !== originalTemplateId;
    writeLocalFormData(selectedTemplate.id, payload);
    if (!movingTemplate) {
      writeLocalFormData(originalTemplateId, payload);
    }

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(DESIGN_STUDIO_RETURN_KEY);
    }

    toast({
      title: movingTemplate ? 'Template applied' : 'Design updated',
      description: movingTemplate
        ? 'Your resume data was carried over to the new template.'
        : 'Your customizations have been saved.',
    });

    const params = new URLSearchParams();
    params.set('template', selectedTemplate.id);
    if (typeId) params.set('type', typeId);
    if (selectedColorId) params.set('color', selectedColorId);
    router.push(`/resume-builder/editor?${params.toString()}`);
  }, [
    selectedTemplate,
    originalTemplateId,
    formData,
    selectedColorId,
    typeId,
    router,
    toast,
  ]);

  if (loading || !selectedTemplate) {
    return (
      <div className="design-studio-shell">
        <header className="design-studio-topbar">
          <div className="design-studio-topbar__left">
            <Button variant="ghost" size="sm" onClick={goBackToEditor}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back
            </Button>
            <div className="design-studio-topbar__title">
              <strong>Change Template</strong>
              <span>Loading…</span>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center flex-1 min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  const sidebarContent = (
    <>
      <div className="design-studio-tabs" role="tablist" aria-label="Customization tabs">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'templates'}
          onClick={() => setTab('templates')}
          className={cn(
            'design-studio-tab',
            tab === 'templates' && 'design-studio-tab--active'
          )}
        >
          <Layers />
          Templates
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'colors'}
          onClick={() => setTab('colors')}
          className={cn(
            'design-studio-tab',
            tab === 'colors' && 'design-studio-tab--active'
          )}
        >
          <Palette />
          Colors
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'typography'}
          onClick={() => setTab('typography')}
          className={cn(
            'design-studio-tab',
            tab === 'typography' && 'design-studio-tab--active'
          )}
        >
          <Type />
          Typography
        </button>
      </div>
      <div className="design-studio-sidebar__body">
        {tab === 'templates' && (
          <TemplateGalleryPanel
            templates={templates}
            selectedTemplateId={selectedTemplate.id}
            formData={formData}
            selectedColorId={selectedColorId}
            typographyCss={typographyCss}
            onSelect={(id) => {
              handleTemplateSelect(id);
              if (mobileSheetOpen) setMobileSheetOpen(false);
            }}
          />
        )}
        {tab === 'colors' && (
          <ColorPanel
            template={selectedTemplate}
            selectedColorId={selectedColorId}
            onColorChange={handleColorChange}
          />
        )}
        {tab === 'typography' && (
          <TypographyPanel
            typography={typography}
            onChange={handleTypographyChange}
            onReset={handleTypographyReset}
          />
        )}
      </div>
    </>
  );

  return (
    <motion.div
      className="design-studio-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
    >
      <header className="design-studio-topbar">
        <div className="design-studio-topbar__left">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBackToEditor}
            className="design-studio-topbar__back"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Back to Editor</span>
            <span className="sm:hidden">Back</span>
          </Button>
          <div className="design-studio-topbar__title">
            <strong>{selectedTemplate.name}</strong>
            <span>Change Template</span>
          </div>
        </div>
        <div className="design-studio-topbar__right">
          <span
            className={cn(
              'design-studio-topbar__save',
              saveBadge === 'saving' && 'design-studio-topbar__save--saving'
            )}
            aria-live="polite"
          >
            <Check className="w-3.5 h-3.5" />
            {saveBadge === 'saving' ? 'Saving…' : 'Auto-saved'}
          </span>
          <Button
            size="sm"
            onClick={handleApply}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Check className="w-4 h-4 mr-1.5" />
            Apply
          </Button>
        </div>
      </header>

      {/* Mobile quick bar — opens the bottom sheet */}
      <div className="design-studio-mobile-bar">
        <button
          type="button"
          onClick={() => {
            setTab('templates');
            setMobileSheetOpen(true);
          }}
        >
          <Layers className="w-4 h-4" />
          Templates
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('colors');
            setMobileSheetOpen(true);
          }}
        >
          <Palette className="w-4 h-4" />
          Colors
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('typography');
            setMobileSheetOpen(true);
          }}
        >
          <Sliders className="w-4 h-4" />
          Typography
        </button>
      </div>

      <div className="design-studio-workspace">
        <aside className="design-studio-sidebar">{sidebarContent}</aside>

        <section className="design-studio-preview">
          <div className="design-studio-preview__chrome">
            <span className="design-studio-preview__chrome-label">
              <span
                className="inline-block w-2 h-2 rounded-full bg-emerald-500"
                aria-hidden
              />
              Live preview
            </span>
            <span className="design-studio-preview__chrome-meta">
              {selectedTemplate.name}
            </span>
          </div>
          <div className="design-studio-preview__body">
            <LivePreview
              templateId={selectedTemplate.id}
              formData={formData}
              selectedColorId={selectedColorId}
              customCss={typographyCss}
              showZoomControls
            />
          </div>
        </section>
      </div>

      {/* Mobile bottom sheet — renders the same sidebar content */}
      <div
        className="design-studio-mobile-sheet"
        data-open={mobileSheetOpen ? 'true' : 'false'}
        role="dialog"
        aria-modal="true"
        aria-hidden={!mobileSheetOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) setMobileSheetOpen(false);
        }}
      >
        <div className="design-studio-mobile-sheet__panel">
          <div className="design-studio-mobile-sheet__handle" aria-hidden />
          <button
            type="button"
            className="design-studio-mobile-sheet__close"
            onClick={() => setMobileSheetOpen(false)}
            aria-label="Close customization sheet"
          >
            <X className="w-4 h-4" />
          </button>
          {sidebarContent}
        </div>
      </div>
    </motion.div>
  );
}
