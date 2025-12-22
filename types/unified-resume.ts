/**
 * UNIFIED RESUME DATA STRUCTURE
 * Lead Engineer & Code Guardian - Single Source of Truth
 * 
 * This file contains the canonical resume data structure used across
 * the entire application. All other interfaces must align with this.
 * 
 * PROTECTION MEASURES:
 * - Immutable interface definitions
 * - Comprehensive Zod validation
 * - Backward compatibility maintained
 * - Type safety enforced
 */

import { z } from 'zod';

// ============================================================================
// CORE DATA TYPES
// ============================================================================

export const SkillLevelSchema = z.enum(['beginner', 'intermediate', 'advanced', 'expert']);
export const LanguageProficiencySchema = z.enum(['basic', 'conversational', 'intermediate', 'fluent', 'native']);
export const TemplateStyleSchema = z.enum(['modern', 'classic', 'creative', 'minimal', 'executive', 'tech']);
export const ColorSchemeSchema = z.enum(['blue', 'green', 'purple', 'gray', 'black', 'navy', 'brown', 'orange', 'teal', 'pink', 'charcoal', 'burgundy', 'gold']);

// ============================================================================
// PERSONAL INFORMATION
// ============================================================================

export const PersonalInfoSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  location: z.string().optional(),
  linkedin: z.string().url().optional().or(z.literal('')),
  portfolio: z.string().url().optional().or(z.literal('')),
  summary: z.string().min(10, 'Professional summary must be at least 10 characters'),
  profilePhoto: z.string().optional(), // Base64 encoded image
  hasProfilePhoto: z.boolean().default(false),
});

// ============================================================================
// EDUCATION
// ============================================================================

export const EducationSchema = z.object({
  id: z.string(),
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  field: z.string().min(1, 'Field of study is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  gpa: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  isCurrent: z.boolean().default(false),
});

// ============================================================================
// WORK EXPERIENCE
// ============================================================================

export const WorkExperienceSchema = z.object({
  id: z.string(),
  company: z.string().min(1, 'Company is required'),
  position: z.string().min(1, 'Position is required'),
  location: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  description: z.string().optional(),
  achievements: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
});

// ============================================================================
// SKILLS
// ============================================================================

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Skill name is required'),
  level: SkillLevelSchema.default('intermediate'),
  yearsOfExperience: z.number().min(0).max(50).optional(),
  category: z.string().optional(), // e.g., 'Technical', 'Soft Skills', 'Languages'
});

// ============================================================================
// PROJECTS
// ============================================================================

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(10, 'Project description must be at least 10 characters'),
  technologies: z.array(z.string()).default([]),
  url: z.string().url().optional().or(z.literal('')),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  achievements: z.array(z.string()).default([]),
  isCurrent: z.boolean().default(false),
});

// ============================================================================
// CERTIFICATIONS
// ============================================================================

export const CertificationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  date: z.string().min(1, 'Certification date is required'),
  url: z.string().url().optional().or(z.literal('')),
  validUntil: z.string().optional(),
  credentialId: z.string().optional(),
});

// ============================================================================
// LANGUAGES
// ============================================================================

export const LanguageSchema = z.object({
  id: z.string(),
  language: z.string().min(1, 'Language is required'),
  proficiency: LanguageProficiencySchema.default('intermediate'),
  isNative: z.boolean().default(false),
});

// ============================================================================
// INTERESTS
// ============================================================================

export const InterestSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Interest name is required'),
  keywords: z.array(z.string()).default([]),
});

// ============================================================================
// REFERENCES
// ============================================================================

export const ReferenceSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Reference name is required'),
  position: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  relationship: z.string().optional(), // e.g., 'Former Manager', 'Colleague'
});

// ============================================================================
// MAIN RESUME DATA SCHEMA
// ============================================================================

export const UnifiedResumeDataSchema = z.object({
  // Personal Information
  personalInfo: PersonalInfoSchema,
  
  // Core Sections
  education: z.array(EducationSchema).default([]),
  experience: z.array(WorkExperienceSchema).default([]),
  skills: z.array(SkillSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  certifications: z.array(CertificationSchema).default([]),
  languages: z.array(LanguageSchema).default([]),
  interests: z.array(InterestSchema).default([]),
  references: z.array(ReferenceSchema).default([]),
  
  // Template & Styling
  template: z.object({
    style: TemplateStyleSchema.default('modern'),
    colorScheme: ColorSchemeSchema.default('blue'),
    fontFamily: z.enum(['sans', 'serif', 'mono']).default('sans'),
    showProfilePhoto: z.boolean().default(false),
  }),
  
  // Metadata
  metadata: z.object({
    createdAt: z.date().default(() => new Date()),
    updatedAt: z.date().default(() => new Date()),
    version: z.string().default('1.0.0'),
    atsScore: z.number().min(0).max(100).default(0),
    completeness: z.number().min(0).max(100).default(0),
  }),
});

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type WorkExperience = z.infer<typeof WorkExperienceSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type Interest = z.infer<typeof InterestSchema>;
export type Reference = z.infer<typeof ReferenceSchema>;
export type UnifiedResumeData = z.infer<typeof UnifiedResumeDataSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export class ResumeValidator {
  static validate(data: unknown): { success: boolean; data?: UnifiedResumeData; errors?: string[] } {
    try {
      const validatedData = UnifiedResumeDataSchema.parse(data);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { success: false, errors: ['Unknown validation error'] };
    }
  }

  static validatePartial(data: unknown, section: keyof UnifiedResumeData): { success: boolean; errors?: string[] } {
    try {
      const sectionSchema = UnifiedResumeDataSchema.shape[section];
      sectionSchema.parse(data);
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
      }
      return { success: false, errors: ['Unknown validation error'] };
    }
  }
}

// ============================================================================
// DEFAULT DATA FACTORY
// ============================================================================

export class ResumeDataFactory {
  static createEmpty(): UnifiedResumeData {
    return {
      personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        portfolio: '',
        summary: '',
        profilePhoto: '',
        hasProfilePhoto: false,
      },
      education: [],
      experience: [],
      skills: [],
      projects: [],
      certifications: [],
      languages: [],
      interests: [],
      references: [],
      template: {
        style: 'modern',
        colorScheme: 'blue',
        fontFamily: 'sans',
        showProfilePhoto: false,
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        atsScore: 0,
        completeness: 0,
      },
    };
  }

  static createId(): string {
    return `resume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// MIGRATION HELPERS (for backward compatibility)
// ============================================================================

export class ResumeDataMigrator {
  static fromLegacyBuilder(data: any): UnifiedResumeData {
    const migrated = ResumeDataFactory.createEmpty();
    
    // Migrate personal info
    if (data.personalInfo) {
      migrated.personalInfo = {
        fullName: data.personalInfo.fullName || '',
        email: data.personalInfo.email || '',
        phone: data.personalInfo.phone || '',
        location: data.personalInfo.location || '',
        linkedin: data.personalInfo.linkedin || '',
        portfolio: data.personalInfo.portfolio || '',
        summary: data.personalInfo.summary || '',
        profilePhoto: data.personalInfo.profilePhoto || '',
        hasProfilePhoto: data.personalInfo.hasProfilePhoto || false,
      };
    }

    // Migrate education
    if (data.education) {
      migrated.education = data.education.map((edu: any) => ({
        id: edu.id || ResumeDataFactory.createId(),
        institution: edu.institution || '',
        degree: edu.degree || '',
        field: edu.field || '',
        startDate: edu.startDate || '',
        endDate: edu.endDate || '',
        gpa: edu.gpa || '',
        description: edu.description || '',
        location: edu.location || '',
        isCurrent: edu.isCurrent || false,
      }));
    }

    // Migrate experience
    if (data.experience) {
      migrated.experience = data.experience.map((exp: any) => ({
        id: exp.id || ResumeDataFactory.createId(),
        company: exp.company || '',
        position: exp.position || '',
        location: exp.location || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        current: exp.current || false,
        description: exp.description || '',
        achievements: exp.achievements || [],
        responsibilities: exp.responsibilities || [],
        technologies: exp.technologies || [],
      }));
    }

    // Migrate skills
    if (data.skills) {
      migrated.skills = data.skills.map((skill: any) => ({
        id: skill.id || ResumeDataFactory.createId(),
        name: skill.name || '',
        level: skill.level || 'intermediate',
        yearsOfExperience: skill.yearsOfExperience,
        category: skill.category || '',
      }));
    }

    // Migrate projects
    if (data.projects) {
      migrated.projects = data.projects.map((project: any) => ({
        id: project.id || ResumeDataFactory.createId(),
        name: project.name || '',
        description: project.description || '',
        technologies: project.technologies || [],
        url: project.url || '',
        startDate: project.startDate || '',
        endDate: project.endDate || '',
        achievements: project.achievements || [],
        isCurrent: project.isCurrent || false,
      }));
    }

    // Migrate certifications
    if (data.certifications) {
      migrated.certifications = data.certifications.map((cert: any) => ({
        id: cert.id || ResumeDataFactory.createId(),
        name: cert.name || '',
        issuer: cert.issuer || '',
        date: cert.date || '',
        url: cert.url || '',
        validUntil: cert.validUntil || '',
        credentialId: cert.credentialId || '',
      }));
    }

    // Migrate template settings
    if (data.templateStyle) {
      migrated.template.style = data.templateStyle;
    }
    if (data.colorScheme) {
      migrated.template.colorScheme = data.colorScheme;
    }
    if (data.fontFamily) {
      migrated.template.fontFamily = data.fontFamily;
    }

    return migrated;
  }
}
