/**
 * ApiLayer Resume Parser — tertiary document parser adapter.
 * Returns the same ExtractedResumeData shape as Affinda / Eden (never raw ApiLayer format downstream).
 */

import type { ExtractedResumeData } from './enhanced-resume-ai';
import { getApilayerConfig, isApilayerEnabled } from './resume-parser/apilayer-config';
import { mimeTypeFromFileName } from './resume-parser/affinda-config';
import {
  cleanString,
  cleanMultiline,
  normalizeDate,
  dedupeStrings,
  splitBullets,
  normalizeExtractedResumeData,
} from './resume-parser/normalize-extracted';
import { sanitizePersonName } from './resume-parser/import-sanitize';
import { hasMinimalAutofillPayload } from './resume-parser/map-to-upload-profile';

export type ApilayerResumePayload = Record<string, unknown>;

export class ApilayerResumeParser {
  private readonly config = getApilayerConfig();

  isAvailable(): boolean {
    return isApilayerEnabled();
  }

  async parseResume(fileBuffer: Buffer, fileName: string): Promise<ExtractedResumeData> {
    const config = this.config;
    if (!config) {
      throw new Error('ApiLayer API key not configured');
    }

    const mime = mimeTypeFromFileName(fileName);
    console.log('🔍 Parsing resume with ApiLayer...');
    console.log('   - File:', fileName, '| MIME:', mime);

    const payload = await this.requestApilayerParse(fileBuffer, fileName, mime, config);
    const transformed = transformApilayerPayload(payload);
    const normalized = normalizeExtractedResumeData(transformed);

    if (!hasMinimalAutofillPayload(normalized)) {
      throw new Error('ApiLayer returned incomplete resume data');
    }

    console.log('📋 ApiLayer normalized sections:', {
      workExperience: normalized.experience?.length ?? 0,
      education: normalized.education?.length ?? 0,
      skills: normalized.skills?.length ?? 0,
      certifications: normalized.certifications?.length ?? 0,
      languages: normalized.languages?.length ?? 0,
      confidence: normalized.confidence,
    });

    return normalized;
  }

  private async requestApilayerParse(
    fileBuffer: Buffer,
    fileName: string,
    mime: string,
    config: NonNullable<ReturnType<typeof getApilayerConfig>>
  ): Promise<ApilayerResumePayload> {
    let lastError: Error | null = null;
    const attempts = Math.max(1, config.maxRetries + 1);

    for (let attempt = 1; attempt <= attempts; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

      try {
        const response = await fetch(config.uploadUrl, {
          method: 'POST',
          headers: {
            apikey: config.apiKey,
            'Content-Type': mime,
            'Content-Disposition': `attachment; filename="${fileName.replace(/"/g, '')}"`,
          },
          body: fileBuffer,
          signal: controller.signal,
        });

        if (response.status === 429 && attempt < attempts) {
          const retryAfter = parseInt(response.headers.get('retry-after') || '2', 10);
          console.warn(`[apilayer] Rate limited (429), retrying in ${retryAfter}s (attempt ${attempt}/${attempts})`);
          await sleep(retryAfter * 1000);
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`ApiLayer API error: ${response.status} - ${errorText.slice(0, 500)}`);
        }

        const result = (await response.json()) as ApilayerResumePayload;
        if (result.message && !result.name && !result.email) {
          throw new Error(`ApiLayer API error: ${String(result.message)}`);
        }

        logApilayerRateLimitHeaders(response.headers);
        return result;
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < attempts && isRetryableApilayerError(lastError)) {
          console.warn(`[apilayer] Attempt ${attempt} failed, retrying:`, lastError.message);
          await sleep(1200);
          continue;
        }
        throw lastError;
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError || new Error('ApiLayer parse failed');
  }
}

export function transformApilayerPayload(data: ApilayerResumePayload): ExtractedResumeData {
  const fullName = sanitizePersonName(
    cleanString(data.name) ||
      cleanString(data.full_name) ||
      cleanString(data.fullName) ||
      cleanString(
        `${String(data.first_name || data.firstName || '')} ${String(data.last_name || data.lastName || '')}`.trim()
      )
  );

  const email =
    cleanString(data.email) ||
    cleanString(data.mail) ||
    asStringArray(data.emails)[0] ||
    '';

  const phone =
    cleanString(data.phone) ||
    cleanString(data.mobile) ||
    cleanString(data.telephone) ||
    asStringArray(data.phones)[0] ||
    '';

  const location =
    cleanString(data.location) ||
    cleanString(data.address) ||
    cleanString(data.city) ||
    '';

  let linkedin = cleanString(data.linkedin);
  let portfolio = cleanString(data.portfolio) || cleanString(data.website);
  const github = cleanString(data.github);

  for (const url of [
    ...asStringArray(data.websites),
    ...asStringArray(data.urls),
    ...asStringArray(data.social_links),
    ...asStringArray(data.socialLinks),
  ]) {
    const lower = url.toLowerCase();
    if (lower.includes('linkedin.com')) linkedin = linkedin || url;
    else if (lower.includes('github.com') || lower.includes('gitlab.com')) portfolio = portfolio || url;
    else if (!portfolio) portfolio = url;
  }
  if (!portfolio && github) portfolio = github;

  const jobTitle = cleanString(data.title || data.job_title || data.current_title);
  const summary = cleanMultiline(data.summary || data.objective || data.profile || data.about);

  const skills = dedupeStrings(
    [
      ...asStringArray(data.skills),
      ...asObjectArray(data.skills).map((s) => cleanString(s.name || s.skill)),
    ].filter(Boolean)
  );

  const experience = asObjectArray(data.experience || data.work_experience || data.workExperience).map(
    (exp) => {
      const dateRaw = String(exp.dates || exp.date || exp.duration || '');
      const { startDate, endDate, current } = parseApilayerDateRange(dateRaw);

      const rawDescription = String(exp.description || exp.summary || '');
      const achievements = splitBullets(rawDescription);

      return {
        company: cleanString(exp.organization || exp.company || exp.employer),
        position: cleanString(exp.title || exp.position || exp.job_title || exp.role),
        location: cleanString(exp.location),
        startDate,
        endDate: current ? '' : endDate,
        current,
        description: cleanMultiline(rawDescription),
        achievements: dedupeStrings(achievements),
      };
    }
  );

  const education = asObjectArray(data.education).map((edu) => {
    const institution = cleanString(
      edu.name || edu.organization || edu.institution || edu.school || edu.university
    );
    const degree = cleanString(edu.degree || edu.title || edu.accreditation);
    const dateRaw = String(edu.dates || edu.date || edu.year || '');
    return {
      institution,
      degree,
      field: cleanString(edu.field || edu.area || edu.major),
      startDate: normalizeDate(edu.start_date || edu.startDate),
      endDate: normalizeDate(edu.end_date || edu.endDate || dateRaw),
      gpa: cleanString(edu.gpa || edu.grade),
      description: cleanMultiline(edu.description),
    };
  });

  const certifications = asObjectArray(data.certifications)
    .map((cert) => {
      if (typeof cert === 'string') {
        return { name: cleanString(cert), issuer: '', date: '', url: '' };
      }
      return {
        name: cleanString(cert.name || cert.title),
        issuer: cleanString(cert.issuer || cert.organization),
        date: normalizeDate(cert.date || cert.issued_date),
        url: cleanString(cert.url || cert.link),
      };
    })
    .filter((c) => c.name);

  const languagesSeen = new Set<string>();
  const languages: Array<{ name: string; proficiency: string }> = [];
  for (const lang of [
    ...asObjectArray(data.languages),
    ...asStringArray(data.languages).map((name) => ({ name })),
  ]) {
    const name =
      typeof lang === 'string'
        ? cleanString(lang)
        : cleanString((lang as Record<string, unknown>).name || (lang as Record<string, unknown>).language);
    if (!name) continue;
    const key = name.toLowerCase();
    if (languagesSeen.has(key)) continue;
    languagesSeen.add(key);
    const proficiency =
      typeof lang === 'string'
        ? ''
        : cleanString(
            (lang as Record<string, unknown>).proficiency ||
              (lang as Record<string, unknown>).fluency ||
              (lang as Record<string, unknown>).level
          );
    languages.push({ name, proficiency });
  }

  const confidence = calculateApilayerConfidence({
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
    projects: [],
    certifications,
    languages,
    hobbies: dedupeStrings(asStringArray(data.hobbies || data.interests)),
    expectedSalary: '',
    preferredJobType: jobTitle,
    confidence,
    rawText: cleanString(data.raw_text || data.rawText) || '',
  };
}

function parseApilayerDateRange(raw: string): {
  startDate: string;
  endDate: string;
  current: boolean;
} {
  const text = String(raw || '').trim();
  if (!text) return { startDate: '', endDate: '', current: false };
  if (/present|current/i.test(text)) {
    const parts = text.split(/\s*[-–—to]+\s*/i);
    return {
      startDate: normalizeDate(parts[0] || ''),
      endDate: '',
      current: true,
    };
  }
  const parts = text.split(/\s*[-–—to]+\s*/i).filter(Boolean);
  if (parts.length >= 2) {
    return {
      startDate: normalizeDate(parts[0]),
      endDate: normalizeDate(parts[parts.length - 1]),
      current: false,
    };
  }
  return { startDate: normalizeDate(text), endDate: normalizeDate(text), current: false };
}

function calculateApilayerConfidence(data: {
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

function logApilayerRateLimitHeaders(headers: Headers): void {
  const monthRemaining = headers.get('x-ratelimit-remaining-month');
  const dayRemaining = headers.get('x-ratelimit-remaining-day');
  if (monthRemaining != null || dayRemaining != null) {
    console.log('[apilayer] Rate limit remaining:', {
      month: monthRemaining ?? 'n/a',
      day: dayRemaining ?? 'n/a',
    });
  }
}

function isRetryableApilayerError(error: Error): boolean {
  return (
    error.name === 'AbortError' ||
    /429|timeout|ECONNRESET|ETIMEDOUT|fetch failed/i.test(error.message)
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
