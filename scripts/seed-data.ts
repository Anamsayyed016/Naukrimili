#!/usr/bin/env ts-node

/**
 * Database Seeding Script
 * 
 * Inserts test/demo data in local/staging environments
 * Never affects production unless a safe flag is passed
 * Supports different data types: users, jobs, companies, etc.
 * 
 * Usage:
 *   npx ts-node scripts/seed-data.ts
 *   npx ts-node scripts/seed-data.ts --type=users
 *   npx ts-node scripts/seed-data.ts --type=jobs --count=50
 *   npx ts-node scripts/seed-data.ts --production-safe
 */

import { PrismaClient } from '@prisma/client';
import { EnvironmentManager } from './setup-env';

interface SeedingConfig {
  environment: string;
  isProduction: boolean;
  isStaging: boolean;
  isDevelopment: boolean;
  isTest: boolean;
  productionSafe: boolean;
  dataType: string;
  count: number;
  clearExisting: boolean;
}

interface SeedData {
  users: any[];
  companies: any[];
  jobs: any[];
  categories: any[];
}

class DatabaseSeeder {
  private prisma: PrismaClient;
  private config: SeedingConfig;
  private envManager: EnvironmentManager;
  private seedData: SeedData;

  constructor() {
    this.prisma = new PrismaClient();
    this.envManager = new EnvironmentManager();
    this.config = {
      environment: process.env.NODE_ENV || 'development',
      isProduction: false,
      isStaging: false,
      isDevelopment: false,
      isTest: false,
      productionSafe: process.argv.includes('--production-safe'),
      dataType: this.getArgValue('--type') || 'all',
      count: parseInt(this.getArgValue('--count') || '10'),
      clearExisting: process.argv.includes('--clear')
    };
    this.seedData = {
      users: [],
      companies: [],
      jobs: [],
      categories: []
    };
  }

  /**
   * Get command line argument value
   */
  private getArgValue(arg: string): string | undefined {
    const index = process.argv.indexOf(arg);
    return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : undefined;
  }

  /**
   * Initialize seeding configuration
   */
  public async initialize(): Promise<void> {
    console.log('🌱 Database Seeding Script');
    console.log('===========================');

    // Load environment
    await this.envManager.loadEnvironment();
    const envConfig = this.envManager.getEnvironmentConfig();

    // Set environment flags
    this.config.isProduction = envConfig.isProduction;
    this.config.isStaging = envConfig.isStaging;
    this.config.isDevelopment = envConfig.isDevelopment;
    this.config.isTest = envConfig.isTest;
    this.config.environment = envConfig.nodeEnv;

    console.log(`Environment: ${this.config.environment}`);
    console.log(`Data Type: ${this.config.dataType}`);
    console.log(`Count: ${this.config.count}`);
    console.log(`Clear Existing: ${this.config.clearExisting ? '✅' : '❌'}`);
    console.log(`Production Safe: ${this.config.productionSafe ? '✅' : '❌'}`);

    // Safety checks
    this.validateSeedingSafety();
  }

  /**
   * Validate if seeding is safe to proceed
   */
  private validateSeedingSafety(): void {
    if (this.config.isProduction && !this.config.productionSafe) {
      console.log('❌ Production seeding requires --production-safe flag');
      console.log('   This is a safety measure to prevent accidental production data changes');
      process.exit(1);
    }

    if (this.config.isProduction && this.config.clearExisting) {
      console.log('❌ Cannot clear existing data in production');
      process.exit(1);
    }

    console.log('✅ Seeding safety checks passed');
  }

  /**
   * Generate sample user data
   */
  private generateUsers(count: number): any[] {
    const users = [];
    const roles = ['jobseeker', 'employer', 'admin'];
    const locations = ['New York', 'San Francisco', 'London', 'Toronto', 'Berlin', 'Tokyo'];
    const skills = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'Go', 'Rust'];

    for (let i = 0; i < count; i++) {
      const role = roles[Math.floor(Math.random() * roles.length)];
      const isJobseeker = role === 'jobseeker';
      
      users.push({
        email: `user${i + 1}@example.com`,
        firstName: `User${i + 1}`,
        lastName: `Last${i + 1}`,
        role: role,
        location: locations[Math.floor(Math.random() * locations.length)],
        bio: isJobseeker ? `Experienced ${skills[Math.floor(Math.random() * skills.length)]} developer` : `Hiring manager at ${this.generateCompanyName()}`,
        skills: JSON.stringify(skills.slice(0, Math.floor(Math.random() * 4) + 2)),
        isVerified: Math.random() > 0.3,
        isActive: true,
        phoneVerified: Math.random() > 0.5,
        ...(isJobseeker ? {
          salaryExpectation: Math.floor(Math.random() * 100000) + 50000,
          jobTypePreference: ['full-time', 'part-time', 'contract'][Math.floor(Math.random() * 3)],
          remotePreference: Math.random() > 0.5
        } : {
          companyName: this.generateCompanyName(),
          companyWebsite: `https://${this.generateCompanyName().toLowerCase().replace(/\s+/g, '')}.com`,
          companyIndustry: ['Technology', 'Finance', 'Healthcare', 'Education', 'Retail'][Math.floor(Math.random() * 5)],
          companySize: ['1-10', '11-50', '51-200', '201-1000', '1000+'][Math.floor(Math.random() * 5)]
        })
      });
    }

    return users;
  }

  /**
   * Generate sample company data
   */
  private generateCompanies(count: number): any[] {
    const companies = [];
    const industries = ['Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Manufacturing'];
    const sizes = ['1-10', '11-50', '51-200', '201-1000', '1000+'];
    const locations = ['New York', 'San Francisco', 'London', 'Toronto', 'Berlin', 'Tokyo'];

    for (let i = 0; i < count; i++) {
      const name = this.generateCompanyName();
      companies.push({
        name: name,
        description: `Leading ${industries[Math.floor(Math.random() * industries.length)]} company focused on innovation and growth.`,
        website: `https://${name.toLowerCase().replace(/\s+/g, '')}.com`,
        location: locations[Math.floor(Math.random() * locations.length)],
        industry: industries[Math.floor(Math.random() * industries.length)],
        size: sizes[Math.floor(Math.random() * sizes.length)],
        founded: Math.floor(Math.random() * 30) + 1990,
        isVerified: Math.random() > 0.4,
        isActive: true,
        benefits: JSON.stringify(['Health Insurance', 'Dental', 'Vision', '401k', 'Flexible Hours', 'Remote Work']),
        specialties: JSON.stringify(['Innovation', 'Growth', 'Technology', 'Customer Focus']),
        culture: 'Collaborative and innovative work environment',
        mission: 'To make a positive impact through technology',
        vision: 'To be the leading company in our industry'
      });
    }

    return companies;
  }

  /**
   * Generate sample job data
   */
  private generateJobs(count: number, companyIds: string[]): any[] {
    const jobs = [];
    const titles = [
      'Senior Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
      'DevOps Engineer', 'Data Scientist', 'Product Manager', 'UX Designer', 'Marketing Manager',
      'Sales Representative', 'Customer Success Manager', 'Business Analyst'
    ];
    const locations = ['New York', 'San Francisco', 'London', 'Toronto', 'Berlin', 'Tokyo', 'Remote'];
    const jobTypes = ['full-time', 'part-time', 'contract', 'internship'];
    const experienceLevels = ['entry', 'mid', 'senior', 'lead'];
    const skills = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'Go', 'Rust', 'AWS', 'Docker'];

    for (let i = 0; i < count; i++) {
      const title = titles[Math.floor(Math.random() * titles.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const isRemote = location === 'Remote';
      
      jobs.push({
        title: title,
        company: this.generateCompanyName(),
        location: location,
        country: 'US',
        description: `We are looking for a ${title} to join our team. This role involves working on exciting projects and collaborating with talented individuals.`,
        requirements: `Requirements: 3+ years experience, strong problem-solving skills, excellent communication.`,
        salaryMin: Math.floor(Math.random() * 50000) + 50000,
        salaryMax: Math.floor(Math.random() * 100000) + 100000,
        salaryCurrency: 'USD',
        jobType: jobTypes[Math.floor(Math.random() * jobTypes.length)],
        experienceLevel: experienceLevels[Math.floor(Math.random() * experienceLevels.length)],
        skills: skills.slice(0, Math.floor(Math.random() * 5) + 3).join(', '),
        isRemote: isRemote,
        isHybrid: !isRemote && Math.random() > 0.7,
        isUrgent: Math.random() > 0.8,
        isFeatured: Math.random() > 0.9,
        isActive: true,
        sector: ['Technology', 'Finance', 'Healthcare', 'Education'][Math.floor(Math.random() * 4)],
        postedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Last 30 days
        companyId: companyIds[Math.floor(Math.random() * companyIds.length)]
      });
    }

    return jobs;
  }

  /**
   * Generate sample category data
   */
  private generateCategories(): any[] {
    return [
      { name: 'Technology', description: 'Software development, IT, and tech roles' },
      { name: 'Finance', description: 'Banking, investment, and financial services' },
      { name: 'Healthcare', description: 'Medical, pharmaceutical, and healthcare roles' },
      { name: 'Education', description: 'Teaching, training, and educational services' },
      { name: 'Marketing', description: 'Digital marketing, advertising, and communications' },
      { name: 'Sales', description: 'Sales, business development, and customer relations' },
      { name: 'Design', description: 'UI/UX design, graphic design, and creative roles' },
      { name: 'Operations', description: 'Operations, logistics, and supply chain' }
    ];
  }

  /**
   * Generate a random company name
   */
  private generateCompanyName(): string {
    const prefixes = ['Tech', 'Digital', 'Global', 'Innovative', 'Smart', 'Future', 'Next', 'Prime'];
    const suffixes = ['Corp', 'Inc', 'Labs', 'Solutions', 'Systems', 'Technologies', 'Group', 'Ventures'];
    const words = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const word = words[Math.floor(Math.random() * words.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${prefix} ${word} ${suffix}`;
  }

  /**
   * Clear existing data (if requested)
   */
  private async clearExistingData(): Promise<void> {
    if (!this.config.clearExisting) return;

    console.log('\n🗑️  Clearing existing data...');
    
    try {
      // Clear in reverse order of dependencies
      await this.prisma.application.deleteMany();
      await this.prisma.jobBookmark.deleteMany();
      await this.prisma.job.deleteMany();
      await this.prisma.company.deleteMany();
      await this.prisma.user.deleteMany();
      await this.prisma.category.deleteMany();
      
      console.log('✅ Existing data cleared');
    } catch (error) {
      console.warn('⚠️  Error clearing data:', error);
    }
  }

  /**
   * Seed users
   */
  private async seedUsers(): Promise<string[]> {
    if (this.config.dataType !== 'all' && this.config.dataType !== 'users') return [];

    console.log('\n👥 Seeding users...');
    const users = this.generateUsers(this.config.count);
    
    try {
      const createdUsers = await this.prisma.user.createMany({
        data: users,
        skipDuplicates: true
      });
      
      console.log(`✅ Created ${createdUsers.count} users`);
      
      // Get created user IDs
      const userIds = await this.prisma.user.findMany({
        where: { email: { in: users.map(u => u.email) } },
        select: { id: true }
      });
      
      return userIds.map(u => u.id);
    } catch (error) {
      console.error('❌ Error seeding users:', error);
      return [];
    }
  }

  /**
   * Seed companies
   */
  private async seedCompanies(): Promise<string[]> {
    if (this.config.dataType !== 'all' && this.config.dataType !== 'companies') return [];

    console.log('\n🏢 Seeding companies...');
    const companies = this.generateCompanies(this.config.count);
    
    try {
      const createdCompanies = await this.prisma.company.createMany({
        data: companies,
        skipDuplicates: true
      });
      
      console.log(`✅ Created ${createdCompanies.count} companies`);
      
      // Get created company IDs
      const companyIds = await this.prisma.company.findMany({
        where: { name: { in: companies.map(c => c.name) } },
        select: { id: true }
      });
      
      return companyIds.map(c => c.id);
    } catch (error) {
      console.error('❌ Error seeding companies:', error);
      return [];
    }
  }

  /**
   * Seed jobs
   */
  private async seedJobs(companyIds: string[]): Promise<void> {
    if (this.config.dataType !== 'all' && this.config.dataType !== 'jobs') return;
    if (companyIds.length === 0) return;

    console.log('\n💼 Seeding jobs...');
    const jobs = this.generateJobs(this.config.count, companyIds);
    
    try {
      const createdJobs = await this.prisma.job.createMany({
        data: jobs,
        skipDuplicates: true
      });
      
      console.log(`✅ Created ${createdJobs.count} jobs`);
    } catch (error) {
      console.error('❌ Error seeding jobs:', error);
    }
  }

  /**
   * Seed categories
   */
  private async seedCategories(): Promise<void> {
    if (this.config.dataType !== 'all' && this.config.dataType !== 'categories') return;

    console.log('\n📂 Seeding categories...');
    const categories = this.generateCategories();
    
    try {
      const createdCategories = await this.prisma.category.createMany({
        data: categories,
        skipDuplicates: true
      });
      
      console.log(`✅ Created ${createdCategories.count} categories`);
    } catch (error) {
      console.error('❌ Error seeding categories:', error);
    }
  }

  /**
   * Run the complete seeding process
   */
  public async seed(): Promise<void> {
    try {
      await this.initialize();

      // Clear existing data if requested
      await this.clearExistingData();

      // Seed data in order
      const userIds = await this.seedUsers();
      const companyIds = await this.seedCompanies();
      await this.seedJobs(companyIds);
      await this.seedCategories();

      console.log('\n🎉 Database seeding completed successfully!');
      console.log('\nSeeded data:');
      console.log(`- Users: ${userIds.length}`);
      console.log(`- Companies: ${companyIds.length}`);
      console.log(`- Jobs: ${this.config.dataType === 'all' || this.config.dataType === 'jobs' ? this.config.count : 0}`);
      console.log(`- Categories: ${this.config.dataType === 'all' || this.config.dataType === 'categories' ? 8 : 0}`);

    } catch (error) {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Main execution
async function main() {
  const seeder = new DatabaseSeeder();
  await seeder.seed();
}

// Run if called directly
if (require.main === module) {
  main();
}

export { DatabaseSeeder };
