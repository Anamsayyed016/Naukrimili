#!/usr/bin/env node

/**
 * GLOBAL COMPANIES SEEDING SCRIPT
 * Seeds 50+ well-known global companies across all sectors
 * Uses UPSERT to prevent duplicates
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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
  }
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
        // Check if company already exists
        const existingCompany = await prisma.company.findFirst({
          where: {
            name: companyData.name
          }
        });

        let result;
        if (existingCompany) {
          // Update existing company
          result = await prisma.company.update({
            where: {
              id: existingCompany.id
            },
            data: {
              isGlobal: companyData.isGlobal,
              sector: companyData.sector,
              careerPageUrl: companyData.careerPageUrl,
              description: companyData.description,
              logo: companyData.logo,
              website: companyData.website,
              location: companyData.location,
              industry: companyData.industry,
              size: companyData.size,
              founded: companyData.founded,
              isVerified: false // Set to false so they need admin approval
            }
          });
        } else {
          // Create new company
          result = await prisma.company.create({
            data: {
              ...companyData,
              isVerified: false // Set to false so they need admin approval
            }
          });
        }
        
        // Check if it was created or updated
        if (existingCompany) {
          updatedCount++;
          console.log(`   🔄 Updated: ${companyData.name} (${companyData.sector})`);
        } else {
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

