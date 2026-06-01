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
  hasMeaningfulRenderedHtml,
  isFresherProfile,
  normalizeSkillsForRender,
} from './section-visibility';
import {
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
  collapseCenter: boolean;
  spacingScale: number;
  renderEmphasis: RenderEmphasis;
}

const SECTION_LIST_KEYS: LayoutSectionKey[] = [
  'education',
  'languages',
  'certifications',
  'skills',
  'projects',
  'achievements',
];

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
    { key: 'summary', score: Math.min(40, summaryLen / 25), hasContent: summaryLen > 40 },
    {
      key: 'experience',
      score: arrayScore(experience, 14, 120) + experience.reduce((n, e) => n + textLen(e.description ?? e.Description) / 30, 0),
      hasContent: experience.length > 0,
    },
    { key: 'education', score: arrayScore(education, 10, 50), hasContent: education.length > 0 },
    { key: 'skills', score: Math.min(60, skills.length * 4), hasContent: skills.length > 0 },
    { key: 'projects', score: arrayScore(projects, 12, 72), hasContent: projects.length > 0 },
    { key: 'certifications', score: arrayScore(certifications, 8, 40), hasContent: certifications.length > 0 },
    { key: 'languages', score: arrayScore(languages, 6, 30), hasContent: languages.length > 0 },
    { key: 'achievements', score: arrayScore(achievements, 8, 40), hasContent: achievements.length > 0 },
    { key: 'hobbies', score: arrayScore(hobbies, 4, 24), hasContent: hobbies.length > 0 },
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
    collapseCenter: Boolean(profile.collapseEmptyCenter),
    spacingScale,
    renderEmphasis,
  };
}

function columnTextWeight(fragment: string | null): number {
  if (!fragment) return 0;
  const text = fragment.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length;
}

function extractFirstColumnBlock(html: string, selectors: string[]): string | null {
  for (const sel of selectors) {
    const className = sel.replace(/^\./, '').split(/\s+/)[0];
    const patterns = [
      new RegExp(
        `<(aside|main|div)[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/\\1>`,
        'i'
      ),
      new RegExp(
        `<(aside|main|div)[^>]*class="[^"]*\\b${className.replace(/-/g, '[-]')}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/\\1>`,
        'i'
      ),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m) return m[2];
    }
  }
  return null;
}

export function measureRenderedColumnWeights(
  html: string,
  profile: TemplateLayoutProfile
): { sidebar: number; main: number; center: number } {
  const centerSelectors = profile.centerSelectors ?? [];
  return {
    sidebar: columnTextWeight(extractFirstColumnBlock(html, profile.sidebarSelectors)),
    main: columnTextWeight(extractFirstColumnBlock(html, profile.mainSelectors)),
    center: centerSelectors.length
      ? columnTextWeight(extractFirstColumnBlock(html, centerSelectors))
      : 0,
  };
}

function findSectionsWithListClass(html: string, listClass: string): Array<{ start: number; end: number; html: string }> {
  const results: Array<{ start: number; end: number; html: string }> = [];
  const sectionRe = new RegExp(
    `<section[^>]*>[\\s\\S]*?\\b${listClass}\\b[\\s\\S]*?<\\/section>`,
    'gi'
  );
  let match: RegExpExecArray | null;
  while ((match = sectionRe.exec(html)) !== null) {
    results.push({
      start: match.index,
      end: match.index + match[0].length,
      html: match[0],
    });
  }
  return results;
}

function indexInColumn(html: string, sectionStart: number, selectors: string[]): boolean {
  if (!selectors.length) return false;
  const before = html.slice(0, sectionStart);
  for (const sel of selectors) {
    const cn = sel.replace(/^\./, '').split(/\s+/)[0];
    const openRe = new RegExp(`<(aside|main|div)[^>]*class="[^"]*\\b${cn}\\b`, 'gi');
    let lastOpen = -1;
    let m: RegExpExecArray | null;
    while ((m = openRe.exec(before)) !== null) {
      lastOpen = m.index;
    }
    if (lastOpen >= 0) {
      const afterOpen = before.slice(lastOpen);
      const closes = (afterOpen.match(new RegExp(`</(aside|main|div)>`, 'gi')) || []).length;
      const opens = (afterOpen.match(new RegExp(`<(aside|main|div)[^>]*>`, 'gi')) || []).length;
      if (opens > closes) return true;
    }
  }
  return false;
}

/**
 * Remove duplicate sections (same list class). Prefer sidebar / side column, then center, then main.
 */
export function deduplicateRenderedSections(html: string, profile: TemplateLayoutProfile): string {
  let result = html;

  for (const key of SECTION_LIST_KEYS) {
    const listClass = getSectionListClass(key);
    const sections = findSectionsWithListClass(result, listClass);
    if (sections.length <= 1) continue;

    const ranked = sections.map((sec, idx) => {
      let priority = 3;
      if (indexInColumn(result, sec.start, profile.sidebarSelectors)) priority = 0;
      else if (indexInColumn(result, sec.start, profile.centerSelectors ?? [])) priority = 1;
      else if (indexInColumn(result, sec.start, profile.mainSelectors)) priority = 2;
      return { ...sec, idx, priority };
    });

    ranked.sort((a, b) => a.priority - b.priority || a.start - b.start);
    const keep = ranked[0];
    const remove = ranked.slice(1).sort((a, b) => b.start - a.start);

    for (const sec of remove) {
      result = result.slice(0, sec.start) + result.slice(sec.end);
    }

    void keep;
  }

  return result;
}

/**
 * Move sections from main → sidebar when sidebar has a slot for that section but no rendered block.
 * Never copies — always removes source after move.
 */
function findMovableSection(
  html: string,
  listClass: string,
  profile: TemplateLayoutProfile
): { start: number; end: number; html: string } | undefined {
  const all = findSectionsWithListClass(html, listClass);
  if (all.length === 0) return undefined;
  if (all.some((s) => indexInColumn(html, s.start, profile.sidebarSelectors))) return undefined;

  const fromMain = all.find((s) => indexInColumn(html, s.start, profile.mainSelectors));
  if (fromMain) return fromMain;

  const center = profile.centerSelectors ?? [];
  return all.find((s) => indexInColumn(html, s.start, center));
}

export function moveSectionsToSidebarWhenNeeded(
  html: string,
  profile: TemplateLayoutProfile
): string {
  let result = html;
  if (!extractFirstColumnBlock(result, profile.sidebarSelectors)) return result;

  for (const key of profile.sidebarSections) {
    const listClass = getSectionListClass(key);
    const movable = findMovableSection(result, listClass, profile);
    if (!movable) continue;

    const sidebarMatch = result.match(
      /<(aside|div)([^>]*class="[^"]*(?:sidebar|col-side|eel-col-side|esl-side|vre-sidebar|re-sidebar)[^"]*"[^>]*)>([\s\S]*?)<\/\1>/i
    );
    if (!sidebarMatch) continue;

    result = result.slice(0, movable.start) + result.slice(movable.end);

    const moved = movable.html.replace(
      /class="([^"]*)"/,
      (m, classes) => `class="${classes} sidebar-section"`
    );
    const newInner = moved + sidebarMatch[3];
    const newSidebar = `<${sidebarMatch[1]}${sidebarMatch[2]}>${newInner}</${sidebarMatch[1]}>`;
    result = result.replace(sidebarMatch[0], newSidebar);
  }

  return result;
}

export function applyContentBalance(html: string, plan: LayoutPlan): string {
  let result = html;

  result = deduplicateRenderedSections(result, plan.profile);
  result = moveSectionsToSidebarWhenNeeded(result, plan.profile);
  result = deduplicateRenderedSections(result, plan.profile);

  const rendered = measureRenderedColumnWeights(result, plan.profile);
  const sidebarStillEmpty = rendered.sidebar < 40;

  if (plan.collapseSidebar && sidebarStillEmpty) {
    result = result.replace(
      /<(aside|div)([^>]*class="[^"]*(?:sidebar|col-side|eel-col-side|esl-side|vre-sidebar|re-sidebar)[^"]*"[^>]*)/gi,
      '<$1$2 data-sidebar-collapsed="true"'
    );
    plan.collapseSidebar = true;
  } else if (!sidebarStillEmpty) {
    plan.collapseSidebar = false;
  }

  const centerSelectors = plan.profile.centerSelectors ?? [];
  if (plan.collapseCenter && centerSelectors.length > 0 && rendered.center < 50) {
    for (const sel of centerSelectors) {
      const cn = sel.replace(/^\./, '');
      result = result.replace(
        new RegExp(`(<div[^>]*class="[^"]*\\b${cn}\\b[^"]*"[^>]*)(>)`, 'i'),
        '$1 data-center-collapsed="true"$2'
      );
    }
    plan.collapseCenter = true;
  }

  return result;
}

export function buildLayoutBalanceCSS(plan: LayoutPlan): string {
  const scale = plan.spacingScale.toFixed(3);
  const emphasis = plan.renderEmphasis;
  const fresher = plan.isFresher ? 'true' : 'false';
  const collapse = plan.collapseSidebar ? 'true' : 'false';
  const collapseCenter = plan.collapseCenter ? 'true' : 'false';
  const imbalance = plan.imbalanceRatio.toFixed(2);

  return `
<style data-injected="resume-layout-balance">
/* Skills always render as spaced chips */
.skills-list,
.skills-chips-wrap {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 6px 8px !important;
  align-items: flex-start !important;
}
.skills-chips-wrap .skill-tag,
.skills-list > .skill-tag {
  display: inline-block !important;
  margin: 0 !important;
  white-space: normal !important;
  word-break: break-word !important;
  max-width: 100% !important;
}
body[data-sidebar-collapsed="true"] aside[data-sidebar-collapsed="true"],
body[data-sidebar-collapsed="true"] .sidebar[data-sidebar-collapsed="true"],
body[data-sidebar-collapsed="true"] .col-side[data-sidebar-collapsed="true"],
body[data-sidebar-collapsed="true"] .eel-col-side[data-sidebar-collapsed="true"],
body[data-sidebar-collapsed="true"] .esl-side[data-sidebar-collapsed="true"],
body[data-sidebar-collapsed="true"] .vre-sidebar[data-sidebar-collapsed="true"],
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
body[data-sidebar-collapsed="true"] .main-panel,
body[data-sidebar-collapsed="true"] .col-main,
body[data-sidebar-collapsed="true"] .eel-col-main,
body[data-sidebar-collapsed="true"] .esl-main,
body[data-sidebar-collapsed="true"] .re-main,
body[data-sidebar-collapsed="true"] .col-right {
  flex: 1 1 100% !important;
  width: 100% !important;
  max-width: 100% !important;
}
body[data-sidebar-collapsed="true"] .resume-wrapper,
body[data-sidebar-collapsed="true"] .boardroom-body {
  gap: 0 !important;
}
body[data-center-collapsed="true"] .col-center[data-center-collapsed="true"] {
  display: none !important;
  width: 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
}
body[data-center-collapsed="true"] .resume-wrapper {
  grid-template-columns: 1fr 1fr !important;
}
body[data-layout-imbalance="high"] .main-content .content-section,
body[data-layout-imbalance="high"] .sidebar-section,
body[data-layout-imbalance="high"] .ib-section {
  margin-bottom: calc(var(--section-gap, 22px) * ${scale}) !important;
}
body[data-render-emphasis="expanded"] .project-item .description,
body[data-render-emphasis="expanded"] .education-item,
body[data-render-emphasis="expanded"] .certification-item {
  line-height: 1.65 !important;
}
/* Sidebar education/skills on dark panels */
.col-side .education-item,
.col-side .education-item h3,
.col-side .education-item .institution,
.eel-col-side .education-item,
.esl-side .education-item {
  color: inherit !important;
}
</style>
<script data-injected="resume-layout-balance">
(function(){
  try {
    function apply(){
      if (!document.body) return;
      document.body.setAttribute('data-sidebar-collapsed', '${collapse}');
      document.body.setAttribute('data-center-collapsed', '${collapseCenter}');
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
