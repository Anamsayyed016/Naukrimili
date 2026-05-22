/**
 * Resume Import Data Transformer
 * Transforms AI-extracted resume data to Resume Builder format
 * Handles field name variations and data normalization
 */

import { dedupeStrings, cleanString, normalizeDate } from '@/lib/resume-parser/normalize-extracted';
import {
  splitFullName,
  sanitizeFieldText,
  sanitizeSkillEntry,
  sanitizeExperienceEntry,
  sanitizeEducationEntry,
  isGarbageResumeText,
} from '@/lib/resume-parser/import-sanitize';

/**
 * Transform AI-extracted resume data to Resume Builder format
 * Supports multiple AI extraction formats (EnhancedResumeAI, HybridResumeAI, etc.)
 */
export function transformImportDataToBuilder(importedData: any): Record<string, any> {
  if (!importedData) {
    console.error('❌ No import data provided to transformer');
    return {};
  }

  console.log('🔄 Starting transformation of imported data');
  console.log('📊 Raw imported data:', JSON.stringify(importedData, null, 2).substring(0, 1000));

  // Handle nested personalInformation structure (HybridResumeAI format)
  const personal = importedData.personalInformation || {};
  const professional = importedData.professionalInformation || {};

  const email = sanitizeFieldText(importedData.email || personal.email || '');
  const phone = sanitizeFieldText(importedData.phone || personal.phone || '');
  const location = sanitizeFieldText(
    importedData.location || importedData.address || personal.location || ''
  );
  const linkedin = sanitizeFieldText(importedData.linkedin || importedData.linkedinUrl || '');
  const portfolio = sanitizeFieldText(
    importedData.portfolio || importedData.website || importedData.github || ''
  );
  const summary = sanitizeFieldText(importedData.summary || importedData.bio || '', 4000);

  let firstName = sanitizeFieldText(importedData.firstName || personal.firstName || '', 80);
  let lastName = sanitizeFieldText(importedData.lastName || personal.lastName || '', 80);

  const rawFullName = sanitizeFieldText(
    importedData.fullName ||
      importedData.name ||
      personal.fullName ||
      `${firstName} ${lastName}`.trim(),
    120
  );

  if (!firstName && !lastName && rawFullName) {
    const split = splitFullName(rawFullName);
    firstName = split.firstName;
    lastName = split.lastName;
    console.log('👤 Split full name:', rawFullName, '→', firstName, lastName);
  } else if (firstName && !lastName && rawFullName.includes(' ')) {
    const split = splitFullName(rawFullName);
    if (!lastName) lastName = split.lastName;
  }

  const isSuspiciousName =
    !firstName ||
    isGarbageResumeText(rawFullName) ||
    rawFullName.toLowerCase().includes('uploaded') ||
    rawFullName === 'User';

  if (isSuspiciousName && email) {
    const { firstName: ef, lastName: el } = splitFullName(
      email
        .split('@')[0]
        .replace(/\d+/g, '')
        .replace(/[._-]/g, ' ')
    );
    if (ef) firstName = ef.charAt(0).toUpperCase() + ef.slice(1).toLowerCase();
    if (el) lastName = el.split(' ').map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
    console.warn('⚠️ Name derived from email:', firstName, lastName);
  }

  const displayName = [firstName, lastName].filter(Boolean).join(' ').trim();

  // Build transformed data
  const transformed: Record<string, any> = {
    firstName,
    lastName,
    name: displayName,
    email,
    phone,
    location,
    linkedin,
    portfolio,
    summary,
    bio: summary,
    jobTitle: sanitizeFieldText(
      importedData.jobTitle || professional.jobTitle || importedData.currentRole || '',
      120
    ),
    skills: dedupeStrings(
      (Array.isArray(importedData.skills) ? importedData.skills : [])
        .map((s: unknown) => sanitizeSkillEntry(s))
        .filter(Boolean)
    ),
    
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

  console.log('✅ Transformation complete:');
  console.log('   - firstName:', transformed.firstName || 'MISSING');
  console.log('   - lastName:', transformed.lastName || 'MISSING');
  console.log('   - email:', transformed.email || 'MISSING');
  console.log('   - phone:', transformed.phone || 'MISSING');
  console.log('   - location:', transformed.location || 'MISSING');
  console.log('   - skills count:', transformed.skills?.length || 0);
  console.log('   - experience count:', transformed.experience?.length || 0);
  console.log('   - education count:', transformed.education?.length || 0);

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

  const mapped = experiences
    .map((exp) => sanitizeExperienceEntry(exp as Record<string, unknown>))
    .filter((exp): exp is Record<string, unknown> => exp != null)
    .map((exp) => {
      const position = String(exp.position || exp.title || '');
      const company = String(exp.company || '');
      const startDate = normalizeDate(exp.startDate || '');
      const endDate = normalizeDate(exp.endDate || '');
      const current =
        exp.current === true ||
        !endDate ||
        String(endDate).toLowerCase() === 'present' ||
        String(endDate).toLowerCase() === 'current';
      const description = String(exp.description || '');
      const achievements = Array.isArray(exp.achievements) ? exp.achievements : [];

      return {
        title: position,
        Position: position,
        company,
        Company: company,
        location: exp.location || '',
        Location: exp.location || '',
        startDate,
        endDate: current ? 'Present' : endDate,
        Duration: exp.duration || computeDuration(startDate, endDate),
        description,
        Description: description,
        current,
        achievements,
      };
    });

  const seen = new Set<string>();
  return mapped.filter((exp) => {
    const key = `${exp.company}|${exp.title}|${exp.startDate}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Transform education array to builder format
 */
function transformEducationArray(education: any[]): any[] {
  if (!Array.isArray(education)) {
    return [];
  }

  const mapped = education
    .map((edu) => sanitizeEducationEntry(edu as Record<string, unknown>))
    .filter((edu): edu is Record<string, unknown> => edu != null)
    .map((edu) => {
      const institution = String(edu.institution || '');
      return {
        institution,
        Institution: institution,
        school: institution,
        degree: String(edu.degree || ''),
        Degree: String(edu.degree || ''),
        field: String(edu.field || ''),
        Field: String(edu.field || ''),
        year: normalizeDate(edu.year || edu.endDate || ''),
        Year: normalizeDate(edu.year || edu.endDate || ''),
        gpa: String(edu.gpa || ''),
        location: String(edu.location || ''),
        startDate: normalizeDate(edu.startDate || ''),
        endDate: normalizeDate(edu.endDate || edu.year || ''),
        description: String(edu.description || ''),
      };
    });

  const seen = new Set<string>();
  return mapped.filter((edu) => {
    const key = `${edu.institution}|${edu.degree}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
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

