/**
 * Central Affinda configuration — single source of truth (env only, never hardcode keys).
 */

export interface AffindaConfig {
  apiKey: string;
  workspaceId: string;
  apiUrl: string;
  timeoutMs: number;
}

const DEFAULT_API_URL = 'https://api.affinda.com/v3/documents';

export function getAffindaConfig(): AffindaConfig | null {
  const apiKey = process.env.AFFINDA_API_KEY?.trim();
  const workspaceId = process.env.AFFINDA_WORKSPACE_ID?.trim();

  if (!apiKey || !workspaceId) {
    return null;
  }

  if (apiKey.includes('your_') || workspaceId.includes('your_')) {
    return null;
  }

  return {
    apiKey,
    workspaceId,
    apiUrl: process.env.AFFINDA_API_URL?.trim() || DEFAULT_API_URL,
    timeoutMs: parseInt(process.env.AFFINDA_TIMEOUT_MS || '55000', 10),
  };
}

export function isAffindaEnabled(): boolean {
  return getAffindaConfig() !== null;
}

export function mimeTypeFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
  };
  return map[ext] || 'application/octet-stream';
}
