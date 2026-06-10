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
import {
  cleanString,
  cleanMultiline,
  normalizeDate,
  dedupeStrings,
  splitBullets,
} from './resume-parser/normalize-extracted';
import { normalizeExtractedResumeData } from './resume-parser/normalize-extracted';
import { sanitizePersonName } from './resume-parser/import-sanitize';
import {
  extractAffindaResumePayload,
  normalizeAffindaResumeFields,
} from './resume-parser/affinda-unwrap';

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
    certifications?: Array<
      string | { name?: string; issuer?: string; date?: string; url?: string }
    >;
    languages?: Array<{ name?: string; proficiency?: string } | string>;
    achievements?: Array<string | { description?: string; title?: string }>;
    projects?: Array<{
      name?: string;
      description?: string;
      url?: string;
      technologies?: string[];
    }>;
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

      const meta = (affindaResult as { meta?: { ready?: boolean; failed?: boolean } }).meta;
      if (meta?.failed) {
        throw new Error('Affinda document processing failed');
      }

      const payload = normalizeAffindaResumeFields(extractAffindaResumePayload(affindaResult));
      const transformed = this.transformAffindaToStandard({ data: payload, meta: affindaResult.meta });
      const normalized = normalizeExtractedResumeData(transformed);

      console.log('📋 Affinda normalized sections:', {
        workExperience: (payload.workExperience as unknown[])?.length ?? 0,
        education: (payload.education as unknown[])?.length ?? 0,
        skills: (payload.skills as unknown[])?.length ?? 0,
        projects: (payload.projects as unknown[])?.length ?? 0,
        certifications: (payload.certifications as unknown[])?.length ?? 0,
      });
      if ((normalized.experience?.length ?? 0) > 0) {
        console.log('   - First experience:', normalized.experience[0]);
      }
      if ((normalized.education?.length ?? 0) > 0) {
        console.log('   - First education:', normalized.education[0]);
      }

      if (!normalized.fullName && !normalized.email && (normalized.experience?.length ?? 0) === 0) {
        const keys = Object.keys(payload).filter((k) => payload[k] != null);
        console.warn('⚠️ Affinda payload looks empty — top-level keys:', keys.join(', ') || '(none)');
        if (payload.rawText && typeof payload.rawText === 'string') {
          console.log('   - rawText length from Affinda:', (payload.rawText as string).length);
        }
      }

      return normalized;
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

    const fullName = sanitizePersonName(
      cleanString(data.name?.raw) ||
        cleanString(`${data.name?.first || ''} ${data.name?.last || ''}`.trim())
    );

    const emails = (data.emails || [])
      .map((e) => (typeof e === 'string' ? e : e?.email || ''))
      .map((e) => cleanString(e))
      .filter(Boolean);
    const email = emails[0] || '';

    const phoneList = (data.phones || []) as Array<{ rawPhone?: string; number?: string }>;
    const phones = phoneList
      .map((p) => cleanString(p?.rawPhone || p?.number))
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
      const url =
        typeof site === 'string'
          ? cleanString(site)
          : cleanString((site as { url?: string }).url);
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
        .map((s) => {
          if (typeof s === 'string') return s.replace(/\s+\d{1,3}%?\s*$/i, '').trim();
          if (s && typeof s === 'object' && 'name' in s) {
            return String((s as { name?: string }).name || '')
              .replace(/\s+\d{1,3}%?\s*$/i, '')
              .trim();
          }
          return '';
        })
        .filter(Boolean) as string[]
    );

    const experience = (data.workExperience || []).map((exp) => {
      const endRaw = exp.dates?.endDate || '';
      const endNorm = normalizeDate(endRaw);
      const current =
        !endRaw ||
        /present|current/i.test(endRaw) ||
        endNorm.toLowerCase() === 'present';

      // IMPORTANT: split bullets BEFORE cleanString — once cleanString collapses
      // \n to spaces, the bullet/newline split fails and we lose every line.
      const rawDescription = String(exp.jobDescription || exp.description || '');
      const achievements = splitBullets(rawDescription);
      const description = cleanMultiline(rawDescription);

      const dateRaw = exp.dates?.raw || '';
      return {
        company: cleanString(exp.organization),
        position: cleanString(exp.jobTitle),
        location: cleanString(exp.location?.formatted),
        startDate: normalizeDate(exp.dates?.startDate || dateRaw),
        // Force empty endDate when current so downstream templates don't
        // render "Present" twice (once from endDate, once from current flag).
        endDate: current ? '' : (endNorm || normalizeDate(dateRaw)),
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
        const rec = cert as Record<string, unknown>;
        return {
          name: cleanString(rec.name),
          issuer: cleanString(rec.issuer ?? rec.issuingOrganization ?? rec.organization),
          date: normalizeDate(rec.date ?? rec.issuedDate ?? rec.issued_date ?? rec.year),
          url: cleanString(rec.url ?? rec.link ?? rec.credentialUrl),
        };
      })
      .filter((c) => c.name);

    const languagesSeen = new Set<string>();
    const languages: Array<{ name: string; proficiency: string }> = [];
    for (const lang of data.languages || []) {
      let name = '';
      let proficiency = '';
      if (typeof lang === 'string') {
        name = cleanString(lang);
      } else if (lang && typeof lang === 'object') {
        const rec = lang as Record<string, unknown>;
        name = cleanString(rec.name);
        proficiency = cleanString(rec.proficiency ?? rec.level ?? rec.fluency);
      }
      if (!name) continue;
      const key = name.toLowerCase();
      if (languagesSeen.has(key)) continue;
      languagesSeen.add(key);
      languages.push({ name, proficiency });
    }

    const summary = cleanMultiline(data.summary);
    const profession = cleanString((data as { profession?: string }).profession);

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
      summary: summary || profession,
      skills,
      experience,
      education,
      projects: (data.projects || [])
        .map((p, index) => {
          const rec = p as Record<string, unknown>;
          let name =
            cleanString(p.name) ||
            cleanString((rec.title as string) || '') ||
            cleanString((rec.projectName as string) || '');
          const description = cleanString(p.description || String(rec.summary || ''));
          const technologies = Array.isArray(rec.technologies)
            ? (rec.technologies as unknown[])
                .map((t) => cleanString(String(t ?? '')))
                .filter(Boolean)
            : [];
          if (!name && (description || technologies.length > 0)) {
            name = index === 0 ? 'Software Project' : `Project ${index + 1}`;
          }
          if (!name) {
            console.log('REMOVED PROJECT', p, 'reason', 'transformAffindaToStandard: no name and no content');
            return null;
          }
          return { name, description, technologies, url: cleanString(p.url) };
        })
        .filter((p): p is NonNullable<typeof p> => p != null),
      certifications,
      languages,
      expectedSalary: '',
      preferredJobType: '',
      confidence,
      rawText: cleanString((data as { rawText?: string }).rawText) || '',
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
