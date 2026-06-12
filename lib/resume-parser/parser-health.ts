/**
 * Resume document parser health — used for monitoring and debug endpoints.
 */

import { isAffindaEnabled, getAffindaConfig } from '@/lib/resume-parser/affinda-config';
import { isEdenEnabled, getEdenConfig } from '@/lib/resume-parser/eden-config';
import { isApilayerEnabled, getApilayerConfig } from '@/lib/resume-parser/apilayer-config';

export type ResumeParserHealthEntry = {
  id: 'affinda' | 'eden' | 'apilayer' | 'internal';
  enabled: boolean;
  configured: boolean;
  timeoutMs?: number;
  notes?: string;
};

export function getResumeParserHealth(): ResumeParserHealthEntry[] {
  const affinda = getAffindaConfig();
  const eden = getEdenConfig();
  const apilayer = getApilayerConfig();

  return [
    {
      id: 'affinda',
      enabled: isAffindaEnabled(),
      configured: !!affinda,
      timeoutMs: affinda?.timeoutMs,
      notes: affinda ? 'Primary document parser' : 'Set AFFINDA_API_KEY + AFFINDA_WORKSPACE_ID',
    },
    {
      id: 'eden',
      enabled: isEdenEnabled(),
      configured: !!eden,
      timeoutMs: eden?.timeoutMs,
      notes: eden ? `Providers: ${eden.providers.join(', ')}` : 'Set EDEN_AI_API_KEY',
    },
    {
      id: 'apilayer',
      enabled: isApilayerEnabled(),
      configured: !!apilayer,
      timeoutMs: apilayer?.timeoutMs,
      notes: apilayer ? 'Fallback after Eden' : 'Set APILAYER_API_KEY',
    },
    {
      id: 'internal',
      enabled: true,
      configured: true,
      notes: 'pdf-parse, mammoth, tesseract.js, text-recovery, HybridResumeAI',
    },
  ];
}
