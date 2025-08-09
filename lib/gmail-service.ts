// Minimal Gmail service placeholder to keep types stable without googleapis dependency.

export type GmailHeader = { name: string; value: string };
export type GmailBody = { data?: string; parts?: Array<{ mimeType?: string; body?: GmailBody }> };

export class GmailService {
  constructor(_accessToken: string) {}

  async getProfile(): Promise<Record<string, unknown>> {
    return { emailAddress: 'mock@example.com' };
  }

  async getEmails(_maxResults: number = 10): Promise<Record<string, unknown>> {
    return { messages: [] };
  }

  async getEmail(_messageId: string): Promise<Record<string, unknown>> {
    return { id: _messageId, snippet: '' };
  }

  async sendEmail(_to: string, _subject: string, _body: string): Promise<Record<string, unknown>> {
    return { id: `sent_${Date.now()}` };
  }

  async searchEmails(_query: string, _maxResults: number = 10): Promise<Record<string, unknown>> {
    return { messages: [] };
  }

  async getAttachment(_messageId: string, _attachmentId: string): Promise<Record<string, unknown>> {
    return { data: '' };
  }
}

export function decodeEmailBody(body?: GmailBody): string {
  if (!body) return '';
  if (body.data) return Buffer.from(body.data, 'base64').toString('utf-8');
  if (body.parts) {
    for (const part of body.parts) {
      if (part.mimeType === 'text/plain' && part.body) return decodeEmailBody(part.body);
    }
  }
  return '';
}

export function extractEmailHeaders(headers: GmailHeader[] = []): Record<string, string> {
  const map: Record<string, string> = {};
  headers.forEach(h => { map[h.name] = h.value; });
  return map;
}