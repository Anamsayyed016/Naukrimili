export interface JobDetailContentInput {
  title?: string | null;
  company?: string | null;
  location?: string | null;
  country?: string | null;
  sector?: string | null;
  jobType?: string | null;
  experienceLevel?: string | null;
  skills?: string[] | string | null;
  isRemote?: boolean | null;
  isHybrid?: boolean | null;
  companyRelation?: {
    name?: string | null;
    industry?: string | null;
    location?: string | null;
    website?: string | null;
  } | null;
}

export interface JobDetailContent {
  aboutCompany: string;
  roleOverview: string;
  skillsExplained: string[];
  careerGrowth: string;
  whyThisJobIsGood: string[];
}

function asArray(skills?: string[] | string | null): string[] {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills.filter(Boolean);
  return [skills].filter(Boolean);
}

function normalizeCountryCode(country?: string | null): string {
  if (!country) return '';
  const s = String(country).trim();
  if (!s) return '';
  if (s.length === 2) return s.toUpperCase();
  const lower = s.toLowerCase();
  if (lower === 'india') return 'IN';
  if (lower === 'united states' || lower === 'united states of america' || lower === 'usa') return 'US';
  if (lower === 'united kingdom' || lower === 'uk') return 'GB';
  if (lower === 'uae' || lower.includes('united arab emirates')) return 'AE';
  return s.toUpperCase().slice(0, 2);
}

function humanize(text?: string | null): string {
  if (!text) return '';
  return String(text).replace(/[-_]/g, ' ').trim();
}

export function buildJobDetailContent(job: JobDetailContentInput): JobDetailContent {
  const title = humanize(job.title) || 'this role';
  const company = humanize(job.companyRelation?.name) || humanize(job.company) || 'the hiring company';
  const location = humanize(job.location) || humanize(job.companyRelation?.location) || '';
  const sector = humanize(job.companyRelation?.industry) || humanize(job.sector) || '';
  const jobType = humanize(job.jobType) || '';
  const experience = humanize(job.experienceLevel) || '';
  const countryCode = normalizeCountryCode(job.country);
  const skills = asArray(job.skills).slice(0, 8).map(humanize).filter(Boolean);
  const remoteLabel = job.isRemote ? 'remote' : job.isHybrid ? 'hybrid' : '';

  const aboutBits: string[] = [];
  aboutBits.push(`${company} is hiring for ${title}.`);
  if (sector) aboutBits.push(`This opening is listed under the ${sector} category.`);
  if (location) aboutBits.push(`Location: ${location}.`);
  if (remoteLabel) aboutBits.push(`Work mode: ${remoteLabel}.`);
  if (countryCode) aboutBits.push(`Country/region: ${countryCode}.`);
  const aboutCompany = aboutBits.join(' ');

  const roleBits: string[] = [];
  roleBits.push(`${title} typically focuses on delivering day-to-day outcomes that support the team and customers.`);
  if (jobType) roleBits.push(`The role is posted as ${jobType}.`);
  if (experience) roleBits.push(`Experience level: ${experience}.`);
  roleBits.push(`Review the responsibilities in the description and match them with your past work, projects, or training.`);
  const roleOverview = roleBits.join(' ');

  const skillsExplained: string[] = [];
  if (skills.length > 0) {
    for (const skill of skills) {
      skillsExplained.push(`${skill}: be ready to show practical usage (examples, tools, or tasks you’ve done with it).`);
    }
  } else {
    skillsExplained.push(`Core skills: focus on the basics of the role (communication, reliability, and role-specific fundamentals).`);
  }

  const growthBits: string[] = [];
  growthBits.push(`Career growth in ${title} often comes from building consistent performance, learning common tools and workflows, and taking ownership of slightly larger tasks over time.`);
  if (sector) growthBits.push(`In ${sector}, this can also mean improving domain knowledge and adapting to industry standards.`);
  const careerGrowth = growthBits.join(' ');

  const whyThisJobIsGood: string[] = [];
  if (remoteLabel) whyThisJobIsGood.push(`Work mode flexibility (${remoteLabel}) may help with commute/time planning, depending on your situation.`);
  if (jobType) whyThisJobIsGood.push(`Clear employment type (${jobType}) can help you compare roles consistently.`);
  whyThisJobIsGood.push(`This role can help you build a stronger resume by demonstrating real responsibilities and measurable results.`);
  whyThisJobIsGood.push(`If the listed skills match what you’re learning, it’s a good opportunity to grow through hands-on work.`);

  return {
    aboutCompany,
    roleOverview,
    skillsExplained,
    careerGrowth,
    whyThisJobIsGood,
  };
}


