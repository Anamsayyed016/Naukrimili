/**
 * Eden AI Resume Parser — secondary enrichment adapter.
 * Returns the same ExtractedResumeData shape as Affinda (never raw Eden format downstream).
 */

import type { ExtractedResumeData } from './enhanced-resume-ai';
import { getEdenConfig, isEdenEnabled } from './resume-parser/eden-config';
import { mimeTypeFromFileName } from './resume-parser/affinda-config';
import {
  cleanString,
  cleanMultiline,
  normalizeDate,
  dedupeStrings,
  splitBullets,
  normalizeExtractedResumeData,
} from './resume-parser/normalize-extracted';

type EdenProviderBlock = {
  status?: string;
  extracted_data?: Record<string, unknown>;
  error?: unknown;
  message?: string;
};

export class EdenResumeParser {
  private readonly config = getEdenConfig();

  isAvailable(): boolean {
    return isEdenEnabled();
  }

  async parseResume(fileBuffer: Buffer, fileName: string): Promise<ExtractedResumeData> {
    const config = this.config;
    if (!config) {
      throw new Error('Eden AI API key not configured');
    }

    const mime = mimeTypeFromFileName(fileName);
    console.log('🔍 Parsing resume with Eden AI...');
    console.log('   - Providers:', config.providers.join(', '));
    console.log('   - File:', fileName, '| MIME:', mime);

    const providerPlans =
      config.providers.length > 1
        ? [config.providers, ...config.providers.map((p) => [p])]
        : [config.providers];

    let payload: Record<string, unknown> | null = null;
    let lastEdenResult: Record<string, EdenProviderBlock> | null = null;

    for (const providers of providerPlans) {
      const edenResult = await this.requestEdenParse(
        fileBuffer,
        fileName,
        mime,
        providers,
        config.apiUrl,
        config.apiKey,
        config.timeoutMs
      );
      lastEdenResult = edenResult;
      payload = extractEdenPayload(edenResult);
      if (payload) {
        console.log('✅ Eden provider succeeded:', providers.join(', '));
        break;
      }
      logEdenProviderStatuses(edenResult, providers);
    }

    try {
      if (!payload) {
        throw new Error('Eden AI returned no extracted_data from configured providers');
      }

      const transformed = this.transformEdenToStandard(payload);
      const normalized = normalizeExtractedResumeData(transformed);

      console.log('📋 Eden normalized sections:', {
        workExperience: normalized.experience?.length ?? 0,
        education: normalized.education?.length ?? 0,
        skills: normalized.skills?.length ?? 0,
        projects: normalized.projects?.length ?? 0,
        certifications: normalized.certifications?.length ?? 0,
        languages: normalized.languages?.length ?? 0,
        hobbies: normalized.hobbies?.length ?? 0,
      });

      return normalized;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (lastEdenResult) {
        logEdenProviderStatuses(lastEdenResult, config.providers);
      }
      console.error('❌ Eden AI parsing failed:', message);
      throw error;
    }
  }

  private async requestEdenParse(
    fileBuffer: Buffer,
    fileName: string,
    mime: string,
    providers: string[],
    apiUrl: string,
    apiKey: string,
    timeoutMs: number
  ): Promise<Record<string, EdenProviderBlock>> {
    const blob = new Blob([fileBuffer], { type: mime });
    const formData = new FormData();
    formData.append('file', blob, fileName);
    formData.append('providers', JSON.stringify(providers));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Eden AI API error: ${response.status} - ${errorText}`);
      }

      return (await response.json()) as Record<string, EdenProviderBlock>;
    } finally {
      clearTimeout(timeout);
    }
  }

  private transformEdenToStandard(data: Record<string, unknown>): ExtractedResumeData {
    const personal = (data.personal_infos || data.personalInfos || {}) as Record<string, unknown>;
    const nameBlock = (personal.name || {}) as Record<string, unknown>;

    const fullName =
      cleanString(nameBlock.raw_name) ||
      cleanString(nameBlock.rawName) ||
      cleanString(
        `${String(nameBlock.first_name || nameBlock.firstName || '')} ${String(nameBlock.last_name || nameBlock.lastName || '')}`.trim()
      );

    const mails = asStringArray(personal.mails || personal.emails);
    const email = mails[0] || '';

    const phones = asStringArray(personal.phones);
    const phone = phones[0] || '';

    const addresses = asStringArray(personal.addresses);
    const location = addresses[0] || cleanString(personal.address);

    let linkedin = '';
    let portfolio = '';
    const urls = asStringArray(personal.urls);
    for (const url of urls) {
      const lower = url.toLowerCase();
      if (lower.includes('linkedin.com')) linkedin = linkedin || url;
      else if (lower.includes('github.com') || lower.includes('gitlab.com')) portfolio = portfolio || url;
      else if (!portfolio) portfolio = url;
    }

    const summary = cleanMultiline(data.summary || data.objective || data.profile);

    const workBlock = (data.work_experience || data.workExperience || {}) as Record<string, unknown>;
    const workEntries = asObjectArray(workBlock.entries || workBlock);
    const experience = workEntries.map((exp) => {
      const endRaw = String(exp.end_date || exp.endDate || '');
      const endNorm = normalizeDate(endRaw);
      const current =
        exp.current === true ||
        !endRaw ||
        /present|current/i.test(endRaw) ||
        endNorm.toLowerCase() === 'present';

      const rawDescription = String(exp.description || exp.job_description || '');
      const achievements = splitBullets(rawDescription);
      const description = cleanMultiline(rawDescription);

      const locationValue =
        typeof exp.location === 'string'
          ? exp.location
          : (exp.location as { formatted?: string })?.formatted;

      return {
        company: cleanString(exp.company || exp.organization),
        position: cleanString(exp.title || exp.job_title || exp.position),
        location: cleanString(locationValue),
        startDate: normalizeDate(exp.start_date || exp.startDate),
        endDate: current ? '' : endNorm,
        current,
        description,
        achievements: dedupeStrings(achievements),
      };
    });

    const eduBlock = (data.education || {}) as Record<string, unknown>;
    const eduEntries = asObjectArray(eduBlock.entries || eduBlock);
    const education = eduEntries.map((edu) => ({
      institution: cleanString(edu.school || edu.institution || edu.organization),
      degree: cleanString(edu.title || edu.degree || edu.accreditation),
      field: cleanString(edu.field || edu.area),
      startDate: normalizeDate(edu.start_date || edu.startDate),
      endDate: normalizeDate(edu.end_date || edu.endDate || edu.completion_date),
      gpa: cleanString(edu.grade || edu.gpa),
      description: cleanMultiline(edu.description),
    }));

    const skills = dedupeStrings(
      (Array.isArray(data.skills) ? data.skills : [])
        .map((s) => {
          if (typeof s === 'string') return s;
          if (s && typeof s === 'object') {
            return String((s as Record<string, unknown>).name || (s as Record<string, unknown>).skill || '');
          }
          return '';
        })
        .map((s) => s.replace(/\s+\d{1,3}%?\s*$/i, '').trim())
        .filter(Boolean)
    );

    const projects = asObjectArray(data.projects)
      .map((p, index) => {
        const name = cleanString(p.name || p.title || p.project_name);
        const description = cleanString(p.description || p.summary);
        const technologies = asStringArray(p.technologies || p.tech_stack);
        const url = cleanString(p.link || p.url);
        if (!name && (description || technologies.length > 0)) {
          return {
            name: index === 0 ? 'Software Project' : `Project ${index + 1}`,
            description,
            technologies,
            url,
          };
        }
        if (!name) return null;
        return { name, description, technologies, url };
      })
      .filter((p): p is NonNullable<typeof p> => p != null);

    const certifications = asObjectArray(data.certifications)
      .map((cert) => {
        if (typeof cert === 'string') {
          return { name: cleanString(cert), issuer: '', date: '', url: '' };
        }
        return {
          name: cleanString(cert.name || cert.title),
          issuer: cleanString(cert.organization || cert.issuer),
          date: normalizeDate(cert.date || cert.issued_date),
          url: cleanString(cert.url || cert.link),
        };
      })
      .filter((c) => c.name);

    const languagesSeen = new Set<string>();
    const languages: Array<{ name: string; proficiency: string }> = [];
    for (const lang of asObjectArray(data.languages)) {
      const name =
        typeof lang === 'string'
          ? cleanString(lang)
          : cleanString(lang.name || lang.language);
      if (!name) continue;
      const key = name.toLowerCase();
      if (languagesSeen.has(key)) continue;
      languagesSeen.add(key);
      const proficiency =
        typeof lang === 'string'
          ? ''
          : cleanString(lang.fluency || lang.proficiency || lang.level);
      languages.push({ name, proficiency });
    }

    const hobbySource = [
      ...asStringArray(data.hobbies),
      ...asObjectArray(data.hobbies).map((h) =>
        typeof h === 'string' ? h : String(h.name || h.hobby || '')
      ),
      ...asStringArray(data.interests),
      ...asObjectArray(data.interests).map((h) =>
        typeof h === 'string' ? h : String(h.name || '')
      ),
    ];
    const hobbies = dedupeStrings(hobbySource.map((h) => cleanString(h)).filter(Boolean));

    const confidence = this.calculateConfidence({
      fullName,
      email,
      phone,
      skills: skills.length,
      experience: experience.length,
      education: education.length,
    });

    return {
      fullName,
      email,
      phone,
      location,
      linkedin,
      portfolio,
      summary,
      skills,
      experience,
      education,
      projects,
      certifications,
      languages,
      hobbies,
      expectedSalary: '',
      preferredJobType: '',
      confidence,
      rawText: cleanString(data.raw_text || data.rawText) || '',
    };
  }

  private calculateConfidence(data: {
    fullName: string;
    email: string;
    phone: string;
    skills: number;
    experience: number;
    education: number;
  }): number {
    let score = 0;
    if (data.fullName) score += 20;
    if (data.email) score += 20;
    if (data.phone) score += 10;
    if (data.skills > 0) score += 15;
    if (data.experience > 0) score += 20;
    if (data.education > 0) score += 10;
    return Math.min(score, 100);
  }
}

function logEdenProviderStatuses(
  response: Record<string, EdenProviderBlock>,
  attempted: string[]
): void {
  console.warn('[eden] No extracted_data yet. Provider statuses:', attempted.join(', '));
  for (const key of Object.keys(response)) {
    const block = response[key];
    if (!block || typeof block !== 'object') continue;
    const err =
      block.error != null
        ? typeof block.error === 'string'
          ? block.error
          : JSON.stringify(block.error).slice(0, 300)
        : block.message || '';
    console.warn(
      `[eden] ${key}: status=${block.status || 'unknown'} hasData=${!!block.extracted_data}${
        err ? ` error=${err}` : ''
      }`
    );
  }
}

function extractEdenPayload(response: Record<string, EdenProviderBlock>): Record<string, unknown> | null {
  for (const key of Object.keys(response)) {
    const block = response[key];
    if (!block || typeof block !== 'object') continue;
    if (block.status === 'success' && block.extracted_data) {
      return block.extracted_data;
    }
  }
  for (const key of Object.keys(response)) {
    const block = response[key];
    if (block?.extracted_data && Object.keys(block.extracted_data).length > 0) {
      return block.extracted_data;
    }
  }
  return null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'string') return cleanString(item);
      if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        return cleanString(rec.value ?? rec.text ?? rec.email ?? rec.phone ?? rec.url);
      }
      return '';
    })
    .filter(Boolean);
}

function asObjectArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object');
}
