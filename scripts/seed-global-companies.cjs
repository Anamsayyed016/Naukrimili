#!/usr/bin/env node

/**
 * GLOBAL COMPANIES SEEDING SCRIPT
 * Seeds 50+ well-known global companies across all sectors
 * Uses UPSERT to prevent duplicates
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function normalizeCompanyName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(
      /\b(inc|llc|ltd|limited|corp|corporation|company|co\.|plc|pvt|private|group|holdings)\b/gi,
      ' '
    )
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function extractDomain(url) {
  if (!url) return null;
  try {
    const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return host.replace(/^www\./i, '').toLowerCase();
  } catch {
    return null;
  }
}

function favicon(domain) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

async function findExistingCompany(companyData) {
  const exact = await prisma.company.findFirst({
    where: { name: { equals: companyData.name, mode: 'insensitive' } },
  });
  if (exact) return exact;

  const norm = normalizeCompanyName(companyData.name);
  if (norm) {
    const all = await prisma.company.findMany({ select: { id: true, name: true } });
    const match = all.find((c) => normalizeCompanyName(c.name) === norm);
    if (match) {
      return prisma.company.findUnique({ where: { id: match.id } });
    }
  }

  const domain = extractDomain(companyData.website);
  if (domain) {
    const byDomain = await prisma.company.findFirst({
      where: {
        OR: [
          { website: { contains: domain, mode: 'insensitive' } },
          { careerPageUrl: { contains: domain, mode: 'insensitive' } },
        ],
      },
    });
    if (byDomain) return byDomain;
  }

  return null;
}

// Comprehensive global companies across all sectors
const globalCompanies = [
  // ==================== TECHNOLOGY ====================
  {
    name: 'Google',
    description: 'Google is a multinational technology company specializing in Internet-related services and products, including online advertising technologies, search engine, cloud computing, software, and hardware.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/272px-Google_2015_logo.svg.png',
    website: 'https://www.google.com',
    careerPageUrl: 'https://careers.google.com',
    location: 'Mountain View, California, USA',
    industry: 'Technology',
    sector: 'Technology',
    size: '100,000+',
    founded: 1998,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Microsoft',
    description: 'Microsoft Corporation is an American multinational technology company which produces computer software, consumer electronics, personal computers, and related services.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/2560px-Microsoft_logo.svg.png',
    website: 'https://www.microsoft.com',
    careerPageUrl: 'https://careers.microsoft.com',
    location: 'Redmond, Washington, USA',
    industry: 'Technology',
    sector: 'Technology',
    size: '100,000+',
    founded: 1975,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Amazon',
    description: 'Amazon.com, Inc. is an American multinational technology company focusing on e-commerce, cloud computing, digital streaming, and artificial intelligence.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png',
    website: 'https://www.amazon.com',
    careerPageUrl: 'https://www.amazon.jobs',
    location: 'Seattle, Washington, USA',
    industry: 'Technology',
    sector: 'Technology & Retail',
    size: '100,000+',
    founded: 1994,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Apple',
    description: 'Apple Inc. is an American multinational technology company that specializes in consumer electronics, computer software, and online services.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1667px-Apple_logo_black.svg.png',
    website: 'https://www.apple.com',
    careerPageUrl: 'https://jobs.apple.com',
    location: 'Cupertino, California, USA',
    industry: 'Technology',
    sector: 'Technology',
    size: '100,000+',
    founded: 1976,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Meta',
    description: 'Meta Platforms, Inc., doing business as Meta, is an American multinational technology conglomerate focused on social networking and virtual reality.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/2560px-Meta_Platforms_Inc._logo.svg.png',
    website: 'https://www.meta.com',
    careerPageUrl: 'https://www.metacareers.com',
    location: 'Menlo Park, California, USA',
    industry: 'Technology',
    sector: 'Technology',
    size: '100,000+',
    founded: 2004,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'IBM',
    description: 'International Business Machines Corporation (IBM) is an American multinational technology corporation specializing in computer hardware, middleware, and software.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/IBM_logo.svg/2560px-IBM_logo.svg.png',
    website: 'https://www.ibm.com',
    careerPageUrl: 'https://www.ibm.com/careers',
    location: 'Armonk, New York, USA',
    industry: 'Technology',
    sector: 'Technology',
    size: '100,000+',
    founded: 1911,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Oracle',
    description: 'Oracle Corporation is an American multinational computer technology corporation specializing in database software and cloud computing.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Oracle_logo.svg/2560px-Oracle_logo.svg.png',
    website: 'https://www.oracle.com',
    careerPageUrl: 'https://www.oracle.com/careers',
    location: 'Austin, Texas, USA',
    industry: 'Technology',
    sector: 'Technology',
    size: '100,000+',
    founded: 1977,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Adobe',
    description: 'Adobe Inc. is an American multinational computer software company focused on the creation of multimedia and creativity software products.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Adobe_Corporate_Logo.svg/2560px-Adobe_Corporate_Logo.svg.png',
    website: 'https://www.adobe.com',
    careerPageUrl: 'https://www.adobe.com/careers',
    location: 'San Jose, California, USA',
    industry: 'Technology',
    sector: 'Technology',
    size: '10,000+',
    founded: 1982,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Netflix',
    description: 'Netflix, Inc. is an American subscription streaming service and production company offering a library of films and television series.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/2560px-Netflix_2015_logo.svg.png',
    website: 'https://www.netflix.com',
    careerPageUrl: 'https://jobs.netflix.com',
    location: 'Los Gatos, California, USA',
    industry: 'Entertainment',
    sector: 'Entertainment & Technology',
    size: '10,000+',
    founded: 1997,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'SAP',
    description: 'SAP SE is a German multinational software corporation that develops enterprise software to manage business operations and customer relations.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/SAP_2011_logo.svg/2560px-SAP_2011_logo.svg.png',
    website: 'https://www.sap.com',
    careerPageUrl: 'https://jobs.sap.com',
    location: 'Walldorf, Germany',
    industry: 'Technology',
    sector: 'Technology',
    size: '100,000+',
    founded: 1972,
    isVerified: true,
    isGlobal: true
  },

  // ==================== INDIAN IT GIANTS ====================
  {
    name: 'Tata Consultancy Services (TCS)',
    description: 'TCS is an Indian multinational information technology services and consulting company, and a subsidiary of the Tata Group.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Tata_Consultancy_Services_Logo.svg/2560px-Tata_Consultancy_Services_Logo.svg.png',
    website: 'https://www.tcs.com',
    careerPageUrl: 'https://www.tcs.com/careers',
    location: 'Mumbai, Maharashtra, India',
    industry: 'Technology',
    sector: 'IT Services',
    size: '100,000+',
    founded: 1968,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Infosys',
    description: 'Infosys Limited is an Indian multinational information technology company that provides business consulting, information technology and outsourcing services.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Infosys_logo.svg/2560px-Infosys_logo.svg.png',
    website: 'https://www.infosys.com',
    careerPageUrl: 'https://www.infosys.com/careers',
    location: 'Bangalore, Karnataka, India',
    industry: 'Technology',
    sector: 'IT Services',
    size: '100,000+',
    founded: 1981,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Wipro',
    description: 'Wipro Limited is an Indian multinational corporation that provides information technology, consulting and business process services.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Wipro_Primary_Logo_Color_RGB.svg/2560px-Wipro_Primary_Logo_Color_RGB.svg.png',
    website: 'https://www.wipro.com',
    careerPageUrl: 'https://careers.wipro.com',
    location: 'Bangalore, Karnataka, India',
    industry: 'Technology',
    sector: 'IT Services',
    size: '100,000+',
    founded: 1945,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'HCL Technologies',
    description: 'HCL Technologies is an Indian multinational information technology services and consulting company.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/HCL_Tech_Bee.svg/2560px-HCL_Tech_Bee.svg.png',
    website: 'https://www.hcltech.com',
    careerPageUrl: 'https://www.hcltech.com/careers',
    location: 'Noida, Uttar Pradesh, India',
    industry: 'Technology',
    sector: 'IT Services',
    size: '100,000+',
    founded: 1976,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Tech Mahindra',
    description: 'Tech Mahindra is an Indian multinational technology company providing information technology (IT), networking technology solutions and Business Process Outsourcing.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Tech_Mahindra_New_Logo.svg/2560px-Tech_Mahindra_New_Logo.svg.png',
    website: 'https://www.techmahindra.com',
    careerPageUrl: 'https://www.techmahindra.com/careers',
    location: 'Pune, Maharashtra, India',
    industry: 'Technology',
    sector: 'IT Services',
    size: '100,000+',
    founded: 1986,
    isVerified: true,
    isGlobal: true
  },

  // ==================== CONSULTING & PROFESSIONAL SERVICES ====================
  {
    name: 'Deloitte',
    description: 'Deloitte is one of the "Big Four" accounting organizations and the largest professional services network in the world by revenue and number of professionals.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Deloitte.svg/2560px-Deloitte.svg.png',
    website: 'https://www.deloitte.com',
    careerPageUrl: 'https://www2.deloitte.com/global/en/careers.html',
    location: 'London, United Kingdom',
    industry: 'Consulting',
    sector: 'Consulting & Professional Services',
    size: '100,000+',
    founded: 1845,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'PwC',
    description: 'PricewaterhouseCoopers is a multinational professional services network of firms, operating as partnerships under the PwC brand.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/PwC_Logo.svg/2560px-PwC_Logo.svg.png',
    website: 'https://www.pwc.com',
    careerPageUrl: 'https://www.pwc.com/gx/en/careers.html',
    location: 'London, United Kingdom',
    industry: 'Consulting',
    sector: 'Consulting & Professional Services',
    size: '100,000+',
    founded: 1998,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'EY (Ernst & Young)',
    description: 'Ernst & Young is a multinational professional services partnership and one of the Big Four accounting firms.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Ernst_%26_Young_logo.svg/2560px-Ernst_%26_Young_logo.svg.png',
    website: 'https://www.ey.com',
    careerPageUrl: 'https://www.ey.com/en_gl/careers',
    location: 'London, United Kingdom',
    industry: 'Consulting',
    sector: 'Consulting & Professional Services',
    size: '100,000+',
    founded: 1989,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'KPMG',
    description: 'KPMG is a multinational professional services network, and one of the Big Four accounting organizations.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/KPMG_logo.svg/2560px-KPMG_logo.svg.png',
    website: 'https://home.kpmg',
    careerPageUrl: 'https://home.kpmg/xx/en/home/careers.html',
    location: 'Amstelveen, Netherlands',
    industry: 'Consulting',
    sector: 'Consulting & Professional Services',
    size: '100,000+',
    founded: 1987,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Accenture',
    description: 'Accenture is a global professional services company with leading capabilities in digital, cloud and security.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Accenture.svg/2560px-Accenture.svg.png',
    website: 'https://www.accenture.com',
    careerPageUrl: 'https://www.accenture.com/us-en/careers',
    location: 'Dublin, Ireland',
    industry: 'Consulting',
    sector: 'Consulting & Professional Services',
    size: '100,000+',
    founded: 1989,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'McKinsey & Company',
    description: 'McKinsey & Company is an American worldwide management consulting firm, founded in 1926.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/McKinsey_and_Company_Logo_1.svg/2560px-McKinsey_and_Company_Logo_1.svg.png',
    website: 'https://www.mckinsey.com',
    careerPageUrl: 'https://www.mckinsey.com/careers',
    location: 'New York, USA',
    industry: 'Consulting',
    sector: 'Management Consulting',
    size: '10,000+',
    founded: 1926,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Boston Consulting Group (BCG)',
    description: 'The Boston Consulting Group is an American global management consulting firm founded in 1963.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/BCG_Corporate_Logo.svg/2560px-BCG_Corporate_Logo.svg.png',
    website: 'https://www.bcg.com',
    careerPageUrl: 'https://careers.bcg.com',
    location: 'Boston, Massachusetts, USA',
    industry: 'Consulting',
    sector: 'Management Consulting',
    size: '10,000+',
    founded: 1963,
    isVerified: true,
    isGlobal: true
  },

  // ==================== FINANCE & BANKING ====================
  {
    name: 'JPMorgan Chase',
    description: 'JPMorgan Chase & Co. is an American multinational investment bank and financial services holding company.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/JPMorgan_Chase_logo.svg/2560px-JPMorgan_Chase_logo.svg.png',
    website: 'https://www.jpmorganchase.com',
    careerPageUrl: 'https://careers.jpmorgan.com',
    location: 'New York, USA',
    industry: 'Finance',
    sector: 'Banking & Finance',
    size: '100,000+',
    founded: 2000,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Goldman Sachs',
    description: 'The Goldman Sachs Group, Inc. is an American multinational investment bank and financial services company.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Goldman_Sachs.svg/2560px-Goldman_Sachs.svg.png',
    website: 'https://www.goldmansachs.com',
    careerPageUrl: 'https://www.goldmansachs.com/careers',
    location: 'New York, USA',
    industry: 'Finance',
    sector: 'Investment Banking',
    size: '10,000+',
    founded: 1869,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Morgan Stanley',
    description: 'Morgan Stanley is an American multinational investment bank and financial services company.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Morgan_Stanley_Logo_1.svg/2560px-Morgan_Stanley_Logo_1.svg.png',
    website: 'https://www.morganstanley.com',
    careerPageUrl: 'https://www.morganstanley.com/people-opportunities',
    location: 'New York, USA',
    industry: 'Finance',
    sector: 'Investment Banking',
    size: '10,000+',
    founded: 1935,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'HDFC Bank',
    description: 'HDFC Bank Limited is an Indian banking and financial services company headquartered in Mumbai.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/HDFC_Bank_Logo.svg/2560px-HDFC_Bank_Logo.svg.png',
    website: 'https://www.hdfcbank.com',
    careerPageUrl: 'https://www.hdfcbank.com/personal/about-us/careers',
    location: 'Mumbai, Maharashtra, India',
    industry: 'Finance',
    sector: 'Banking',
    size: '100,000+',
    founded: 1994,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'ICICI Bank',
    description: 'ICICI Bank Limited is an Indian multinational bank and financial services company.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/ICICI_Bank_Logo.svg/2560px-ICICI_Bank_Logo.svg.png',
    website: 'https://www.icicibank.com',
    careerPageUrl: 'https://www.icicibank.com/aboutus/career.page',
    location: 'Mumbai, Maharashtra, India',
    industry: 'Finance',
    sector: 'Banking',
    size: '100,000+',
    founded: 1994,
    isVerified: true,
    isGlobal: true
  },

  // ==================== HEALTHCARE & PHARMA ====================
  {
    name: 'Pfizer',
    description: 'Pfizer Inc. is an American multinational pharmaceutical and biotechnology corporation.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Pfizer_%282021%29_logo.svg/2560px-Pfizer_%282021%29_logo.svg.png',
    website: 'https://www.pfizer.com',
    careerPageUrl: 'https://www.pfizer.com/about/careers',
    location: 'New York, USA',
    industry: 'Healthcare',
    sector: 'Pharmaceuticals',
    size: '100,000+',
    founded: 1849,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Johnson & Johnson',
    description: 'Johnson & Johnson is an American multinational corporation that develops medical devices, pharmaceuticals, and consumer packaged goods.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Johnson_and_Johnson_Logo.svg/2560px-Johnson_and_Johnson_Logo.svg.png',
    website: 'https://www.jnj.com',
    careerPageUrl: 'https://jobs.jnj.com',
    location: 'New Brunswick, New Jersey, USA',
    industry: 'Healthcare',
    sector: 'Healthcare & Pharmaceuticals',
    size: '100,000+',
    founded: 1886,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Apollo Hospitals',
    description: 'Apollo Hospitals Enterprise Limited is an Indian multinational healthcare group headquartered in Chennai.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Apollo_Hospitals_logo.svg/2560px-Apollo_Hospitals_logo.svg.png',
    website: 'https://www.apollohospitals.com',
    careerPageUrl: 'https://www.apollohospitals.com/careers',
    location: 'Chennai, Tamil Nadu, India',
    industry: 'Healthcare',
    sector: 'Healthcare Services',
    size: '10,000+',
    founded: 1983,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Fortis Healthcare',
    description: 'Fortis Healthcare Limited is an integrated healthcare delivery service provider in India.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Fortis_Healthcare_logo.svg/2560px-Fortis_Healthcare_logo.svg.png',
    website: 'https://www.fortishealthcare.com',
    careerPageUrl: 'https://www.fortishealthcare.com/careers',
    location: 'Gurugram, Haryana, India',
    industry: 'Healthcare',
    sector: 'Healthcare Services',
    size: '10,000+',
    founded: 2001,
    isVerified: true,
    isGlobal: true
  },

  // ==================== MANUFACTURING & AUTOMOTIVE ====================
  {
    name: 'Tata Motors',
    description: 'Tata Motors Limited is an Indian multinational automotive manufacturing company, a subsidiary of Tata Group.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Tata_Motors_Logo.svg/2560px-Tata_Motors_Logo.svg.png',
    website: 'https://www.tatamotors.com',
    careerPageUrl: 'https://www.tatamotors.com/careers',
    location: 'Mumbai, Maharashtra, India',
    industry: 'Automotive',
    sector: 'Manufacturing & Automotive',
    size: '100,000+',
    founded: 1945,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Mahindra & Mahindra',
    description: 'Mahindra & Mahindra Limited is an Indian multinational automotive manufacturing corporation.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Mahindra_%26_Mahindra_Logo.svg/2560px-Mahindra_%26_Mahindra_Logo.svg.png',
    website: 'https://www.mahindra.com',
    careerPageUrl: 'https://www.mahindra.com/careers',
    location: 'Mumbai, Maharashtra, India',
    industry: 'Automotive',
    sector: 'Manufacturing & Automotive',
    size: '100,000+',
    founded: 1945,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Reliance Industries',
    description: 'Reliance Industries Limited is an Indian multinational conglomerate company, engaged in energy, petrochemicals, natural gas, retail, telecommunications, mass media, and textiles.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Reliance_Industries_Logo.svg/2560px-Reliance_Industries_Logo.svg.png',
    website: 'https://www.ril.com',
    careerPageUrl: 'https://www.ril.com/Careers.aspx',
    location: 'Mumbai, Maharashtra, India',
    industry: 'Conglomerate',
    sector: 'Energy & Petrochemicals',
    size: '100,000+',
    founded: 1966,
    isVerified: true,
    isGlobal: true
  },

  // ==================== RETAIL & E-COMMERCE ====================
  {
    name: 'Walmart',
    description: 'Walmart Inc. is an American multinational retail corporation that operates a chain of hypermarkets, discount department stores, and grocery stores.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Walmart_logo.svg/2560px-Walmart_logo.svg.png',
    website: 'https://www.walmart.com',
    careerPageUrl: 'https://careers.walmart.com',
    location: 'Bentonville, Arkansas, USA',
    industry: 'Retail',
    sector: 'Retail',
    size: '100,000+',
    founded: 1962,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Flipkart',
    description: 'Flipkart is an Indian e-commerce company, headquartered in Bangalore, Karnataka, India, and incorporated in Singapore as a private limited company.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Flipkart-logo.svg/2560px-Flipkart-logo.svg.png',
    website: 'https://www.flipkart.com',
    careerPageUrl: 'https://www.flipkartcareers.com',
    location: 'Bangalore, Karnataka, India',
    industry: 'E-Commerce',
    sector: 'Retail & E-Commerce',
    size: '10,000+',
    founded: 2007,
    isVerified: true,
    isGlobal: true
  },

  // ==================== EDUCATION & EDTECH ====================
  {
    name: 'BYJU\'S',
    description: 'BYJU\'S is an Indian multinational educational technology company, headquartered in Bangalore.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/BYJU%27S_Logo.svg/2560px-BYJU%27S_Logo.svg.png',
    website: 'https://byjus.com',
    careerPageUrl: 'https://byjus.com/careers',
    location: 'Bangalore, Karnataka, India',
    industry: 'Education',
    sector: 'EdTech',
    size: '10,000+',
    founded: 2011,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Unacademy',
    description: 'Unacademy is an Indian online education platform that provides educational content, courses, and test preparation.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Unacademy_logo.svg/2560px-Unacademy_logo.svg.png',
    website: 'https://unacademy.com',
    careerPageUrl: 'https://unacademy.com/careers',
    location: 'Bangalore, Karnataka, India',
    industry: 'Education',
    sector: 'EdTech',
    size: '1,000+',
    founded: 2015,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'upGrad',
    description: 'upGrad is an Indian online higher education platform providing industry-relevant programs designed and delivered in collaboration with world-class universities.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Upgrad_logo.svg/2560px-Upgrad_logo.svg.png',
    website: 'https://www.upgrad.com',
    careerPageUrl: 'https://www.upgrad.com/careers',
    location: 'Mumbai, Maharashtra, India',
    industry: 'Education',
    sector: 'EdTech',
    size: '1,000+',
    founded: 2015,
    isVerified: true,
    isGlobal: true
  },

  // ==================== ADDITIONAL GLOBAL COMPANIES ====================
  {
    name: 'Tesla',
    description: 'Tesla, Inc. is an American electric vehicle and clean energy company.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Tesla_Motors.svg/2560px-Tesla_Motors.svg.png',
    website: 'https://www.tesla.com',
    careerPageUrl: 'https://www.tesla.com/careers',
    location: 'Austin, Texas, USA',
    industry: 'Automotive',
    sector: 'Electric Vehicles',
    size: '100,000+',
    founded: 2003,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Salesforce',
    description: 'Salesforce, Inc. is an American cloud-based software company providing customer relationship management (CRM) software and applications.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/2560px-Salesforce.com_logo.svg.png',
    website: 'https://www.salesforce.com',
    careerPageUrl: 'https://www.salesforce.com/company/careers',
    location: 'San Francisco, California, USA',
    industry: 'Technology',
    sector: 'Cloud Software',
    size: '10,000+',
    founded: 1999,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Intel',
    description: 'Intel Corporation is an American multinational corporation and technology company that designs, manufactures and sells computer processors and related technologies.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Intel_logo_%282006-2020%29.svg/2560px-Intel_logo_%282006-2020%29.svg.png',
    website: 'https://www.intel.com',
    careerPageUrl: 'https://jobs.intel.com',
    location: 'Santa Clara, California, USA',
    industry: 'Technology',
    sector: 'Semiconductors',
    size: '100,000+',
    founded: 1968,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Cisco',
    description: 'Cisco Systems, Inc. is an American multinational digital communications technology conglomerate corporation.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Cisco_logo.svg/2560px-Cisco_logo.svg.png',
    website: 'https://www.cisco.com',
    careerPageUrl: 'https://jobs.cisco.com',
    location: 'San Jose, California, USA',
    industry: 'Technology',
    sector: 'Networking',
    size: '100,000+',
    founded: 1984,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Siemens',
    description: 'Siemens AG is a German multinational conglomerate corporation and the largest industrial manufacturing company in Europe.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Siemens-logo.svg/2560px-Siemens-logo.svg.png',
    website: 'https://www.siemens.com',
    careerPageUrl: 'https://new.siemens.com/global/en/company/jobs.html',
    location: 'Munich, Germany',
    industry: 'Manufacturing',
    sector: 'Industrial Manufacturing',
    size: '100,000+',
    founded: 1847,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Airbus',
    description: 'Airbus SE is a European multinational aerospace corporation, designing, manufacturing and selling civil and military aerospace products worldwide.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Airbus_logo_2017.svg/2560px-Airbus_logo_2017.svg.png',
    website: 'https://www.airbus.com',
    careerPageUrl: 'https://www.airbus.com/en/careers',
    location: 'Leiden, Netherlands',
    industry: 'Aerospace',
    sector: 'Aerospace & Defense',
    size: '100,000+',
    founded: 1970,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Spotify',
    description: 'Spotify is a Swedish audio streaming and media services provider, one of the largest music streaming service providers.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/168px-Spotify_logo_without_text.svg.png',
    website: 'https://www.spotify.com',
    careerPageUrl: 'https://www.lifeatspotify.com',
    location: 'Stockholm, Sweden',
    industry: 'Entertainment',
    sector: 'Music Streaming',
    size: '10,000+',
    founded: 2006,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Uber',
    description: 'Uber Technologies, Inc. is an American multinational transportation network company offering peer-to-peer ridesharing, ride service hailing, food delivery.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Uber_logo_2018.svg/2560px-Uber_logo_2018.svg.png',
    website: 'https://www.uber.com',
    careerPageUrl: 'https://www.uber.com/us/en/careers',
    location: 'San Francisco, California, USA',
    industry: 'Transportation',
    sector: 'Ride Sharing',
    size: '10,000+',
    founded: 2009,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'Airbnb',
    description: 'Airbnb, Inc. is an American company operating an online marketplace for short- and long-term homestays and experiences.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Airbnb_Logo_B%C3%A9lo.svg/2560px-Airbnb_Logo_B%C3%A9lo.svg.png',
    website: 'https://www.airbnb.com',
    careerPageUrl: 'https://careers.airbnb.com',
    location: 'San Francisco, California, USA',
    industry: 'Travel',
    sector: 'Hospitality & Travel',
    size: '10,000+',
    founded: 2008,
    isVerified: true,
    isGlobal: true
  },
  {
    name: 'L&T Infotech',
    description: 'L&T Infotech (LTI) is a global IT solutions and services provider, subsidiary of Larsen & Toubro.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/LTI_Logo.svg/2560px-LTI_Logo.svg.png',
    website: 'https://www.lntinfotech.com',
    careerPageUrl: 'https://www.lntinfotech.com/careers',
    location: 'Mumbai, Maharashtra, India',
    industry: 'Technology',
    sector: 'IT Services',
    size: '10,000+',
    founded: 1997,
    isVerified: true,
    isGlobal: true
  },
  // ==================== EXPANSION (100+ target) ====================
  { name: 'Zoho', description: 'Zoho Corporation is an Indian multinational technology company that makes web-based business tools.', logo: favicon('zoho.com'), website: 'https://www.zoho.com', careerPageUrl: 'https://www.zoho.com/careers', location: 'Chennai, Tamil Nadu, India', industry: 'Technology', sector: 'Technology', size: '10,000+', founded: 1996, isVerified: true, isGlobal: true, country: 'IN' },
  { name: 'Paytm', description: 'Paytm is an Indian digital payments and financial services company.', logo: favicon('paytm.com'), website: 'https://paytm.com', careerPageUrl: 'https://paytm.com/careers', location: 'Noida, Uttar Pradesh, India', industry: 'Fintech', sector: 'Banking & Finance', size: '10,000+', founded: 2010, isVerified: true, isGlobal: true, country: 'IN' },
  { name: 'Razorpay', description: 'Razorpay is an Indian fintech company that provides payment gateway services.', logo: favicon('razorpay.com'), website: 'https://razorpay.com', careerPageUrl: 'https://razorpay.com/jobs', location: 'Bengaluru, Karnataka, India', industry: 'Fintech', sector: 'Banking & Finance', size: '1,000+', founded: 2014, isVerified: true, isGlobal: true, country: 'IN' },
  { name: 'Swiggy', description: 'Swiggy is an Indian online food ordering and delivery platform.', logo: favicon('swiggy.com'), website: 'https://www.swiggy.com', careerPageUrl: 'https://careers.swiggy.com', location: 'Bengaluru, Karnataka, India', industry: 'Consumer Services', sector: 'Retail & E-Commerce', size: '10,000+', founded: 2014, isVerified: true, isGlobal: true, country: 'IN' },
  { name: 'Zomato', description: 'Zomato is an Indian multinational restaurant aggregator and food delivery company.', logo: favicon('zomato.com'), website: 'https://www.zomato.com', careerPageUrl: 'https://www.zomato.com/careers', location: 'Gurugram, Haryana, India', industry: 'Consumer Services', sector: 'Retail & E-Commerce', size: '10,000+', founded: 2008, isVerified: true, isGlobal: true, country: 'IN' },
  { name: 'CRED', description: 'CRED is an Indian fintech company operating a members-only credit card bill payment platform.', logo: favicon('cred.club'), website: 'https://cred.club', careerPageUrl: 'https://cred.club/careers', location: 'Bengaluru, Karnataka, India', industry: 'Fintech', sector: 'Banking & Finance', size: '1,000+', founded: 2018, isVerified: true, isGlobal: true, country: 'IN' },
  { name: 'PhonePe', description: 'PhonePe is an Indian digital payments and financial services company.', logo: favicon('phonepe.com'), website: 'https://www.phonepe.com', careerPageUrl: 'https://www.phonepe.com/careers', location: 'Bengaluru, Karnataka, India', industry: 'Fintech', sector: 'Banking & Finance', size: '10,000+', founded: 2015, isVerified: true, isGlobal: true, country: 'IN' },
  { name: 'Ola', description: 'Ola is an Indian multinational ridesharing company offering mobility and financial services.', logo: favicon('olacabs.com'), website: 'https://www.olacabs.com', careerPageUrl: 'https://careers.olacabs.com', location: 'Bengaluru, Karnataka, India', industry: 'Transportation', sector: 'Technology', size: '10,000+', founded: 2010, isVerified: true, isGlobal: true, country: 'IN' },
  { name: 'MakeMyTrip', description: 'MakeMyTrip is an Indian online travel company offering flights, hotels and holiday packages.', logo: favicon('makemytrip.com'), website: 'https://www.makemytrip.com', careerPageUrl: 'https://careers.makemytrip.com', location: 'Gurugram, Haryana, India', industry: 'Travel', sector: 'Retail & E-Commerce', size: '1,000+', founded: 2000, isVerified: true, isGlobal: true, country: 'IN' },
  { name: 'HSBC', description: 'HSBC is a British universal bank and financial services group.', logo: favicon('hsbc.com'), website: 'https://www.hsbc.com', careerPageUrl: 'https://www.hsbc.com/careers', location: 'London, United Kingdom', industry: 'Banking', sector: 'Banking & Finance', size: '100,000+', founded: 1865, isVerified: true, isGlobal: true, country: 'GB' },
  { name: 'Barclays', description: 'Barclays is a British universal bank headquartered in London.', logo: favicon('barclays.com'), website: 'https://home.barclays', careerPageUrl: 'https://home.barclays/careers', location: 'London, United Kingdom', industry: 'Banking', sector: 'Banking & Finance', size: '100,000+', founded: 1690, isVerified: true, isGlobal: true, country: 'GB' },
  { name: 'BP', description: 'BP is a British multinational oil and gas company.', logo: favicon('bp.com'), website: 'https://www.bp.com', careerPageUrl: 'https://www.bp.com/en/global/corporate/careers.html', location: 'London, United Kingdom', industry: 'Energy', sector: 'Energy & Petrochemicals', size: '100,000+', founded: 1909, isVerified: true, isGlobal: true, country: 'GB' },
  { name: 'Vodafone', description: 'Vodafone is a British multinational telecommunications company.', logo: favicon('vodafone.com'), website: 'https://www.vodafone.com', careerPageUrl: 'https://careers.vodafone.com', location: 'Newbury, United Kingdom', industry: 'Telecommunications', sector: 'Technology', size: '100,000+', founded: 1991, isVerified: true, isGlobal: true, country: 'GB' },
  { name: 'Unilever', description: 'Unilever is a British multinational consumer goods company.', logo: favicon('unilever.com'), website: 'https://www.unilever.com', careerPageUrl: 'https://careers.unilever.com', location: 'London, United Kingdom', industry: 'Consumer Goods', sector: 'Manufacturing & Automotive', size: '100,000+', founded: 1929, isVerified: true, isGlobal: true, country: 'GB' },
  { name: 'Tesco', description: 'Tesco is a British multinational groceries and general merchandise retailer.', logo: favicon('tesco.com'), website: 'https://www.tesco.com', careerPageUrl: 'https://www.tesco-careers.com', location: 'Welwyn Garden City, United Kingdom', industry: 'Retail', sector: 'Retail & E-Commerce', size: '100,000+', founded: 1919, isVerified: true, isGlobal: true, country: 'GB' },
  { name: 'AstraZeneca', description: 'AstraZeneca is a British-Swedish multinational pharmaceutical company.', logo: favicon('astrazeneca.com'), website: 'https://www.astrazeneca.com', careerPageUrl: 'https://careers.astrazeneca.com', location: 'Cambridge, United Kingdom', industry: 'Pharmaceuticals', sector: 'Healthcare', size: '100,000+', founded: 1999, isVerified: true, isGlobal: true, country: 'GB' },
  { name: 'Emirates', description: 'Emirates is the largest airline in the Middle East, based in Dubai.', logo: favicon('emirates.com'), website: 'https://www.emirates.com', careerPageUrl: 'https://www.emirates.com/careers', location: 'Dubai, United Arab Emirates', industry: 'Aviation', sector: 'Transportation', size: '100,000+', founded: 1985, isVerified: true, isGlobal: true, country: 'AE' },
  { name: 'Etisalat', description: 'Etisalat is a multinational Emirati telecommunications company.', logo: favicon('etisalat.ae'), website: 'https://www.etisalat.ae', careerPageUrl: 'https://www.etisalat.ae/en/careers', location: 'Abu Dhabi, United Arab Emirates', industry: 'Telecommunications', sector: 'Technology', size: '10,000+', founded: 1976, isVerified: true, isGlobal: true, country: 'AE' },
  { name: 'Noon', description: 'Noon is a Middle Eastern e-commerce platform headquartered in Dubai.', logo: favicon('noon.com'), website: 'https://www.noon.com', careerPageUrl: 'https://www.noon.com/careers', location: 'Dubai, United Arab Emirates', industry: 'E-Commerce', sector: 'Retail & E-Commerce', size: '1,000+', founded: 2017, isVerified: true, isGlobal: true, country: 'AE' },
  { name: 'Careem', description: 'Careem is a Dubai-based ride-hailing and delivery super-app.', logo: favicon('careem.com'), website: 'https://www.careem.com', careerPageUrl: 'https://www.careem.com/en-AE/careers', location: 'Dubai, United Arab Emirates', industry: 'Transportation', sector: 'Technology', size: '1,000+', founded: 2012, isVerified: true, isGlobal: true, country: 'AE' },
  { name: 'DP World', description: 'DP World is an Emirati multinational logistics company specializing in port operations.', logo: favicon('dpworld.com'), website: 'https://www.dpworld.com', careerPageUrl: 'https://www.dpworld.com/careers', location: 'Dubai, United Arab Emirates', industry: 'Logistics', sector: 'Manufacturing & Automotive', size: '100,000+', founded: 2005, isVerified: true, isGlobal: true, country: 'AE' },
  { name: 'Mashreq', description: 'Mashreq is one of the oldest private banks in the United Arab Emirates.', logo: favicon('mashreq.com'), website: 'https://www.mashreq.com', careerPageUrl: 'https://www.mashreq.com/en/uae/careers', location: 'Dubai, United Arab Emirates', industry: 'Banking', sector: 'Banking & Finance', size: '1,000+', founded: 1967, isVerified: true, isGlobal: true, country: 'AE' },
  { name: 'Emaar', description: 'Emaar Properties is a real estate development company based in Dubai.', logo: favicon('emaar.com'), website: 'https://www.emaar.com', careerPageUrl: 'https://www.emaar.com/en/careers', location: 'Dubai, United Arab Emirates', industry: 'Real Estate', sector: 'Manufacturing & Automotive', size: '10,000+', founded: 1997, isVerified: true, isGlobal: true, country: 'AE' },
  { name: 'Nvidia', description: 'Nvidia is an American technology company designing GPUs and AI computing platforms.', logo: favicon('nvidia.com'), website: 'https://www.nvidia.com', careerPageUrl: 'https://www.nvidia.com/en-us/about-nvidia/careers', location: 'Santa Clara, California, USA', industry: 'Technology', sector: 'Technology', size: '10,000+', founded: 1993, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'LinkedIn', description: 'LinkedIn is a business and employment-focused social media platform owned by Microsoft.', logo: favicon('linkedin.com'), website: 'https://www.linkedin.com', careerPageUrl: 'https://careers.linkedin.com', location: 'Sunnyvale, California, USA', industry: 'Technology', sector: 'Technology', size: '10,000+', founded: 2002, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Stripe', description: 'Stripe is an Irish-American financial services and software as a service company.', logo: favicon('stripe.com'), website: 'https://stripe.com', careerPageUrl: 'https://stripe.com/jobs', location: 'San Francisco, California, USA', industry: 'Fintech', sector: 'Banking & Finance', size: '1,000+', founded: 2010, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Shopify', description: 'Shopify is a Canadian multinational e-commerce company.', logo: favicon('shopify.com'), website: 'https://www.shopify.com', careerPageUrl: 'https://www.shopify.com/careers', location: 'Ottawa, Canada', industry: 'E-Commerce', sector: 'Retail & E-Commerce', size: '10,000+', founded: 2006, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'PayPal', description: 'PayPal is an American multinational financial technology company.', logo: favicon('paypal.com'), website: 'https://www.paypal.com', careerPageUrl: 'https://careers.paypal.com', location: 'San Jose, California, USA', industry: 'Fintech', sector: 'Banking & Finance', size: '10,000+', founded: 1998, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Visa', description: 'Visa is an American multinational payment card services corporation.', logo: favicon('visa.com'), website: 'https://www.visa.com', careerPageUrl: 'https://careers.visa.com', location: 'San Francisco, California, USA', industry: 'Fintech', sector: 'Banking & Finance', size: '10,000+', founded: 1958, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Mastercard', description: 'Mastercard is an American multinational financial services corporation.', logo: favicon('mastercard.com'), website: 'https://www.mastercard.com', careerPageUrl: 'https://careers.mastercard.com', location: 'Purchase, New York, USA', industry: 'Fintech', sector: 'Banking & Finance', size: '10,000+', founded: 1966, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'AMD', description: 'Advanced Micro Devices is an American semiconductor company.', logo: favicon('amd.com'), website: 'https://www.amd.com', careerPageUrl: 'https://www.amd.com/en/corporate/careers.html', location: 'Santa Clara, California, USA', industry: 'Semiconductors', sector: 'Technology', size: '10,000+', founded: 1969, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'OpenAI', description: 'OpenAI is an American artificial intelligence research organization.', logo: favicon('openai.com'), website: 'https://openai.com', careerPageUrl: 'https://openai.com/careers', location: 'San Francisco, California, USA', industry: 'Artificial Intelligence', sector: 'Technology', size: '1,000+', founded: 2015, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Snowflake', description: 'Snowflake is a cloud computing-based data cloud company.', logo: favicon('snowflake.com'), website: 'https://www.snowflake.com', careerPageUrl: 'https://careers.snowflake.com', location: 'Bozeman, Montana, USA', industry: 'Cloud Computing', sector: 'Technology', size: '1,000+', founded: 2012, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'ServiceNow', description: 'ServiceNow is an American software company for digital workflows.', logo: favicon('servicenow.com'), website: 'https://www.servicenow.com', careerPageUrl: 'https://careers.servicenow.com', location: 'Santa Clara, California, USA', industry: 'Enterprise Software', sector: 'Technology', size: '10,000+', founded: 2004, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Workday', description: 'Workday is an American on-demand financial management and HR software vendor.', logo: favicon('workday.com'), website: 'https://www.workday.com', careerPageUrl: 'https://www.workday.com/en-us/company/careers.html', location: 'Pleasanton, California, USA', industry: 'Enterprise Software', sector: 'Technology', size: '10,000+', founded: 2005, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Zoom', description: 'Zoom Video Communications provides videotelephony and online chat services.', logo: favicon('zoom.us'), website: 'https://zoom.us', careerPageUrl: 'https://careers.zoom.us', location: 'San Jose, California, USA', industry: 'Technology', sector: 'Technology', size: '1,000+', founded: 2011, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Atlassian', description: 'Atlassian is an Australian-American software company developing collaboration tools.', logo: favicon('atlassian.com'), website: 'https://www.atlassian.com', careerPageUrl: 'https://www.atlassian.com/company/careers', location: 'Sydney, Australia', industry: 'Enterprise Software', sector: 'Technology', size: '10,000+', founded: 2002, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Samsung', description: 'Samsung Electronics is a South Korean multinational electronics corporation.', logo: favicon('samsung.com'), website: 'https://www.samsung.com', careerPageUrl: 'https://www.samsung.com/us/careers', location: 'Seoul, South Korea', industry: 'Electronics', sector: 'Technology', size: '100,000+', founded: 1969, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Toyota', description: 'Toyota Motor Corporation is a Japanese multinational automotive manufacturer.', logo: favicon('toyota.com'), website: 'https://www.toyota.com', careerPageUrl: 'https://careers.toyota.com', location: 'Toyota City, Japan', industry: 'Automotive', sector: 'Manufacturing & Automotive', size: '100,000+', founded: 1937, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Mercedes-Benz', description: 'Mercedes-Benz is a German luxury and commercial vehicle automotive brand.', logo: favicon('mercedes-benz.com'), website: 'https://www.mercedes-benz.com', careerPageUrl: 'https://group.mercedes-benz.com/careers', location: 'Stuttgart, Germany', industry: 'Automotive', sector: 'Manufacturing & Automotive', size: '100,000+', founded: 1926, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'BMW', description: 'BMW is a German multinational manufacturer of luxury vehicles and motorcycles.', logo: favicon('bmw.com'), website: 'https://www.bmw.com', careerPageUrl: 'https://www.bmwgroup.com/en/careers.html', location: 'Munich, Germany', industry: 'Automotive', sector: 'Manufacturing & Automotive', size: '100,000+', founded: 1916, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Honda', description: 'Honda Motor Company is a Japanese multinational manufacturer of automobiles and motorcycles.', logo: favicon('honda.com'), website: 'https://www.honda.com', careerPageUrl: 'https://www.honda.com/careers', location: 'Tokyo, Japan', industry: 'Automotive', sector: 'Manufacturing & Automotive', size: '100,000+', founded: 1948, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Sony', description: 'Sony Group Corporation is a Japanese multinational conglomerate.', logo: favicon('sony.com'), website: 'https://www.sony.com', careerPageUrl: 'https://www.sony.com/en/SonyInfo/Careers', location: 'Tokyo, Japan', industry: 'Electronics', sector: 'Technology', size: '100,000+', founded: 1946, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Nike', description: 'Nike is an American athletic footwear and apparel corporation.', logo: favicon('nike.com'), website: 'https://www.nike.com', careerPageUrl: 'https://jobs.nike.com', location: 'Beaverton, Oregon, USA', industry: 'Apparel', sector: 'Retail & E-Commerce', size: '100,000+', founded: 1964, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Coca-Cola', description: 'The Coca-Cola Company is an American multinational beverage corporation.', logo: favicon('coca-cola.com'), website: 'https://www.coca-cola.com', careerPageUrl: 'https://careers.coca-colacompany.com', location: 'Atlanta, Georgia, USA', industry: 'Beverages', sector: 'Manufacturing & Automotive', size: '100,000+', founded: 1892, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Nestle', description: 'Nestle is a Swiss multinational food and drink processing conglomerate.', logo: favicon('nestle.com'), website: 'https://www.nestle.com', careerPageUrl: 'https://www.nestle.com/jobs', location: 'Vevey, Switzerland', industry: 'Food & Beverage', sector: 'Manufacturing & Automotive', size: '100,000+', founded: 1866, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Shell', description: 'Shell is a British multinational oil and gas company.', logo: favicon('shell.com'), website: 'https://www.shell.com', careerPageUrl: 'https://www.shell.com/careers.html', location: 'London, United Kingdom', industry: 'Energy', sector: 'Energy & Petrochemicals', size: '100,000+', founded: 1907, isVerified: true, isGlobal: true, country: 'GB' },
  { name: 'Boeing', description: 'Boeing is an American multinational corporation that designs and manufactures aircraft.', logo: favicon('boeing.com'), website: 'https://www.boeing.com', careerPageUrl: 'https://jobs.boeing.com', location: 'Arlington, Virginia, USA', industry: 'Aerospace', sector: 'Aerospace & Defense', size: '100,000+', founded: 1916, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Databricks', description: 'Databricks is an American enterprise software company for data and AI.', logo: favicon('databricks.com'), website: 'https://www.databricks.com', careerPageUrl: 'https://www.databricks.com/company/careers', location: 'San Francisco, California, USA', industry: 'Data & AI', sector: 'Technology', size: '1,000+', founded: 2013, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Palantir', description: 'Palantir Technologies is an American software company specializing in big data analytics.', logo: favicon('palantir.com'), website: 'https://www.palantir.com', careerPageUrl: 'https://www.palantir.com/careers', location: 'Denver, Colorado, USA', industry: 'Software', sector: 'Technology', size: '1,000+', founded: 2003, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Reddit', description: 'Reddit is an American social news aggregation and discussion website.', logo: favicon('reddit.com'), website: 'https://www.reddit.com', careerPageUrl: 'https://www.redditinc.com/careers', location: 'San Francisco, California, USA', industry: 'Social Media', sector: 'Technology', size: '1,000+', founded: 2005, isVerified: true, isGlobal: true, country: 'US' },
  { name: 'Pinterest', description: 'Pinterest is an American image sharing and social media service.', logo: favicon('pinterest.com'), website: 'https://www.pinterest.com', careerPageUrl: 'https://www.pinterestcareers.com', location: 'San Francisco, California, USA', industry: 'Social Media', sector: 'Technology', size: '1,000+', founded: 2010, isVerified: true, isGlobal: true, country: 'US' }
];

async function seedGlobalCompanies() {
  try {
    console.log('🌍 Starting global companies seeding...');
    console.log(`📊 Total companies to seed: ${globalCompanies.length}`);
    
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const companyData of globalCompanies) {
      try {
        const existingCompany = await findExistingCompany(companyData);

        const payload = {
          isGlobal: companyData.isGlobal ?? true,
          sector: companyData.sector,
          careerPageUrl: companyData.careerPageUrl,
          description: companyData.description,
          logo: companyData.logo,
          website: companyData.website,
          location: companyData.location,
          industry: companyData.industry,
          size: companyData.size,
          founded: companyData.founded,
          country: companyData.country || 'IN',
          isActive: true,
          isVerified: companyData.isVerified !== false,
        };

        if (existingCompany) {
          await prisma.company.update({
            where: { id: existingCompany.id },
            data: payload,
          });
          updatedCount++;
          console.log(`   🔄 Updated: ${companyData.name} (${companyData.sector})`);
        } else {
          await prisma.company.create({
            data: {
              name: companyData.name,
              ...payload,
            },
          });
          createdCount++;
          console.log(`   ✅ Created: ${companyData.name} (${companyData.sector})`);
        }
      } catch (error) {
        skippedCount++;
        console.log(`   ⚠️  Skipped: ${companyData.name} - ${error.message}`);
      }
    }
    
    console.log('\n🎉 Global companies seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   ✅ Created: ${createdCount} companies`);
    console.log(`   🔄 Updated: ${updatedCount} companies`);
    console.log(`   ⚠️  Skipped: ${skippedCount} companies`);
    console.log(`   📈 Total processed: ${createdCount + updatedCount + skippedCount} companies`);
    
    // Display companies by sector
    const companiesBySector = {};
    globalCompanies.forEach(company => {
      const sector = company.sector || 'Other';
      if (!companiesBySector[sector]) {
        companiesBySector[sector] = [];
      }
      companiesBySector[sector].push(company.name);
    });
    
    console.log('\n📋 Companies by Sector:');
    Object.keys(companiesBySector).sort().forEach(sector => {
      console.log(`   ${sector}: ${companiesBySector[sector].length} companies`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding global companies:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
if (require.main === module) {
  seedGlobalCompanies()
    .then(() => {
      console.log('✅ Global companies seeding script completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Global companies seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedGlobalCompanies };

