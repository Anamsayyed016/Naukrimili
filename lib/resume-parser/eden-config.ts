/**
 * Eden AI resume parser configuration (env only — never hardcode keys).
 */

export interface EdenConfig {
  apiKey: string;
  apiUrl: string;
  providers: string[];
  timeoutMs: number;
}

const DEFAULT_API_URL = 'https://api.edenai.run/v2/ocr/resume_parser';
/** Try multiple Eden resume engines — hireability alone often returns empty on some PDFs. */
const DEFAULT_PROVIDERS = ['hireability', 'affinda', 'sovren'];

export function getEdenConfig(): EdenConfig | null {
  const apiKey = process.env.EDEN_AI_API_KEY?.trim();
  if (!apiKey || apiKey.includes('your_')) {
    return null;
  }

  let providers = DEFAULT_PROVIDERS;
  const providersRaw = process.env.EDEN_AI_RESUME_PROVIDERS?.trim();
  if (providersRaw) {
    try {
      const parsed = JSON.parse(providersRaw);
      if (Array.isArray(parsed) && parsed.every((p) => typeof p === 'string')) {
        providers = parsed;
      }
    } catch {
      providers = providersRaw
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
    }
  }

  return {
    apiKey,
    apiUrl: process.env.EDEN_AI_RESUME_PARSER_URL?.trim() || DEFAULT_API_URL,
    providers: providers.length > 0 ? providers : DEFAULT_PROVIDERS,
    timeoutMs: parseInt(process.env.EDEN_AI_TIMEOUT_MS || '55000', 10),
  };
}

export function isEdenEnabled(): boolean {
  return getEdenConfig() !== null;
}
