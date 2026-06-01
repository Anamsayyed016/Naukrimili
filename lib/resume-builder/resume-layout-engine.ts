/**
 * Smart layout balancing — uses parsed form data weights only.
 * No fake content, no API/schema changes, no template file edits.
 */

import {
  estimateExperienceYears,
  filterMeaningfulCertifications,
  filterMeaningfulEducation,
  filterMeaningfulExperiences,
  filterMeaningfulProjects,
  filterMeaningfulSkills,
  hasMeaningfulRenderedHtml,
  hasMeaningfulText,
  isFresherProfile,
  normalizeSkillsForRender,
} from './section-visibility';
import {
  getSectionHeading,
  getSectionListClass,
  getTemplateLayoutProfile,
  type LayoutSectionKey,
  type TemplateLayoutProfile,
} from './template-layout-registry';

export type RenderEmphasis = 'normal' | 'expanded';

export interface SectionWeight {
  key: LayoutSectionKey;
  score: number;
  hasContent: boolean;
}

export interface LayoutPlan {
  templateId?: string;
  profile: TemplateLayoutProfile;
  isFresher: boolean;
  experienceYears: number;
  sectionWeights: SectionWeight[];
  sidebarWeight: number;
  mainWeight: number;
  imbalanceRatio: number;
  sidebarEmpty: boolean;
  collapseSidebar: boolean;
  relocateSections: LayoutSectionKey[];
  spacingScale: number;
  renderEmphasis: RenderEmphasis;
}

export interface BalanceSectionHtml {
  key: LayoutSectionKey;
  html: string;
}

function textLen(value: unknown): number {
  if (typeof value === 'string') return value.trim().length;
  return 0;
}

function arrayScore(items: unknown[], perItem: number, cap: number): number {
  if (!Array.isArray(items) || items.length === 0) return 0;
  return Math.min(cap, items.length * perItem);
}

export function buildLayoutPlan(
  formData: Record<string, unknown>,
  templateId?: string
): LayoutPlan {
  const profile = getTemplateLayoutProfile(templateId);
  const experience = filterMeaningfulExperiences(
    (formData.experience ?? formData.Experience ?? []) as Array<Record<string, unknown>>
  );
  const education = filterMeaningfulEducation(
    (formData.education ?? formData.Education ?? []) as Array<Record<string, unknown>>
  );
  const skills = normalizeSkillsForRender(formData);
  const projects = filterMeaningfulProjects(
    (formData.projects ?? formData.Projects ?? []) as Array<Record<string, unknown>>
  );
  const certifications = filterMeaningfulCertifications(
    (formData.certifications ?? formData.Certifications ?? []) as Array<Record<string, unknown>>
  );
  const languages = Array.isArray(formData.languages) ? formData.languages : [];
  const achievements = Array.isArray(formData.achievements) ? formData.achievements : [];
  const hobbies = Array.isArray(formData.hobbies) ? formData.hobbies : [];

  const summaryLen = textLen(
    formData.summary ?? formData.Summary ?? formData['Professional Summary']
  );

  const experienceYears = estimateExperienceYears(experience);
  const isFresher = isFresherProfile(formData);

  const weights: SectionWeight[] = [
    {
      key: 'summary',
      score: Math.min(40, summaryLen / 25),
      hasContent: summaryLen > 40,
    },
    {
      key: 'experience',
      score: arrayScore(experience, 14, 120) + experience.reduce((n, e) => n + textLen(e.description ?? e.Description) / 30, 0),
      hasContent: experience.length > 0,
    },
    {
      key: 'education',
      score: arrayScore(education, 10, 50),
      hasContent: education.length > 0,
    },
    {
      key: 'skills',
      score: Math.min(60, skills.length * 4),
      hasContent: skills.length > 0,
    },
    {
      key: 'projects',
      score: arrayScore(projects, 12, 72),
      hasContent: projects.length > 0,
    },
    {
      key: 'certifications',
      score: arrayScore(certifications, 8, 40),
      hasContent: certifications.length > 0,
    },
    {
      key: 'languages',
      score: arrayScore(languages, 6, 30),
      hasContent: languages.length > 0,
    },
    {
      key: 'achievements',
      score: arrayScore(achievements, 8, 40),
      hasContent: achievements.length > 0,
    },
    {
      key: 'hobbies',
      score: arrayScore(hobbies, 4, 24),
      hasContent: hobbies.length > 0,
    },
  ];

  const weightByKey = Object.fromEntries(weights.map((w) => [w.key, w.score])) as Record<
    LayoutSectionKey,
    number
  >;

  let sidebarWeight = 0;
  for (const key of profile.sidebarSections) {
    sidebarWeight += weightByKey[key] ?? 0;
  }

  let mainWeight = 0;
  for (const key of profile.mainSections) {
    mainWeight += weightByKey[key] ?? 0;
  }

  const maxW = Math.max(sidebarWeight, mainWeight, 1);
  const imbalanceRatio = Math.abs(sidebarWeight - mainWeight) / maxW;
  const sidebarEmpty = sidebarWeight < 8;

  const relocateSections: LayoutSectionKey[] = [];
  if (sidebarEmpty && profile.relocateToSidebarWhenEmpty.length > 0) {
    for (const key of profile.relocateToSidebarWhenEmpty) {
      const w = weights.find((s) => s.key === key);
      if (w?.hasContent && !profile.sidebarSections.includes(key)) {
        relocateSections.push(key);
      }
    }
  }

  let spacingScale = 1;
  if (imbalanceRatio > 0.45) spacingScale = 1.06;
  if (sidebarEmpty && mainWeight > 40) spacingScale = 1.04;
  if (isFresher) spacingScale = Math.min(spacingScale + 0.05, 1.12);

  const renderEmphasis: RenderEmphasis =
    isFresher || (experience.length === 0 && (projects.length > 0 || skills.length >= 4))
      ? 'expanded'
      : 'normal';

  return {
    templateId,
    profile,
    isFresher,
    experienceYears,
    sectionWeights: weights,
    sidebarWeight,
    mainWeight,
    imbalanceRatio,
    sidebarEmpty,
    collapseSidebar: sidebarEmpty && profile.collapseEmptySidebar,
    relocateSections,
    spacingScale,
    renderEmphasis,
  };
}

function extractColumnHtml(html: string, selectors: string[]): string | null {
  for (const sel of selectors) {
    const className = sel.replace(/^\./, '').split(/\s+/)[0];
    const re = new RegExp(
      `<(aside|main|div)[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/\\1>`,
      'i'
    );
    const m = html.match(re);
    if (m) return m[2];
  }
  return null;
}

function columnTextWeight(fragment: string | null): number {
  if (!fragment) return 0;
  const text = fragment.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length;
}

export function measureRenderedColumnWeights(
  html: string,
  profile: TemplateLayoutProfile
): { sidebar: number; main: number } {
  return {
    sidebar: columnTextWeight(extractColumnHtml(html, profile.sidebarSelectors)),
    main: columnTextWeight(extractColumnHtml(html, profile.mainSelectors)),
  };
}

/**
 * Move section blocks from main → sidebar (or inject) when sidebar is empty.
 */
export function relocateSectionsForBalance(
  html: string,
  plan: LayoutPlan,
  sectionHtml: Record<string, string>
): string {
  if (plan.relocateSections.length === 0) return html;

  let result = html;
  const sidebarMatch = result.match(
    /<(aside|div)([^>]*class="[^"]*\bsidebar\b[^"]*"[^>]*)>([\s\S]*?)<\/\1>/i
  );
  if (!sidebarMatch) return result;

  const sidebarTag = sidebarMatch[1];
  const sidebarAttrs = sidebarMatch[2];
  let sidebarInner = sidebarMatch[3];
  const injections: string[] = [];

  for (const key of plan.relocateSections) {
    const content = sectionHtml[key];
    if (!content || !hasMeaningfulRenderedHtml(content)) continue;

    const listClass = getSectionListClass(key);
    const heading = getSectionHeading(key);

    const mainBlock = extractColumnHtml(result, plan.profile.mainSelectors);
    if (mainBlock) {
      const sectionRe = new RegExp(
        `<section[^>]*>[\\s\\S]*?${listClass}[\\s\\S]*?<\\/section>`,
        'gi'
      );
      const strippedMain = mainBlock.replace(sectionRe, '');
      if (strippedMain !== mainBlock) {
        for (const sel of plan.profile.mainSelectors) {
          const className = sel.replace(/^\./, '').split(/\s+/)[0];
          const colRe = new RegExp(
            `(<(main|div)[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>)([\\s\\S]*?)(<\\/\\2>)`,
            'i'
          );
          result = result.replace(colRe, `$1${strippedMain}$3`);
          break;
        }
      }
    }

    injections.push(`
<section class="sidebar-section content-section" data-balanced-section="${key}">
  <h2 class="sidebar-section-title sidebar-heading section-title">${heading}</h2>
  <div class="${listClass}">${content}</div>
</section>`);
  }

  if (injections.length === 0) return result;

  sidebarInner = injections.join('\n') + sidebarInner;
  const newSidebar = `<${sidebarTag}${sidebarAttrs}>${sidebarInner}</${sidebarTag}>`;
  result = result.replace(sidebarMatch[0], newSidebar);
  return result;
}

export function applyContentBalance(
  html: string,
  plan: LayoutPlan,
  sectionHtml: Record<string, string>
): string {
  let result = relocateSectionsForBalance(html, plan, sectionHtml);

  const rendered = measureRenderedColumnWeights(result, plan.profile);
  const sidebarStillEmpty = rendered.sidebar < 40;

  if (plan.collapseSidebar && sidebarStillEmpty) {
    result = result.replace(
      /<(aside|div)([^>]*class="[^"]*\bsidebar\b[^"]*"[^>]*)/gi,
      '<$1$2 data-sidebar-collapsed="true"'
    );
    plan.collapseSidebar = true;
  } else if (!sidebarStillEmpty) {
    plan.collapseSidebar = false;
  }

  return result;
}

export function buildLayoutBalanceCSS(plan: LayoutPlan): string {
  const scale = plan.spacingScale.toFixed(3);
  const emphasis = plan.renderEmphasis;
  const fresher = plan.isFresher ? 'true' : 'false';
  const collapse = plan.collapseSidebar ? 'true' : 'false';
  const imbalance = plan.imbalanceRatio.toFixed(2);

  return `
<style data-injected="resume-layout-balance">
body[data-sidebar-collapsed="true"] aside.sidebar[data-sidebar-collapsed="true"],
body[data-sidebar-collapsed="true"] .sidebar[data-sidebar-collapsed="true"],
body[data-sidebar-collapsed="true"] .re-sidebar[data-sidebar-collapsed="true"] {
  display: none !important;
  width: 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
  border: none !important;
}
body[data-sidebar-collapsed="true"] .main-content,
body[data-sidebar-collapsed="true"] main.main-content,
body[data-sidebar-collapsed="true"] .re-main {
  flex: 1 1 100% !important;
  width: 100% !important;
  max-width: 100% !important;
}
body[data-sidebar-collapsed="true"] .resume-wrapper {
  gap: 0 !important;
}
body[data-layout-imbalance="high"] .main-content .content-section,
body[data-layout-imbalance="high"] .sidebar-section {
  margin-bottom: calc(var(--section-gap, 22px) * ${scale}) !important;
}
body[data-render-emphasis="expanded"] .project-item .description,
body[data-render-emphasis="expanded"] .education-item,
body[data-render-emphasis="expanded"] .certification-item {
  line-height: 1.65 !important;
}
body[data-profile="fresher"] .skills-list,
body[data-profile="fresher"] .skill-tag {
  line-height: 1.5 !important;
}
[data-balanced-section] {
  margin-bottom: 18px !important;
}
</style>
<script data-injected="resume-layout-balance">
(function(){
  try {
    function apply(){
      if (!document.body) return;
      document.body.setAttribute('data-sidebar-collapsed', '${collapse}');
      document.body.setAttribute('data-profile', '${fresher}');
      document.body.setAttribute('data-render-emphasis', '${emphasis}');
      document.body.setAttribute('data-layout-imbalance', ${parseFloat(imbalance) > 0.45 ? '"high"' : '"normal"'});
      document.documentElement.style.setProperty('--section-gap', '${plan.spacingScale > 1 ? '24px' : '20px'}');
    }
    if (document.body) apply();
    else document.addEventListener('DOMContentLoaded', apply);
  } catch (e) {}
})();
</script>
`;
}

export function buildSectionHtmlMap(placeholders: Record<string, string>): Record<string, string> {
  const map: Record<string, string> = {};
  const keys: LayoutSectionKey[] = [
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'achievements',
    'languages',
    'hobbies',
  ];
  for (const key of keys) {
    const upper = key.toUpperCase();
    const val = placeholders[`{{${upper}}}`];
    if (val && hasMeaningfulRenderedHtml(val)) map[key] = val;
  }
  return map;
}
