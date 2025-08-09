// Minimal real AI service with safe fallbacks to avoid syntax errors and heavy deps

type AnyFile = File | { arrayBuffer: () => Promise<ArrayBuffer>; type: string };

export class RealAIService {
  // Stubs: replace with real extractors if needed
  async extractTextFromPDF(_buffer: Buffer): Promise<string> {
    return '';
  }

  async extractTextFromDOCX(_buffer: Buffer): Promise<string> {
    return '';
  }

  // Optional OpenAI-powered parsing; falls back to a naive parse when key is missing
  async parseResumeWithAI(text: string): Promise<any> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // naive fallback: extract emails and lines as skills
      const emailMatch = text.match(/[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/);
      return {
        personalInfo: { email: emailMatch?.[0] || '' },
        experience: [],
        education: [],
        skills: text
          .split(/\n|,|;/)
          .map((s) => s.trim())
          .filter((s) => s.length > 2)
          .slice(0, 10),
        summary: '',
        certifications: [],
        languages: [],
      };
    }

    try {
      const OpenAIModule = await import('openai');
      const openai = new (OpenAIModule as any)({ apiKey });
      const prompt = `Extract resume data as JSON with fields: personalInfo{name,email,phone,location}, experience[company,position,duration,description], education[degree,field,institution,year], skills[], summary, certifications[], languages[]. Text: ${text.slice(0, 8000)}`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You return only valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1500,
      });

      const content: string | undefined = response?.choices?.[0]?.message?.content;
      if (!content) throw new Error('No response content');
      return JSON.parse(content);
    } catch (err) {
      throw new Error(`AI parse failed: ${(err as Error).message}`);
    }
  }

  calculateATSScore(resumeData: any): number {
    let score = 0;
    const maxScore = 100;
    if (resumeData?.personalInfo?.email) score += 10;
    if (resumeData?.personalInfo?.phone) score += 10;
    if (Array.isArray(resumeData?.experience) && resumeData.experience.length > 0) score += 30;
    if (Array.isArray(resumeData?.education) && resumeData.education.length > 0) score += 15;
    if (Array.isArray(resumeData?.skills)) {
      if (resumeData.skills.length >= 5) score += 10;
      if (resumeData.skills.length >= 10) score += 10;
    }
    if (typeof resumeData?.summary === 'string' && resumeData.summary.length > 50) score += 10;
    if (Array.isArray(resumeData?.certifications) && resumeData.certifications.length > 0) score += 5;
    return Math.min(score, maxScore);
  }

  generateSuggestions(resumeData: any, atsScore: number): string[] {
    const suggestions: string[] = [];
    if (atsScore < 60) suggestions.push('Improve ATS compatibility across sections.');
    if (!resumeData?.personalInfo?.email) suggestions.push('Add a professional email address.');
    if (!resumeData?.personalInfo?.phone) suggestions.push('Include your phone number.');
    if (!Array.isArray(resumeData?.skills) || resumeData.skills.length < 5)
      suggestions.push('Add more relevant technical skills.');
    if (!resumeData?.summary || resumeData.summary.length < 50)
      suggestions.push('Add a professional summary section.');
    if (!Array.isArray(resumeData?.experience) || resumeData.experience.length < 2)
      suggestions.push('Include more work experience details.');
    if (!Array.isArray(resumeData?.certifications) || resumeData.certifications.length === 0)
      suggestions.push('Add relevant certifications.');
    return suggestions;
  }

  async processResume(file: AnyFile): Promise<{
    resumeData: any;
    atsScore: number;
    suggestions: string[];
    extractedText: string;
  }> {
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';
    if (file.type === 'application/pdf') {
      text = await this.extractTextFromPDF(buffer);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      text = await this.extractTextFromDOCX(buffer);
    } else {
      throw new Error('Unsupported file type');
    }

    const resumeData = await this.parseResumeWithAI(text);
    const atsScore = this.calculateATSScore(resumeData);
    const suggestions = this.generateSuggestions(resumeData, atsScore);
    return { resumeData, atsScore, suggestions, extractedText: text.slice(0, 500) };
  }
}

export const realAIService = new RealAIService();