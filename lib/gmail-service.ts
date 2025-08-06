import { google } from 'googleapis';

export class GmailService {
  private gmail: Record<string, unknown>;

  constructor(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client })}

  // Get user's Gmail profile
  async getProfile() {
    try {
      const response = await this.gmail.users.getProfile({
        userId: 'me',
      });
      return response.data} catch (error) {
      console.error('Error getting Gmail profile:', error);
      throw error}
  }

  // Get emails from Gmail
  async getEmails(maxResults: number = 10) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'is:inbox', // Only inbox emails
      });
      return response.data} catch (error) {
      console.error('Error getting emails:', error);
      throw error}
  }

  // Get specific email by ID
  async getEmail(messageId: string) {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
      });
      return response.data} catch (error) {
      console.error('Error getting email:', error);
      throw error}
  }

  // Send email
  async sendEmail(to: string, subject: string, body: string) {
    try {
      const message = [
        'Content-Type: text/plain; charset="UTF-8"',
        'MIME-Version: 1.0',
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body,
      ].join('\n');

      const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });
      return response.data} catch (error) {
      console.error('Error sending email:', error);
      throw error}
  }

  // Search emails
  async searchEmails(query: string, maxResults: number = 10) {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: query,
      });
      return response.data} catch (error) {
      console.error('Error searching emails:', error);
      throw error}
  }

  // Get email attachments
  async getAttachment(messageId: string, attachmentId: string) {
    try {
      const response = await this.gmail.users.messages.attachments.get({
        userId: 'me',
        messageId,
        id: attachmentId,
      });
      return response.data} catch (error) {
      console.error('Error getting attachment:', error);
      throw error}
  }
}

// Helper function to decode email body
export function decodeEmailBody(body: Record<string, unknown>): string {
  if (!body) return '';
  
  if (body.data) {
    return Buffer.from(body.data, 'base64').toString('utf-8')}
  
  if (body.parts) {
    // Handle multipart emails
    for (const part of body.parts) {
      if (part.mimeType === 'text/plain') {
        return decodeEmailBody(part.body)}
    }
  }
  
  return ''}

// Helper function to extract email headers
export function extractEmailHeaders(headers: Record<string, unknown>[]): Record<string, string> {
  const headerMap: Record<string, string> = {};
  
  headers.forEach(header => {
    headerMap[header.name] = header.value});
  
  return headerMap} 