export interface JobSector {
  id: string;
  name: string;
  icon: string;
  description: string;
  keywords: string[];
  jobTitles: string[];
  skills: string[];
  companies: string[];
  locations: string[];
  salaryRanges: {
    entry: { min: number; max: number };
    mid: { min: number; max: number };
    senior: { min: number; max: number };
    executive: { min: number; max: number };
  };
}

export const JOB_SECTORS: JobSector[] = [
  {
    id: 'technology',
    name: 'Technology & IT',
    icon: '💻',
    description: 'Software development, IT services, and technology solutions',
    keywords: ['software', 'developer', 'programming', 'coding', 'web', 'mobile', 'app', 'database', 'cloud', 'ai', 'machine learning', 'data science', 'devops', 'cybersecurity'],
    jobTitles: [
      'Software Engineer', 'Web Developer', 'Mobile App Developer', 'Full Stack Developer',
      'Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'Data Scientist',
      'Machine Learning Engineer', 'AI Engineer', 'Cloud Engineer', 'Cybersecurity Analyst'
    ],
    skills: [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue.js', 'TypeScript',
      'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git', 'SQL', 'MongoDB', 'Redis'
    ],
    companies: [
      'TechCorp Solutions', 'InnovateTech', 'Digital Dynamics', 'CodeCraft Labs',
      'ByteBridge Systems', 'Quantum Solutions', 'TechNova', 'Innovation Hub'
    ],
    locations: [
      'Bangalore, Karnataka', 'Mumbai, Maharashtra', 'Hyderabad, Telangana',
      'Pune, Maharashtra', 'Delhi, NCR', 'Chennai, Tamil Nadu'
    ],
    salaryRanges: {
      entry: { min: 400000, max: 800000 },
      mid: { min: 800000, max: 2000000 },
      senior: { min: 2000000, max: 4500000 },
      executive: { min: 4500000, max: 10000000 }
    }
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Medical',
    icon: '🏥',
    description: 'Medical technology, pharmaceuticals, and healthcare services',
    keywords: ['medical', 'healthcare', 'nursing', 'doctor', 'pharmacy', 'therapy', 'patient', 'clinical', 'hospital', 'clinic', 'diagnostic', 'treatment'],
    jobTitles: [
      'Medical Doctor', 'Registered Nurse', 'Pharmacist', 'Medical Assistant',
      'Physiotherapist', 'Occupational Therapist', 'Speech Therapist', 'Clinical Psychologist',
      'Medical Technologist', 'Radiologist', 'Surgeon', 'General Practitioner'
    ],
    skills: [
      'Patient Care', 'Medical Procedures', 'Clinical Assessment', 'Medical Documentation',
      'Healthcare Regulations', 'Medical Equipment', 'Diagnostic Testing', 'Treatment Planning'
    ],
    companies: [
      'HealthTech Systems', 'MediCare Plus', 'Wellness Solutions', 'HealthFirst',
      'Medical Innovations', 'CareConnect', 'HealthBridge', 'MedTech Solutions'
    ],
    locations: [
      'Mumbai, Maharashtra', 'Delhi, NCR', 'Bangalore, Karnataka', 'Chennai, Tamil Nadu',
      'Hyderabad, Telangana', 'Kolkata, West Bengal'
    ],
    salaryRanges: {
      entry: { min: 300000, max: 600000 },
      mid: { min: 600000, max: 1500000 },
      senior: { min: 1500000, max: 3500000 },
      executive: { min: 3500000, max: 8000000 }
    }
  },
  {
    id: 'finance',
    name: 'Finance & Banking',
    icon: '💰',
    description: 'Banking, fintech, and financial services',
    keywords: ['finance', 'banking', 'accounting', 'investment', 'insurance', 'financial', 'bank', 'credit', 'loan', 'tax', 'audit', 'risk', 'compliance'],
    jobTitles: [
      'Financial Analyst', 'Accountant', 'Investment Banker', 'Insurance Agent',
      'Credit Analyst', 'Risk Manager', 'Compliance Officer', 'Treasury Analyst',
      'Portfolio Manager', 'Wealth Manager', 'Tax Consultant', 'Auditor'
    ],
    skills: [
      'Financial Analysis', 'Accounting', 'Risk Assessment', 'Compliance', 'Investment Management',
      'Portfolio Analysis', 'Financial Modeling', 'Tax Planning', 'Auditing', 'Budgeting'
    ],
    companies: [
      'FinTech Innovations', 'Global Finance Corp', 'SecureBank', 'Wealth Solutions',
      'Investment Hub', 'Financial Dynamics', 'BankTech', 'Finance First'
    ],
    locations: [
      'Mumbai, Maharashtra', 'Delhi, NCR', 'Bangalore, Karnataka', 'Chennai, Tamil Nadu',
      'Hyderabad, Telangana', 'Kolkata, West Bengal'
    ],
    salaryRanges: {
      entry: { min: 350000, max: 700000 },
      mid: { min: 700000, max: 1800000 },
      senior: { min: 1800000, max: 4000000 },
      executive: { min: 4000000, max: 12000000 }
    }
  }
];

export function getSectorById(id: string): JobSector | undefined {
  return JOB_SECTORS.find(sector => sector.id === id);
}

export function getAllSectors(): JobSector[] {
  return JOB_SECTORS;
}

export function getSectorKeywords(sectorId: string): string[] {
  const sector = getSectorById(sectorId);
  return sector ? sector.keywords : [];
}

export function getRandomJobTitle(sectorId: string): string {
  const sector = getSectorById(sectorId);
  if (!sector) return 'Professional';
  return sector.jobTitles[Math.floor(Math.random() * sector.jobTitles.length)];
}

export function getRandomCompany(sectorId: string): string {
  const sector = getSectorById(sectorId);
  if (!sector) return 'Company';
  return sector.companies[Math.floor(Math.random() * sector.companies.length)];
}

export function getRandomLocation(sectorId: string): string {
  const sector = getSectorById(sectorId);
  if (!sector) return 'India';
  return sector.locations[Math.floor(Math.random() * sector.locations.length)];
}

export function getSalaryRange(sectorId: string, experienceLevel: string): { min: number; max: number } {
  const sector = getSectorById(sectorId);
  if (!sector) return { min: 300000, max: 800000 };
  
  switch (experienceLevel) {
    case 'entry': return sector.salaryRanges.entry;
    case 'mid': return sector.salaryRanges.mid;
    case 'senior': return sector.salaryRanges.senior;
    case 'executive': return sector.salaryRanges.executive;
    default: return sector.salaryRanges.mid;
  }
}
