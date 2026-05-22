/**
 * Affinda Resume Parser — adapter for the shared extraction pipeline.
 * Config: lib/resume-parser/affinda-config.ts (AFFINDA_API_KEY, AFFINDA_WORKSPACE_ID)
 */

import type { ExtractedResumeData } from './enhanced-resume-ai';
import {
  getAffindaConfig,
  isAffindaEnabled,
  mimeTypeFromFileName,
} from './resume-parser/affinda-config';
import { cleanString, normalizeDate, dedupeStrings } from './resume-parser/normalize-extracted';
import { normalizeExtractedResumeData } from './resume-parser/normalize-extracted';

export interface AffindaResponse {
  data?: {
    name?: { raw?: string; first?: string; last?: string };
    phones?: Array<{ rawPhone?: string; number?: string }>;
    emails?: Array<string | { email?: string }>;
    location?: { formatted?: string; city?: string; state?: string; country?: string };
    websites?: Array<{ url?: string; type?: string }>;
    summary?: string;
    skills?: Array<{ name?: string } | string>;
    workExperience?: Array<{
      organization?: string;
      jobTitle?: string;
      location?: { formatted?: string };
      dates?: { startDate?: string; endDate?: string; raw?: string };
      jobDescription?: string;
      description?: string;
    }>;
    education?: Array<{
      organization?: string;
      accreditation?: { education?: string; input?: string };
      grade?: { raw?: string };
      dates?: { completionDate?: string; startDate?: string; raw?: string };
      location?: { formatted?: string };
    }>;
    certifications?: Array<string | { name?: string }>;
    languages?: Array<{ name?: string } | string>;
    achievements?: Array<string | { description?: string; title?: string }>;
    projects?: Array<{ name?: string; description?: string; url?: string }>;
  };
  meta?: { confidence?: number };
}

export class AffindaResumeParser {
  private readonly config = getAffindaConfig();

  isAvailable(): boolean {
    return isAffindaEnabled();
  }

  async parseResume(fileBuffer: Buffer, fileName: string): Promise<ExtractedResumeData> {
    const config = this.config;
    if (!config) {
      throw new Error('Affinda API key or workspace ID not configured');
    }

    const mime = mimeTypeFromFileName(fileName);
    console.log('🔍 Parsing resume with Affinda API...');
    console.log('   - Workspace ID:', config.workspaceId);
    console.log('   - File:', fileName, '| MIME:', mime);

    const blob = new Blob([fileBuffer], { type: mime });
    const formData = new FormData();
    formData.append('file', blob, fileName);
    formData.append('workspace', config.workspaceId);
    formData.append('wait', 'true');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Affinda API error: ${response.status} - ${errorText}`);
      }

      const affindaResult: AffindaResponse = await response.json();
      console.log('📊 Affinda parsing successful');

      const transformed = this.transformAffindaToStandard(affindaResult);
      return normalizeExtractedResumeData(transformed);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ Affinda parsing failed:', message);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private transformAffindaToStandard(affindaData: AffindaResponse): ExtractedResumeData {
    const data = affindaData.data || {};

    const fullName =
      cleanString(data.name?.raw) ||
      cleanString(`${data.name?.first || ''} ${data.name?.last || ''}`.trim());

    const emails = (data.emails || [])
      .map((e) => (typeof e === 'string' ? e : e?.email || ''))
      .map((e) => cleanString(e))
      .filter(Boolean);
    const email = emails[0] || '';

    const phones = (data.phones || [])
      .map((p) => cleanString(p.rawPhone || p.number))
      .filter(Boolean);
    const phone = phones[0] || '';

    const location =
      cleanString(data.location?.formatted) ||
      cleanString(
        [data.location?.city, data.location?.state, data.location?.country]
          .filter(Boolean)
          .join(', ')
      );

    let linkedin = '';
    let portfolio = '';
    let website = '';
    for (const site of data.websites || []) {
      const url = cleanString(site.url);
      if (!url) continue;
      const lower = url.toLowerCase();
      if (lower.includes('linkedin.com')) linkedin = linkedin || url;
      else if (lower.includes('github.com')) portfolio = portfolio || url;
      else if (!portfolio && (site.type === 'portfolio' || site.type === 'personal')) {
        portfolio = url;
      } else if (!website) {
        website = url;
      }
    }
    if (!portfolio && website) portfolio = website;

    const skills = dedupeStrings(
      (data.skills || [])
        .map((s) => (typeof s === 'string' ? s : s?.name || ''))
        .filter(Boolean) as string[]
    );

    const experience = (data.workExperience || []).map((exp) => {
      const endRaw = exp.dates?.endDate || '';
      const endNorm = normalizeDate(endRaw);
      const current =
        !endRaw ||
        /present|current/i.test(endRaw) ||
        endNorm.toLowerCase() === 'present';

      const description = cleanString(exp.jobDescription || exp.description);
      const achievements = description ? description.split(/\n|•/).map((l) => cleanString(l)).filter((l) => l.length > 12) : [];

      return {
        company: cleanString(exp.organization),
        position: cleanString(exp.jobTitle),
        location: cleanString(exp.location?.formatted),
        startDate: normalizeDate(exp.dates?.startDate),
        endDate: current ? 'Present' : endNorm,
        current,
        description,
        achievements: dedupeStrings(achievements),
      };
    });

    const education = (data.education || []).map((edu) => {
      const degree =
        cleanString(edu.accreditation?.education) ||
        cleanString(edu.accreditation?.input);
      return {
        institution: cleanString(edu.organization),
        degree,
        field: '',
        startDate: normalizeDate(edu.dates?.startDate),
        endDate: normalizeDate(edu.dates?.completionDate || edu.dates?.raw),
        gpa: cleanString(edu.grade?.raw),
        description: cleanString(edu.location?.formatted),
      };
    });

    const certifications = (data.certifications || [])
      .map((cert) => {
        if (typeof cert === 'string') {
          return { name: cleanString(cert), issuer: '', date: '', url: '' };
        }
        return {
          name: cleanString(cert.name),
          issuer: '',
          date: '',
          url: '',
        };
      })
      .filter((c) => c.name);

    const languages = dedupeStrings(
      (data.languages || [])
        .map((lang) => (typeof lang === 'string' ? lang : lang?.name || ''))
        .filter(Boolean) as string[]
    );

    const summary = cleanString(data.summary);

    const confidence = this.calculateConfidence(
      {
        fullName,
        email,
        phone,
        skills: skills.length,
        experience: experience.length,
        education: education.length,
      },
      affindaData.meta?.confidence
    );

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
      projects: (data.projects || [])
        .map((p) => ({
          name: cleanString(p.name),
          description: cleanString(p.description),
          technologies: [],
          url: cleanString(p.url),
        }))
        .filter((p) => p.name),
      certifications,
      languages,
      expectedSalary: '',
      preferredJobType: '',
      confidence,
      rawText: '',
    };
  }

  private calculateConfidence(
    data: {
      fullName: string;
      email: string;
      phone: string;
      skills: number;
      experience: number;
      education: number;
    },
    apiConfidence?: number
  ): number {
    let score = 0;
    if (data.fullName) score += 20;
    if (data.email) score += 20;
    if (data.phone) score += 10;
    if (data.skills > 0) score += 15;
    if (data.experience > 0) score += 20;
    if (data.education > 0) score += 10;
    const local = Math.min(score, 100);
    if (typeof apiConfidence === 'number' && apiConfidence > 0) {
      return Math.round((local + apiConfidence) / 2);
    }
    return local;
  }
}
