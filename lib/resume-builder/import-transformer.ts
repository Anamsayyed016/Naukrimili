/**
 * Resume Import Data Transformer
 * Transforms AI-extracted resume data to Resume Builder format
 * Handles field name variations and data normalization
 */

/**
 * Transform AI-extracted resume data to Resume Builder format
 * Supports multiple AI extraction formats (EnhancedResumeAI, HybridResumeAI, etc.)
 */
export function transformImportDataToBuilder(importedData: any): Record<string, any> {
  if (!importedData) {
    return {};
  }

  // Handle nested personalInformation structure (HybridResumeAI format)
  const personal = importedData.personalInformation || {};
  const professional = importedData.professionalInformation || {};

  // Extract name (handle various formats)
  const fullName = importedData.fullName || 
                   importedData.name || 
                   personal.fullName ||
                   `${importedData.firstName || ''} ${importedData.lastName || ''}`.trim();
  
  const nameParts = fullName.split(' ').filter(Boolean);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Build transformed data
  const transformed: Record<string, any> = {
    // ===== CONTACTS STEP =====
    firstName: firstName || importedData.firstName || '',
    lastName: lastName || importedData.lastName || '',
    name: fullName, // Keep full name as backup
    email: importedData.email || personal.email || '',
    phone: importedData.phone || personal.phone || '',
    location: importedData.location || 
              importedData.address || 
              personal.location || '',
    linkedin: importedData.linkedin || 
              importedData.linkedinUrl || '',
    portfolio: importedData.portfolio || 
               importedData.website || 
               importedData.portfolioUrl || 
               importedData.github || '',
    
    // ===== SUMMARY STEP =====
    summary: importedData.summary || '',
    bio: importedData.summary || '', // Alias
    
    // Professional title
    jobTitle: importedData.jobTitle || 
              professional.jobTitle || 
              importedData.currentRole || 
              importedData.title || '',
    
    // ===== SKILLS STEP =====
    // Direct copy - format is already compatible (string[])
    skills: Array.isArray(importedData.skills) 
      ? importedData.skills 
      : [],
    
    // ===== EXPERIENCE STEP =====
    // Transform experience entries - handle field name variations
    experience: transformExperienceArray(
      importedData.experience || []
    ),
    
    // ===== EDUCATION STEP =====
    // Transform education entries
    education: transformEducationArray(
      importedData.education || []
    ),
    
    // ===== PROJECTS STEP =====
    // Direct copy with minor normalization
    projects: transformProjectsArray(
      importedData.projects || []
    ),
    
    // ===== CERTIFICATIONS STEP =====
    // Direct copy with normalization
    certifications: transformCertificationsArray(
      importedData.certifications || []
    ),
    
    // ===== LANGUAGES STEP =====
    // Transform languages (handle string[] or object[] formats)
    languages: transformLanguagesArray(
      importedData.languages || []
    ),
    
    // ===== ACHIEVEMENTS STEP =====
    achievements: transformAchievementsArray(
      importedData.achievements || []
    ),
    
    // ===== HOBBIES STEP =====
    hobbies: Array.isArray(importedData.hobbies) 
      ? importedData.hobbies 
      : [],
    
    // ===== METADATA =====
    _imported: true,
    _importedAt: Date.now(),
    _importSource: 'ai-extraction',
    _resumeId: importedData.resumeId || null,
    _confidence: importedData.confidence || 85,
    _atsScore: importedData.atsScore || 90,
  };

  return transformed;
}

/**
 * Transform experience array to builder format
 * Handles multiple field name variations
 */
function transformExperienceArray(experiences: any[]): any[] {
  if (!Array.isArray(experiences)) {
    return [];
  }

  return experiences.map(exp => {
    // Extract position/title (multiple possible field names)
    const position = exp.position || 
                    exp.role || 
                    exp.job_title || 
                    exp.jobTitle || 
                    exp.title || '';
    
    // Extract company (multiple possible field names)
    const company = exp.company || 
                   exp.organization || 
                   exp.employer || '';
    
    // Extract dates
    const startDate = exp.startDate || 
                     exp.start_date || 
                     exp.from || '';
    
    const endDate = exp.endDate || 
                   exp.end_date || 
                   exp.to || 
                   (exp.current ? 'Present' : '');
    
    // Determine if current job
    const current = exp.current === true || 
                   !endDate || 
                   endDate.toLowerCase() === 'present' ||
                   endDate.toLowerCase() === 'current';
    
    // Extract description
    const description = exp.description || 
                       exp.summary || 
                       exp.responsibilities || 
                       '';
    
    // Format achievements
    const achievements = Array.isArray(exp.achievements) 
      ? exp.achievements 
      : exp.achievements 
        ? [exp.achievements] 
        : [];

    return {
      // Builder supports BOTH field names for maximum compatibility
      title: position,
      Position: position,
      company: company,
      Company: company,
      location: exp.location || '',
      Location: exp.location || '',
      startDate: startDate,
      endDate: endDate,
      Duration: exp.duration || exp.Duration || computeDuration(startDate, endDate),
      description: description,
      Description: description,
      current: current,
      achievements: achievements,
    };
  });
}

/**
 * Transform education array to builder format
 */
function transformEducationArray(education: any[]): any[] {
  if (!Array.isArray(education)) {
    return [];
  }

  return education.map(edu => {
    return {
      institution: edu.institution || 
                  edu.school || 
                  edu.university || 
                  edu.college || '',
      degree: edu.degree || 
             edu.qualification || 
             edu.degreeType || '',
      field: edu.field || 
            edu.major || 
            edu.fieldOfStudy || 
            edu.specialization || '',
      year: edu.year || 
           edu.endDate || 
           edu.end_date || 
           edu.graduationYear || '',
      gpa: edu.gpa || 
          edu.cgpa || 
          edu.grade || '',
      location: edu.location || '',
      startDate: edu.startDate || edu.start_date || '',
      endDate: edu.endDate || edu.end_date || edu.year || '',
      description: edu.description || 
                  edu.achievements || 
                  edu.honors || '',
    };
  });
}

/**
 * Transform projects array to builder format
 */
function transformProjectsArray(projects: any[]): any[] {
  if (!Array.isArray(projects)) {
    return [];
  }

  return projects.map(proj => {
    // Handle string format (just project names)
    if (typeof proj === 'string') {
      return {
        name: proj,
        title: proj,
        description: '',
        technologies: [],
        url: '',
      };
    }

    return {
      name: proj.name || proj.title || proj.projectName || '',
      title: proj.name || proj.title || '',
      description: proj.description || proj.summary || '',
      technologies: Array.isArray(proj.technologies) 
        ? proj.technologies 
        : Array.isArray(proj.tech_stack)
          ? proj.tech_stack
          : Array.isArray(proj.techStack)
            ? proj.techStack
            : [],
      url: proj.url || proj.link || proj.projectUrl || '',
      startDate: proj.startDate || proj.start_date || '',
      endDate: proj.endDate || proj.end_date || '',
    };
  });
}

/**
 * Transform certifications array to builder format
 */
function transformCertificationsArray(certifications: any[]): any[] {
  if (!Array.isArray(certifications)) {
    return [];
  }

  return certifications.map(cert => {
    // Handle string format (just cert names)
    if (typeof cert === 'string') {
      return {
        name: cert,
        issuer: '',
        date: '',
        url: '',
      };
    }

    return {
      name: cert.name || cert.title || cert.certification || '',
      issuer: cert.issuer || 
             cert.organization || 
             cert.issuingOrganization || '',
      date: cert.date || 
           cert.issued_date || 
           cert.issuedDate || 
           cert.year || '',
      url: cert.url || cert.link || cert.credentialUrl || '',
      expiryDate: cert.expiryDate || cert.expiry_date || '',
    };
  });
}

/**
 * Transform languages array to builder format
 */
function transformLanguagesArray(languages: any[]): any[] {
  if (!Array.isArray(languages)) {
    return [];
  }

  return languages.map(lang => {
    // Handle string format (just language names)
    if (typeof lang === 'string') {
      return {
        name: lang,
        proficiency: 'Fluent',
      };
    }

    return {
      name: lang.name || lang.language || '',
      proficiency: lang.proficiency || 
                  lang.level || 
                  lang.fluency || 
                  'Fluent',
    };
  });
}

/**
 * Transform achievements array to builder format
 */
function transformAchievementsArray(achievements: any[]): any[] {
  if (!Array.isArray(achievements)) {
    return [];
  }

  return achievements.map(achievement => {
    // Handle string format
    if (typeof achievement === 'string') {
      return {
        title: achievement,
        description: '',
        date: '',
      };
    }

    return {
      title: achievement.title || achievement.name || achievement.achievement || '',
      description: achievement.description || achievement.details || '',
      date: achievement.date || achievement.year || '',
      impact: achievement.impact || '',
    };
  });
}

/**
 * Compute duration from start and end dates
 */
function computeDuration(startDate: string, endDate: string): string {
  if (!startDate) return '';
  
  const end = endDate || 'Present';
  return `${startDate} - ${end}`;
}

/**
 * Validate transformed data - ensure no corrupted fields
 */
export function validateTransformedData(data: Record<string, any>): {
  valid: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!data.firstName && !data.name) {
    issues.push('Missing first name');
  }
  if (!data.email) {
    warnings.push('Missing email address');
  }

  // Check array fields are actually arrays
  if (data.skills && !Array.isArray(data.skills)) {
    issues.push('Skills field is not an array');
  }
  if (data.experience && !Array.isArray(data.experience)) {
    issues.push('Experience field is not an array');
  }
  if (data.education && !Array.isArray(data.education)) {
    issues.push('Education field is not an array');
  }

  // Check for empty critical arrays
  if (Array.isArray(data.skills) && data.skills.length === 0) {
    warnings.push('No skills extracted');
  }
  if (Array.isArray(data.experience) && data.experience.length === 0) {
    warnings.push('No experience entries extracted');
  }
  if (Array.isArray(data.education) && data.education.length === 0) {
    warnings.push('No education entries extracted');
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
  };
}

/**
 * Preview transformation without applying
 * Useful for debugging and showing user what will be filled
 */
export function previewTransformation(importedData: any): {
  fieldsCount: number;
  contactsReady: boolean;
  experienceCount: number;
  educationCount: number;
  skillsCount: number;
  optionalFields: string[];
} {
  const transformed = transformImportDataToBuilder(importedData);

  return {
    fieldsCount: Object.keys(transformed).filter(k => !k.startsWith('_')).length,
    contactsReady: !!(transformed.firstName && transformed.email),
    experienceCount: Array.isArray(transformed.experience) ? transformed.experience.length : 0,
    educationCount: Array.isArray(transformed.education) ? transformed.education.length : 0,
    skillsCount: Array.isArray(transformed.skills) ? transformed.skills.length : 0,
    optionalFields: [
      transformed.projects?.length > 0 ? 'projects' : null,
      transformed.certifications?.length > 0 ? 'certifications' : null,
      transformed.languages?.length > 0 ? 'languages' : null,
      transformed.achievements?.length > 0 ? 'achievements' : null,
      transformed.hobbies?.length > 0 ? 'hobbies' : null,
    ].filter(Boolean) as string[],
  };
}

