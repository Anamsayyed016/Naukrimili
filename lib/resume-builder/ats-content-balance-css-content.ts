/** Source string for ATS content-balance rules — keep in sync with public/templates/_shared/ats-content-balance.css */
export const ATS_CONTENT_BALANCE_CSS = `
.resume-container {
  --acb-lh-body: 1.68;
  --acb-lh-tight: 1.4;
  --acb-section-gap: clamp(10px, 1.4vw, 14px);
  --acb-block-gap: clamp(8px, 1.2vw, 12px);
  --acb-heading-gap: clamp(6px, 1vw, 10px);
  --acb-size-name: clamp(26px, 3.3vw, 40px);
  --acb-size-heading: clamp(12.5px, 1.25vw, 15px);
  --acb-size-company: clamp(12px, 1.18vw, 14px);
  --acb-size-job: clamp(11px, 1.08vw, 12.5px);
  --acb-size-body: clamp(10.5px, 1.08vw, 12.5px);
  --acb-size-small: clamp(9.5px, 0.98vw, 11px);
  --acb-size-skill: clamp(9.5px, 1vw, 11px);
}

.resume-container .candidate-name,
.resume-container .candidate-name .name-first,
.resume-container .candidate-name .name-last {
  font-size: var(--acb-size-name) !important;
  font-weight: 700 !important;
  letter-spacing: 0.02em !important;
  line-height: 1.12 !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

.resume-container .header-title {
  font-size: clamp(12px, 1.2vw, 15px) !important;
  font-weight: 500 !important;
  letter-spacing: 0.04em !important;
  line-height: 1.35 !important;
}

.resume-container section > h2,
.resume-container .section-title,
.resume-container [class*="section-title"],
.resume-container [class*="-heading"]:not([class*="accent"]):not([class*="text"]) {
  font-size: var(--acb-size-heading) !important;
  font-weight: 700 !important;
  letter-spacing: 0.08em !important;
  line-height: 1.22 !important;
  margin-top: 0 !important;
  margin-bottom: var(--acb-heading-gap) !important;
  padding-bottom: clamp(3px, 0.5vw, 6px) !important;
}

.resume-container section {
  margin-bottom: var(--acb-section-gap) !important;
}

.resume-container aside section,
.resume-container [class*="sidebar"] section {
  margin-bottom: clamp(8px, 1.2vw, 12px) !important;
}

.resume-container .summary-text {
  font-size: var(--acb-size-body) !important;
  font-weight: 400 !important;
  line-height: var(--acb-lh-body) !important;
  letter-spacing: 0.01em !important;
  word-spacing: 0.02em !important;
  max-width: 100%;
  width: 100%;
  hyphens: auto;
  -webkit-hyphens: auto;
  overflow-wrap: break-word;
  margin-top: 0 !important;
  margin-bottom: clamp(4px, 0.8vw, 8px) !important;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.resume-container .experience-item {
  margin-bottom: var(--acb-block-gap) !important;
  padding-bottom: clamp(2px, 0.4vw, 4px) !important;
}

.resume-container .experience-header {
  margin-bottom: clamp(4px, 0.7vw, 6px) !important;
  display: flex;
  flex-direction: column;
}

.resume-container .experience-header .company {
  order: 1;
  display: block;
  font-size: var(--acb-size-company) !important;
  font-weight: 600 !important;
  line-height: var(--acb-lh-tight) !important;
  letter-spacing: 0.015em !important;
  margin-bottom: 2px !important;
}

.resume-container .experience-header h3 {
  order: 2;
  font-size: var(--acb-size-job) !important;
  font-weight: 500 !important;
  line-height: var(--acb-lh-tight) !important;
  letter-spacing: 0.01em !important;
  margin-bottom: 2px !important;
}

.resume-container .experience-header .duration {
  order: 3;
  font-size: var(--acb-size-small) !important;
  font-weight: 500 !important;
  line-height: 1.35 !important;
  letter-spacing: 0.02em !important;
  color: color-mix(in srgb, currentColor 68%, transparent) !important;
}

.resume-container .experience-item .description,
.resume-container .project-item .description,
.resume-container .description {
  font-size: var(--acb-size-body) !important;
  font-weight: 400 !important;
  line-height: var(--acb-lh-body) !important;
  letter-spacing: 0.01em !important;
  word-spacing: 0.02em !important;
  overflow-wrap: break-word;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.resume-container .experience-item .description ul,
.resume-container .description ul {
  margin: clamp(4px, 0.7vw, 8px) 0 0 0 !important;
  padding: 0 0 0 1.15em !important;
}

.resume-container .experience-item .description li,
.resume-container .description li {
  margin-bottom: clamp(5px, 0.7vw, 8px) !important;
  line-height: var(--acb-lh-body) !important;
  orphans: 2;
  widows: 2;
}

.resume-container .education-item {
  margin-bottom: var(--acb-block-gap) !important;
  display: flex;
  flex-direction: column;
}

.resume-container .education-item .institution {
  order: 1;
  display: block;
  font-size: var(--acb-size-company) !important;
  font-weight: 600 !important;
  line-height: var(--acb-lh-tight) !important;
  margin-bottom: 2px !important;
}

.resume-container .education-item h3 {
  order: 2;
  font-size: var(--acb-size-job) !important;
  font-weight: 500 !important;
  line-height: var(--acb-lh-tight) !important;
  margin-bottom: 2px !important;
}

.resume-container .education-item .year,
.resume-container .education-item .cgpa {
  order: 3;
  font-size: var(--acb-size-small) !important;
  font-weight: 500 !important;
  line-height: 1.35 !important;
  color: color-mix(in srgb, currentColor 68%, transparent) !important;
}

.resume-container .project-item {
  margin-bottom: var(--acb-block-gap) !important;
}

.resume-container .project-item h3 {
  font-size: var(--acb-size-company) !important;
  font-weight: 600 !important;
  line-height: var(--acb-lh-tight) !important;
  margin-bottom: 3px !important;
}

.resume-container .project-item .description,
.resume-container .project-item p.description {
  font-size: var(--acb-size-body) !important;
  font-weight: 400 !important;
  line-height: var(--acb-lh-body) !important;
  margin-bottom: 4px !important;
}

.resume-container .project-item .technologies {
  font-size: var(--acb-size-small) !important;
  font-weight: 500 !important;
  line-height: 1.4 !important;
  margin-bottom: 4px !important;
  color: color-mix(in srgb, currentColor 62%, transparent) !important;
}

.resume-container .project-item a {
  font-size: var(--acb-size-small) !important;
  line-height: 1.3 !important;
}

.resume-container .skills-list:not(:has(.psp-skill-item)),
.resume-container .skills-chips-wrap:not(:has(.psp-skill-item)) {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: clamp(4px, 0.6vw, 6px) clamp(6px, 0.9vw, 10px) !important;
  align-items: stretch !important;
  width: 100% !important;
}

.resume-container .skills-list:not(:has(.psp-skill-item)) > .skill-tag,
.resume-container .skills-chips-wrap:not(:has(.psp-skill-item)) > .skill-tag {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  width: 100% !important;
  min-height: 1.55em !important;
  margin: 0 !important;
  padding: clamp(4px, 0.5vw, 6px) clamp(7px, 0.85vw, 10px) !important;
  box-sizing: border-box !important;
  white-space: normal !important;
  word-break: break-word !important;
  line-height: 1.35 !important;
  font-size: var(--acb-size-skill) !important;
  font-weight: 500 !important;
  letter-spacing: 0.02em !important;
}

.resume-container .achievement-item {
  margin-bottom: clamp(4px, 0.7vw, 6px) !important;
}

.resume-container .achievements-list .achievement-item h3,
.resume-container .achievement-item h3 {
  font-size: var(--acb-size-job) !important;
  font-weight: 600 !important;
  line-height: var(--acb-lh-tight) !important;
  margin-bottom: 2px !important;
}

.resume-container .certification-item > h3,
.resume-container .certification-item .cert-title {
  font-size: var(--acb-size-company) !important;
  font-weight: 600 !important;
  line-height: var(--acb-lh-tight) !important;
}

.resume-container .certification-item .issuer {
  font-size: var(--acb-size-job) !important;
  font-weight: 500 !important;
  color: color-mix(in srgb, currentColor 78%, transparent) !important;
}

.resume-container .certification-item .date,
.resume-container .certification-item .year {
  font-size: var(--acb-size-small) !important;
  color: color-mix(in srgb, currentColor 68%, transparent) !important;
}

.resume-container .language-item,
.resume-container .psp-language-item {
  font-size: var(--acb-size-body) !important;
  line-height: 1.4 !important;
}

.resume-container main p,
.resume-container [class*="main"] p:not(.header-title) {
  line-height: var(--acb-lh-body) !important;
}

.resume-container .experience-list > .experience-item:last-child,
.resume-container .education-list > .education-item:last-child,
.resume-container .projects-list > .project-item:last-child {
  margin-bottom: 0 !important;
}

@media print {
  .resume-container .skills-list:not(:has(.psp-skill-item)),
  .resume-container .skills-chips-wrap:not(:has(.psp-skill-item)) {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}
`.trim();
