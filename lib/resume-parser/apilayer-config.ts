/**
 * ApiLayer Resume Parser configuration (env only — never hardcode keys).
 */

export interface ApilayerConfig {
  apiKey: string;
  uploadUrl: string;
  timeoutMs: number;
  maxRetries: number;
}

const DEFAULT_UPLOAD_URL = 'https://api.apilayer.com/resume_parser/upload';

export function getApilayerConfig(): ApilayerConfig | null {
  const apiKey = process.env.APILAYER_API_KEY?.trim();
  if (!apiKey || apiKey.includes('your_')) {
    return null;
  }

  return {
    apiKey,
    uploadUrl: process.env.APILAYER_RESUME_PARSER_URL?.trim() || DEFAULT_UPLOAD_URL,
    timeoutMs: parseInt(process.env.APILAYER_TIMEOUT_MS || '15000', 10),
    maxRetries: parseInt(process.env.APILAYER_MAX_RETRIES || '1', 10),
  };
}

export function isApilayerEnabled(): boolean {
  return getApilayerConfig() !== null;
}
