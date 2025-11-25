/**
 * Comprehensive Education Data for Resume Builder
 * Professional dropdown datasets for all education fields
 */

// Education Levels / Degrees
export const EDUCATION_LEVELS = [
  { value: 'high-school', label: 'High School' },
  { value: 'intermediate', label: 'Intermediate / 12th Grade' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'associate', label: 'Associate Degree' },
  { value: 'bachelor', label: "Bachelor's Degree" },
  { value: 'master', label: "Master's Degree" },
  { value: 'doctoral', label: 'Doctoral Degree' },
  { value: 'professional-cert', label: 'Professional Certification' },
  { value: 'vocational', label: 'Vocational & Training Program' },
  { value: 'custom', label: 'Custom Degree' },
] as const;

// Detailed Degree Types
export const DEGREE_TYPES = {
  'high-school': [
    { value: 'high-school', label: 'High School' },
    { value: 'ssc', label: 'SSC (10th Grade)' },
    { value: 'cbse-10', label: 'CBSE Class 10' },
    { value: 'icse-10', label: 'ICSE Class 10' },
  ],
  'intermediate': [
    { value: 'intermediate', label: 'Intermediate' },
    { value: '12th-grade', label: '12th Grade' },
    { value: 'hsc', label: 'HSC (12th Grade)' },
    { value: 'cbse-12', label: 'CBSE Class 12' },
    { value: 'icse-12', label: 'ICSE Class 12' },
    { value: 'a-levels', label: 'A-Levels' },
    { value: 'ib', label: 'International Baccalaureate (IB)' },
  ],
  'diploma': [
    { value: 'diploma', label: 'Diploma' },
    { value: 'polytechnic', label: 'Polytechnic Diploma' },
    { value: 'engineering-diploma', label: 'Engineering Diploma' },
    { value: 'it-diploma', label: 'IT Diploma' },
    { value: 'business-diploma', label: 'Business Diploma' },
    { value: 'design-diploma', label: 'Design Diploma' },
  ],
  'associate': [
    { value: 'aa', label: 'Associate of Arts (AA)' },
    { value: 'as', label: 'Associate of Science (AS)' },
    { value: 'aas', label: 'Associate of Applied Science (AAS)' },
  ],
  'bachelor': [
    { value: 'ba', label: 'Bachelor of Arts (BA)' },
    { value: 'bsc', label: 'Bachelor of Science (BSc)' },
    { value: 'bba', label: 'Bachelor of Business Administration (BBA)' },
    { value: 'btech', label: 'Bachelor of Technology (B.Tech)' },
    { value: 'be', label: 'Bachelor of Engineering (BE)' },
    { value: 'bca', label: 'Bachelor of Computer Applications (BCA)' },
    { value: 'bcom', label: 'Bachelor of Commerce (BCom)' },
    { value: 'barch', label: 'Bachelor of Architecture (B.Arch)' },
    { value: 'llb', label: 'Bachelor of Laws (LLB)' },
    { value: 'bpharm', label: 'Bachelor of Pharmacy (B.Pharm)' },
    { value: 'bds', label: 'Bachelor of Dental Surgery (BDS)' },
    { value: 'mbbs', label: 'Bachelor of Medicine, Bachelor of Surgery (MBBS)' },
    { value: 'bsc-nursing', label: 'Bachelor of Science in Nursing (BSc Nursing)' },
    { value: 'bfa', label: 'Bachelor of Fine Arts (BFA)' },
    { value: 'bed', label: 'Bachelor of Education (B.Ed)' },
  ],
  'master': [
    { value: 'ma', label: 'Master of Arts (MA)' },
    { value: 'msc', label: 'Master of Science (MSc)' },
    { value: 'mba', label: 'Master of Business Administration (MBA)' },
    { value: 'mtech', label: 'Master of Technology (M.Tech)' },
    { value: 'me', label: 'Master of Engineering (ME)' },
    { value: 'mca', label: 'Master of Computer Applications (MCA)' },
    { value: 'mcom', label: 'Master of Commerce (MCom)' },
    { value: 'march', label: 'Master of Architecture (M.Arch)' },
    { value: 'llm', label: 'Master of Laws (LLM)' },
    { value: 'mpharm', label: 'Master of Pharmacy (M.Pharm)' },
    { value: 'md', label: 'Doctor of Medicine (MD)' },
    { value: 'ms', label: 'Master of Surgery (MS)' },
    { value: 'mfa', label: 'Master of Fine Arts (MFA)' },
    { value: 'med', label: 'Master of Education (M.Ed)' },
    { value: 'mphil', label: 'Master of Philosophy (M.Phil)' },
  ],
  'doctoral': [
    { value: 'phd', label: 'Doctor of Philosophy (PhD)' },
    { value: 'dphil', label: 'Doctor of Philosophy (DPhil)' },
    { value: 'edd', label: 'Doctor of Education (EdD)' },
    { value: 'md-research', label: 'Doctor of Medicine (Research)' },
    { value: 'jd', label: 'Doctor of Jurisprudence (JD)' },
    { value: 'dba', label: 'Doctor of Business Administration (DBA)' },
  ],
  'professional-cert': [
    { value: 'ca', label: 'Chartered Accountant (CA)' },
    { value: 'cpa', label: 'Certified Public Accountant (CPA)' },
    { value: 'cfa', label: 'Chartered Financial Analyst (CFA)' },
    { value: 'cma', label: 'Certified Management Accountant (CMA)' },
    { value: 'aws', label: 'AWS Certification' },
    { value: 'azure', label: 'Microsoft Azure Certification' },
    { value: 'gcp', label: 'Google Cloud Platform Certification' },
    { value: 'pmp', label: 'Project Management Professional (PMP)' },
    { value: 'scrum', label: 'Scrum Master Certification' },
    { value: 'cisco', label: 'Cisco Certification (CCNA, CCNP, etc.)' },
    { value: 'oracle', label: 'Oracle Certification' },
    { value: 'salesforce', label: 'Salesforce Certification' },
  ],
  'vocational': [
    { value: 'vocational', label: 'Vocational Training' },
    { value: 'apprenticeship', label: 'Apprenticeship' },
    { value: 'trade-school', label: 'Trade School' },
    { value: 'technical-training', label: 'Technical Training' },
  ],
  'custom': [
    { value: 'custom', label: 'Custom Degree' },
  ],
} as const;

// Top International Universities
export const INTERNATIONAL_UNIVERSITIES = [
  'Harvard University',
  'Massachusetts Institute of Technology (MIT)',
  'Stanford University',
  'University of Cambridge',
  'University of Oxford',
  'California Institute of Technology (Caltech)',
  'University of Chicago',
  'Princeton University',
  'Yale University',
  'Columbia University',
  'University of Pennsylvania',
  'Cornell University',
  'University of California, Berkeley',
  'University of California, Los Angeles (UCLA)',
  'New York University (NYU)',
  'University of Michigan',
  'University of Toronto',
  'University of British Columbia',
  'McGill University',
  'ETH Zurich',
  'University of Tokyo',
  'National University of Singapore (NUS)',
  'Tsinghua University',
  'Peking University',
  'University of Melbourne',
  'University of Sydney',
  'Imperial College London',
  'University College London (UCL)',
  'London School of Economics (LSE)',
  'King\'s College London',
] as const;

// Top Indian Universities
export const INDIAN_UNIVERSITIES = [
  // IITs
  'Indian Institute of Technology (IIT) Bombay',
  'Indian Institute of Technology (IIT) Delhi',
  'Indian Institute of Technology (IIT) Madras',
  'Indian Institute of Technology (IIT) Kanpur',
  'Indian Institute of Technology (IIT) Kharagpur',
  'Indian Institute of Technology (IIT) Roorkee',
  'Indian Institute of Technology (IIT) Guwahati',
  'Indian Institute of Technology (IIT) Hyderabad',
  'Indian Institute of Technology (IIT) Indore',
  'Indian Institute of Technology (IIT) Patna',
  'Indian Institute of Technology (IIT) Ropar',
  'Indian Institute of Technology (IIT) Bhubaneswar',
  'Indian Institute of Technology (IIT) Gandhinagar',
  'Indian Institute of Technology (IIT) Mandi',
  'Indian Institute of Technology (IIT) Jodhpur',
  'Indian Institute of Technology (IIT) Tirupati',
  'Indian Institute of Technology (IIT) Palakkad',
  'Indian Institute of Technology (IIT) Dhanbad',
  'Indian Institute of Technology (IIT) Bhilai',
  'Indian Institute of Technology (IIT) Goa',
  'Indian Institute of Technology (IIT) Jammu',
  'Indian Institute of Technology (IIT) Dharwad',
  
  // NITs
  'National Institute of Technology (NIT) Trichy',
  'National Institute of Technology (NIT) Surathkal',
  'National Institute of Technology (NIT) Warangal',
  'National Institute of Technology (NIT) Calicut',
  'National Institute of Technology (NIT) Rourkela',
  'National Institute of Technology (NIT) Allahabad',
  'National Institute of Technology (NIT) Kurukshetra',
  'National Institute of Technology (NIT) Jaipur',
  'National Institute of Technology (NIT) Nagpur',
  'National Institute of Technology (NIT) Durgapur',
  
  // Other Premier Institutes
  'Indian Institute of Science (IISc) Bangalore',
  'Indian Institute of Management (IIM) Ahmedabad',
  'Indian Institute of Management (IIM) Bangalore',
  'Indian Institute of Management (IIM) Calcutta',
  'Indian Institute of Management (IIM) Lucknow',
  'Indian Institute of Management (IIM) Indore',
  'Indian Institute of Management (IIM) Kozhikode',
  'All India Institute of Medical Sciences (AIIMS) Delhi',
  'Jawaharlal Nehru University (JNU)',
  'Delhi University (DU)',
  'Mumbai University (MU)',
  'University of Calcutta',
  'University of Madras',
  'Banaras Hindu University (BHU)',
  'Aligarh Muslim University (AMU)',
  'Jadavpur University',
  'Anna University',
  'Birla Institute of Technology and Science (BITS) Pilani',
  'Vellore Institute of Technology (VIT)',
  'Manipal Academy of Higher Education',
  'Amity University',
  'SRM Institute of Science and Technology',
  'Lovely Professional University (LPU)',
  'Symbiosis International University',
  'Pune University',
  'Bangalore University',
  'Osmania University',
  'Andhra University',
  'Calcutta University',
] as const;

// Online Platforms
export const ONLINE_PLATFORMS = [
  'Coursera',
  'Udemy',
  'edX',
  'Google (Google Career Certificates)',
  'Meta (Meta Professional Certificates)',
  'Microsoft Learn',
  'Amazon Web Services (AWS) Training',
  'LinkedIn Learning',
  'Udacity',
  'Khan Academy',
  'Codecademy',
  'Pluralsight',
  'FreeCodeCamp',
  'The Odin Project',
  'MIT OpenCourseWare',
  'Stanford Online',
  'Harvard Online',
] as const;

// Community Colleges (Sample)
export const COMMUNITY_COLLEGES = [
  'Community College',
  'Junior College',
  'City College',
  'State College',
] as const;

// All Institutions Combined - Lazy initialization to avoid TDZ issues
let allInstitutionsCache: string[] | null = null;

export function getAllInstitutions(): string[] {
  if (!allInstitutionsCache) {
    // Use Array.from and concat to avoid spread operator TDZ issues
    const international = Array.from(INTERNATIONAL_UNIVERSITIES);
    const indian = Array.from(INDIAN_UNIVERSITIES);
    const online = Array.from(ONLINE_PLATFORMS);
    const community = Array.from(COMMUNITY_COLLEGES);
    allInstitutionsCache = international.concat(indian, online, community);
  }
  return allInstitutionsCache;
}

// Fields of Study - Categorized
export const FIELDS_OF_STUDY = {
  'Computer Science & IT': [
    'Computer Science',
    'Information Technology',
    'Software Engineering',
    'Computer Engineering',
    'Artificial Intelligence',
    'Machine Learning',
    'Data Science',
    'Cybersecurity',
    'Web Development',
    'Mobile App Development',
    'Cloud Computing',
    'DevOps',
    'Database Management',
    'Network Engineering',
    'Information Systems',
    'Human-Computer Interaction',
    'Game Development',
    'Blockchain Technology',
  ],
  'Engineering': [
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Electronics Engineering',
    'Aerospace Engineering',
    'Biomedical Engineering',
    'Environmental Engineering',
    'Industrial Engineering',
    'Automotive Engineering',
    'Marine Engineering',
    'Petroleum Engineering',
    'Materials Science',
    'Robotics',
  ],
  'Business': [
    'Business Administration',
    'Finance',
    'Marketing',
    'Human Resources',
    'Management',
    'Accounting',
    'Economics',
    'Entrepreneurship',
    'Operations Management',
    'Supply Chain Management',
    'International Business',
    'Business Analytics',
    'Project Management',
    'Strategic Management',
  ],
  'Medicine & Health': [
    'Medicine (MBBS)',
    'Nursing',
    'Pharmacy',
    'Dentistry',
    'Physiotherapy',
    'Public Health',
    'Biomedical Sciences',
    'Veterinary Medicine',
    'Medical Laboratory Science',
    'Radiology',
    'Anesthesiology',
  ],
  'Arts': [
    'Fine Arts',
    'Graphic Design',
    'Interior Design',
    'Fashion Design',
    'Industrial Design',
    'Visual Arts',
    'Digital Arts',
    'Animation',
    'Film Studies',
    'Photography',
    'Music',
    'Theater',
    'Literature',
    'Creative Writing',
  ],
  'Social Sciences': [
    'Psychology',
    'Sociology',
    'Political Science',
    'International Relations',
    'Anthropology',
    'History',
    'Geography',
    'Social Work',
    'Criminology',
    'Journalism',
    'Mass Communication',
  ],
  'Education & Teaching': [
    'Education',
    'Teaching',
    'Early Childhood Education',
    'Special Education',
    'Educational Technology',
    'Curriculum Development',
  ],
  'Law': [
    'Law',
    'Constitutional Law',
    'Criminal Law',
    'Corporate Law',
    'International Law',
    'Intellectual Property Law',
  ],
  'Science': [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Biotechnology',
    'Environmental Science',
    'Statistics',
    'Astronomy',
    'Geology',
  ],
  'Other': [
    'Agriculture',
    'Architecture',
    'Aviation',
    'Culinary Arts',
    'Hospitality Management',
    'Sports Science',
    'Custom Field',
  ],
} as const;

// Location Data - Countries
export const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Singapore',
  'United Arab Emirates',
  'Japan',
  'China',
  'South Korea',
  'Netherlands',
  'Switzerland',
  'Sweden',
  'Other',
] as const;

// Indian States
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Puducherry',
] as const;

// Major Indian Cities
export const INDIAN_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Surat',
  'Lucknow',
  'Kanpur',
  'Nagpur',
  'Indore',
  'Thane',
  'Bhopal',
  'Visakhapatnam',
  'Patna',
  'Vadodara',
  'Ghaziabad',
  'Ludhiana',
  'Agra',
  'Nashik',
  'Faridabad',
  'Meerut',
  'Rajkot',
  'Varanasi',
  'Srinagar',
  'Amritsar',
  'Allahabad',
  'Howrah',
  'Coimbatore',
  'Jabalpur',
  'Gwalior',
  'Vijayawada',
  'Madurai',
  'Raipur',
  'Kota',
  'Guwahati',
  'Chandigarh',
] as const;

// Special Location Options
export const SPECIAL_LOCATIONS = [
  'Remote',
  'Online Program',
  'Distance Mode',
  'Hybrid',
] as const;

// Generate Years (1980 to current year)
export const generateYears = (): Array<{ value: string; label: string }> => {
  const currentYear = new Date().getFullYear();
  const years: Array<{ value: string; label: string }> = [
    { value: 'pursuing', label: 'Pursuing / Ongoing' },
  ];
  
  for (let year = currentYear; year >= 1980; year--) {
    years.push({ value: year.toString(), label: year.toString() });
  }
  
  return years;
};

// CGPA / Score Formats
export const SCORE_FORMATS = [
  { value: 'cgpa-10', label: 'CGPA (out of 10)' },
  { value: 'cgpa-4', label: 'CGPA (out of 4)' },
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'letter-grade', label: 'Letter Grade (A+, A, B+, etc.)' },
  { value: 'gpa', label: 'GPA' },
  { value: 'first-class', label: 'First Class' },
  { value: 'second-class', label: 'Second Class' },
  { value: 'distinction', label: 'Distinction' },
  { value: 'other', label: 'Other' },
] as const;

// Honors & Awards
export const HONORS_AWARDS = [
  { value: 'summa-cum-laude', label: 'Summa Cum Laude' },
  { value: 'magna-cum-laude', label: 'Magna Cum Laude' },
  { value: 'cum-laude', label: 'Cum Laude' },
  { value: 'deans-list', label: "Dean's List" },
  { value: 'honor-roll', label: 'Honor Roll' },
  { value: 'merit-scholarship', label: 'Merit Scholarship' },
  { value: 'distinction', label: 'Distinction' },
  { value: 'gold-medal', label: 'Gold Medal' },
  { value: 'silver-medal', label: 'Silver Medal' },
  { value: 'best-student', label: 'Best Student Award' },
  { value: 'academic-excellence', label: 'Academic Excellence Award' },
  { value: 'research-award', label: 'Research Award' },
  { value: 'custom', label: 'Custom Award' },
] as const;

// Helper function to get all field of study options as flat array
export const getAllFieldsOfStudy = (): string[] => {
  return Object.values(FIELDS_OF_STUDY).flat();
};

// Helper function to search institutions
export const searchInstitutions = (query: string): string[] => {
  const lowerQuery = query.toLowerCase();
  const institutions = getAllInstitutions();
  return institutions.filter(inst => 
    inst.toLowerCase().includes(lowerQuery)
  ).slice(0, 20); // Limit to 20 results
};

