import { HybridResumeAI } from './hybrid-resume-ai';

interface SuccessMessageContext {
  action: 'company_created' | 'job_posted' | 'profile_updated' | 'application_reviewed';
  companyName?: string;
  jobTitle?: string;
  userName?: string;
  additionalData?: any;
}

export class AISuccessMessages {
  private hybridAI: HybridResumeAI;

  constructor() {
    this.hybridAI = new HybridResumeAI();
  }

  async generateSuccessMessage(context: SuccessMessageContext): Promise<string> {
    try {
      const prompt = this.buildPrompt(context);
      const response = await this.hybridAI.generateText(prompt);
      return response || this.getFallbackMessage(context);
    } catch (error) {
      console.error('Error generating AI success message:', error);
      return this.getFallbackMessage(context);
    }
  }

  private buildPrompt(context: SuccessMessageContext): string {
    const basePrompt = `Generate a professional, encouraging success message for a job portal employer. The message should be:
- Professional but warm and encouraging
- Specific to the action taken
- Include relevant next steps or tips
- Be concise (1-2 sentences)
- Use a positive, motivating tone

Context:`;

    switch (context.action) {
      case 'company_created':
        return `${basePrompt}
Action: Company profile created successfully
Company: ${context.companyName || 'Your company'}
Message should congratulate on creating the company profile and suggest next steps like posting their first job.`;

      case 'job_posted':
        return `${basePrompt}
Action: Job posted successfully
Job Title: ${context.jobTitle || 'the job'}
Company: ${context.companyName || 'Your company'}
Message should congratulate on posting the job and mention that it's now live and visible to job seekers.`;

      case 'profile_updated':
        return `${basePrompt}
Action: Company profile updated successfully
Company: ${context.companyName || 'Your company'}
Message should confirm the profile update and mention how it helps attract better candidates.`;

      case 'application_reviewed':
        return `${basePrompt}
Action: Application reviewed successfully
Job Title: ${context.jobTitle || 'the job'}
Message should confirm the application review and suggest next steps in the hiring process.`;

      default:
        return `${basePrompt}
Action: ${context.action}
Message should be a general success confirmation.`;
    }
  }

  private getFallbackMessage(context: SuccessMessageContext): string {
    switch (context.action) {
      case 'company_created':
        return `🎉 Congratulations! Your company profile has been created successfully. You're now ready to start attracting top talent. Consider posting your first job to get started!`;
      
      case 'job_posted':
        return `🚀 Excellent! Your job posting "${context.jobTitle || 'position'}" is now live and visible to thousands of job seekers. You should start receiving applications soon!`;
      
      case 'profile_updated':
        return `✅ Your company profile has been updated successfully! A complete profile helps attract better candidates and builds trust with potential applicants.`;
      
      case 'application_reviewed':
        return `📋 Application reviewed successfully! You can now proceed with the next steps in your hiring process.`;
      
      default:
        return `✅ Action completed successfully!`;
    }
  }

  // Static method for quick access without AI
  static getQuickMessage(context: SuccessMessageContext): string {
    const messages = {
      company_created: `🎉 Welcome to NaukriMili! Your company profile is ready. Start posting jobs to find the perfect candidates.`,
      job_posted: `🚀 Job posted successfully! Your listing is now live and attracting candidates.`,
      profile_updated: `✅ Profile updated! Your company information is now current and attractive to job seekers.`,
      application_reviewed: `📋 Application processed! Ready for the next step in your hiring journey.`
    };

    return messages[context.action] || '✅ Action completed successfully!';
  }
}
