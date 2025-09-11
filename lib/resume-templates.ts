/**
 * MODERN RESUME TEMPLATE SYSTEM
 * Lead Engineer & Code Guardian - Professional Template Management
 * 
 * Provides modern, ATS-friendly resume templates with photo support
 * and comprehensive customization options.
 */

import { UnifiedResumeData, TemplateStyle, ColorScheme } from '@/types/unified-resume';

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateStyle;
  difficulty: 'easy' | 'medium' | 'advanced';
  features: string[];
  preview: string;
  colorSchemes: ColorScheme[];
  fontOptions: string[];
  hasPhotoSupport: boolean;
  isATSOptimized: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  layout: {
    header: 'centered' | 'left' | 'right';
    sections: 'single-column' | 'two-column' | 'mixed';
    spacing: 'compact' | 'standard' | 'spacious';
  };
}

export interface TemplateCustomization {
  templateId: string;
  colorScheme: ColorScheme;
  fontFamily: 'sans' | 'serif' | 'mono';
  showProfilePhoto: boolean;
  spacing: 'compact' | 'standard' | 'spacious';
  customColors?: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
}

export class ResumeTemplateManager {
  private static templates: ResumeTemplate[] = [
    {
      id: 'modern-professional',
      name: 'Modern Professional',
      description: 'Clean, contemporary design perfect for tech and business roles',
      category: 'modern',
      difficulty: 'easy',
      features: ['ATS Optimized', 'Clean Layout', 'Professional Colors', 'Photo Support'],
      preview: '/templates/modern-professional/preview',
      colorSchemes: ['blue', 'green', 'purple', 'gray'],
      fontOptions: ['sans', 'serif'],
      hasPhotoSupport: true,
      isATSOptimized: true,
      isPopular: true,
      layout: {
        header: 'centered',
        sections: 'two-column',
        spacing: 'standard'
      }
    },
    {
      id: 'classic-formal',
      name: 'Classic Formal',
      description: 'Traditional layout ideal for corporate and academic positions',
      category: 'classic',
      difficulty: 'easy',
      features: ['Traditional Layout', 'Formal Typography', 'Conservative Design', 'Wide Compatibility'],
      preview: '/templates/classic-formal/preview',
      colorSchemes: ['black', 'navy', 'gray', 'brown'],
      fontOptions: ['serif', 'sans'],
      hasPhotoSupport: false,
      isATSOptimized: true,
      layout: {
        header: 'left',
        sections: 'single-column',
        spacing: 'standard'
      }
    },
    {
      id: 'creative-portfolio',
      name: 'Creative Portfolio',
      description: 'Eye-catching design for creative professionals and designers',
      category: 'creative',
      difficulty: 'medium',
      features: ['Visual Appeal', 'Creative Layout', 'Color Accents', 'Portfolio Ready'],
      preview: '/templates/creative-portfolio/preview',
      colorSchemes: ['purple', 'orange', 'teal', 'pink'],
      fontOptions: ['sans', 'serif'],
      hasPhotoSupport: true,
      isATSOptimized: true,
      isNew: true,
      layout: {
        header: 'right',
        sections: 'mixed',
        spacing: 'spacious'
      }
    },
    {
      id: 'minimal-clean',
      name: 'Minimal Clean',
      description: 'Simple and focused design that puts content first',
      category: 'minimal',
      difficulty: 'easy',
      features: ['Minimal Design', 'Content Focused', 'Fast Loading', 'Mobile Friendly'],
      preview: '/templates/minimal-clean/preview',
      colorSchemes: ['gray', 'black', 'blue', 'green'],
      fontOptions: ['sans', 'mono'],
      hasPhotoSupport: false,
      isATSOptimized: true,
      layout: {
        header: 'left',
        sections: 'single-column',
        spacing: 'compact'
      }
    },
    {
      id: 'executive-premium',
      name: 'Executive Premium',
      description: 'Sophisticated design for senior-level professionals',
      category: 'executive',
      difficulty: 'advanced',
      features: ['Executive Style', 'Premium Layout', 'Advanced Customization', 'Print Ready'],
      preview: '/templates/executive-premium/preview',
      colorSchemes: ['navy', 'charcoal', 'burgundy', 'gold'],
      fontOptions: ['serif', 'sans'],
      hasPhotoSupport: true,
      isATSOptimized: true,
      layout: {
        header: 'centered',
        sections: 'two-column',
        spacing: 'spacious'
      }
    },
    {
      id: 'tech-focused',
      name: 'Tech Focused',
      description: 'Modern design optimized for technology and engineering roles',
      category: 'tech',
      difficulty: 'medium',
      features: ['Tech Optimized', 'Skill Highlighting', 'Project Showcase', 'Code Friendly'],
      preview: '/templates/tech-focused/preview',
      colorSchemes: ['blue', 'green', 'purple', 'orange'],
      fontOptions: ['mono', 'sans'],
      hasPhotoSupport: true,
      isATSOptimized: true,
      layout: {
        header: 'left',
        sections: 'two-column',
        spacing: 'standard'
      }
    },
    {
      id: 'modern-photo',
      name: 'Modern with Photo',
      description: 'Professional design with prominent photo placement',
      category: 'modern',
      difficulty: 'easy',
      features: ['Photo Prominent', 'Professional Layout', 'ATS Optimized', 'Visual Impact'],
      preview: '/templates/modern-photo/preview',
      colorSchemes: ['blue', 'green', 'purple', 'gray'],
      fontOptions: ['sans', 'serif'],
      hasPhotoSupport: true,
      isATSOptimized: true,
      isNew: true,
      layout: {
        header: 'left',
        sections: 'two-column',
        spacing: 'standard'
      }
    },
    {
      id: 'creative-photo',
      name: 'Creative with Photo',
      description: 'Bold design with creative photo integration',
      category: 'creative',
      difficulty: 'medium',
      features: ['Creative Photo Layout', 'Visual Appeal', 'Unique Design', 'Portfolio Ready'],
      preview: '/templates/creative-photo/preview',
      colorSchemes: ['purple', 'orange', 'teal', 'pink'],
      fontOptions: ['sans', 'serif'],
      hasPhotoSupport: true,
      isATSOptimized: true,
      isNew: true,
      layout: {
        header: 'right',
        sections: 'mixed',
        spacing: 'spacious'
      }
    }
  ];

  /**
   * Get all available templates
   */
  static getAllTemplates(): ResumeTemplate[] {
    return this.templates;
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category: TemplateStyle): ResumeTemplate[] {
    return this.templates.filter(template => template.category === category);
  }

  /**
   * Get template by ID
   */
  static getTemplateById(id: string): ResumeTemplate | undefined {
    return this.templates.find(template => template.id === id);
  }

  /**
   * Get templates with photo support
   */
  static getTemplatesWithPhotoSupport(): ResumeTemplate[] {
    return this.templates.filter(template => template.hasPhotoSupport);
  }

  /**
   * Get ATS-optimized templates
   */
  static getATSOptimizedTemplates(): ResumeTemplate[] {
    return this.templates.filter(template => template.isATSOptimized);
  }

  /**
   * Get popular templates
   */
  static getPopularTemplates(): ResumeTemplate[] {
    return this.templates.filter(template => template.isPopular);
  }

  /**
   * Get new templates
   */
  static getNewTemplates(): ResumeTemplate[] {
    return this.templates.filter(template => template.isNew);
  }

  /**
   * Search templates by name or description
   */
  static searchTemplates(query: string): ResumeTemplate[] {
    const lowercaseQuery = query.toLowerCase();
    return this.templates.filter(template => 
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.features.some(feature => feature.toLowerCase().includes(lowercaseQuery))
    );
  }

  /**
   * Get recommended templates based on user data
   */
  static getRecommendedTemplates(resumeData: UnifiedResumeData): ResumeTemplate[] {
    const recommendations: ResumeTemplate[] = [];
    
    // Check if user has photo
    if (resumeData.personalInfo.hasProfilePhoto) {
      recommendations.push(...this.getTemplatesWithPhotoSupport());
    } else {
      recommendations.push(...this.templates.filter(t => !t.hasPhotoSupport));
    }

    // Check experience level
    const experienceCount = resumeData.experience.length;
    if (experienceCount >= 5) {
      // Senior level - recommend executive templates
      recommendations.push(...this.getTemplatesByCategory('executive'));
    } else if (experienceCount >= 2) {
      // Mid level - recommend modern and tech templates
      recommendations.push(...this.getTemplatesByCategory('modern'));
      recommendations.push(...this.getTemplatesByCategory('tech'));
    } else {
      // Entry level - recommend simple templates
      recommendations.push(...this.getTemplatesByCategory('minimal'));
      recommendations.push(...this.getTemplatesByCategory('classic'));
    }

    // Remove duplicates and return
    return [...new Map(recommendations.map(t => [t.id, t])).values()];
  }

  /**
   * Validate template customization
   */
  static validateCustomization(customization: TemplateCustomization): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    const template = this.getTemplateById(customization.templateId);
    if (!template) {
      errors.push('Invalid template ID');
      return { valid: false, errors };
    }

    if (!template.colorSchemes.includes(customization.colorScheme)) {
      errors.push(`Color scheme ${customization.colorScheme} not supported by template ${template.name}`);
    }

    if (!template.fontOptions.includes(customization.fontFamily)) {
      errors.push(`Font family ${customization.fontFamily} not supported by template ${template.name}`);
    }

    if (customization.showProfilePhoto && !template.hasPhotoSupport) {
      errors.push(`Template ${template.name} does not support profile photos`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get template CSS classes
   */
  static getTemplateClasses(templateId: string, customization: TemplateCustomization): string {
    const template = this.getTemplateById(templateId);
    if (!template) return '';

    const classes = [
      `template-${templateId}`,
      `color-${customization.colorScheme}`,
      `font-${customization.fontFamily}`,
      `spacing-${customization.spacing}`,
      customization.showProfilePhoto ? 'with-photo' : 'without-photo',
      template.layout.header,
      template.layout.sections
    ];

    return classes.join(' ');
  }

  /**
   * Get template-specific CSS variables
   */
  static getTemplateCSSVariables(templateId: string, customization: TemplateCustomization): Record<string, string> {
    const template = this.getTemplateById(templateId);
    if (!template) return {};

    const colorMap: Record<ColorScheme, Record<string, string>> = {
      blue: {
        primary: '#2563eb',
        secondary: '#1e40af',
        accent: '#3b82f6',
        text: '#1e293b',
        background: '#ffffff'
      },
      green: {
        primary: '#059669',
        secondary: '#047857',
        accent: '#10b981',
        text: '#064e3b',
        background: '#ffffff'
      },
      purple: {
        primary: '#7c3aed',
        secondary: '#6d28d9',
        accent: '#8b5cf6',
        text: '#581c87',
        background: '#ffffff'
      },
      gray: {
        primary: '#374151',
        secondary: '#1f2937',
        accent: '#6b7280',
        text: '#111827',
        background: '#ffffff'
      },
      black: {
        primary: '#000000',
        secondary: '#1f2937',
        accent: '#374151',
        text: '#000000',
        background: '#ffffff'
      },
      navy: {
        primary: '#1e3a8a',
        secondary: '#1e40af',
        accent: '#3b82f6',
        text: '#1e3a8a',
        background: '#ffffff'
      },
      brown: {
        primary: '#92400e',
        secondary: '#b45309',
        accent: '#d97706',
        text: '#78350f',
        background: '#ffffff'
      },
      orange: {
        primary: '#ea580c',
        secondary: '#dc2626',
        accent: '#f97316',
        text: '#9a3412',
        background: '#ffffff'
      },
      teal: {
        primary: '#0d9488',
        secondary: '#0f766e',
        accent: '#14b8a6',
        text: '#134e4a',
        background: '#ffffff'
      },
      pink: {
        primary: '#db2777',
        secondary: '#be185d',
        accent: '#ec4899',
        text: '#831843',
        background: '#ffffff'
      },
      charcoal: {
        primary: '#1f2937',
        secondary: '#111827',
        accent: '#374151',
        text: '#1f2937',
        background: '#ffffff'
      },
      burgundy: {
        primary: '#7f1d1d',
        secondary: '#991b1b',
        accent: '#dc2626',
        text: '#7f1d1d',
        background: '#ffffff'
      },
      gold: {
        primary: '#d97706',
        secondary: '#b45309',
        accent: '#f59e0b',
        text: '#92400e',
        background: '#ffffff'
      }
    };

    const colors = colorMap[customization.colorScheme] || colorMap.blue;
    
    return {
      '--template-primary': colors.primary,
      '--template-secondary': colors.secondary,
      '--template-accent': colors.accent,
      '--template-text': colors.text,
      '--template-background': colors.background,
      '--template-font-family': customization.fontFamily === 'sans' ? 'Inter, system-ui, sans-serif' :
                                customization.fontFamily === 'serif' ? 'Georgia, serif' :
                                'JetBrains Mono, monospace'
    };
  }

  /**
   * Generate template preview data
   */
  static generatePreviewData(templateId: string, customization: TemplateCustomization): Partial<UnifiedResumeData> {
    return {
      personalInfo: {
        fullName: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        linkedin: 'linkedin.com/in/johndoe',
        portfolio: 'johndoe.dev',
        summary: 'Experienced software engineer with 5+ years developing scalable web applications. Led cross-functional teams and delivered projects 20% ahead of schedule.',
        profilePhoto: '',
        hasProfilePhoto: customization.showProfilePhoto
      },
      experience: [
        {
          id: 'exp1',
          company: 'Tech Corp',
          position: 'Senior Software Engineer',
          location: 'San Francisco, CA',
          startDate: '2020-01',
          endDate: '2023-12',
          current: false,
          description: 'Led development of microservices architecture',
          achievements: ['Increased system performance by 40%', 'Reduced deployment time by 60%'],
          responsibilities: ['Architecture design', 'Team leadership', 'Code review'],
          technologies: ['React', 'Node.js', 'AWS', 'Docker']
        }
      ],
      education: [
        {
          id: 'edu1',
          institution: 'University of California',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2016-09',
          endDate: '2020-05',
          gpa: '3.8',
          description: 'Graduated Magna Cum Laude',
          location: 'Berkeley, CA',
          isCurrent: false
        }
      ],
      skills: [
        { id: 'skill1', name: 'JavaScript', level: 'expert', yearsOfExperience: 5, category: 'Technical' },
        { id: 'skill2', name: 'React', level: 'expert', yearsOfExperience: 4, category: 'Technical' },
        { id: 'skill3', name: 'Node.js', level: 'advanced', yearsOfExperience: 3, category: 'Technical' },
        { id: 'skill4', name: 'Leadership', level: 'advanced', yearsOfExperience: 2, category: 'Soft Skills' }
      ],
      projects: [
        {
          id: 'proj1',
          name: 'E-commerce Platform',
          description: 'Built a full-stack e-commerce platform serving 10,000+ users',
          technologies: ['React', 'Node.js', 'PostgreSQL'],
          url: 'https://example.com',
          startDate: '2022-01',
          endDate: '2022-06',
          achievements: ['40% increase in conversion rate', '99.9% uptime'],
          isCurrent: false
        }
      ],
      template: {
        style: templateId.split('-')[0] as any,
        colorScheme: customization.colorScheme,
        fontFamily: customization.fontFamily,
        showProfilePhoto: customization.showProfilePhoto
      }
    };
  }
}
