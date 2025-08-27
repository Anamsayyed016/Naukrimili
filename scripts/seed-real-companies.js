#!/usr/bin/env node

/**
 * REAL COMPANIES SEEDING SCRIPT
 * Creates real companies with comprehensive details
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Real companies with comprehensive details
const realCompanies = [
  {
    name: 'Google',
    description: 'Google is a multinational technology company specializing in Internet-related services and products, including online advertising technologies, search engine, cloud computing, software, and hardware.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/272px-Google_2015_logo.svg.png',
    website: 'https://careers.google.com',
    location: 'Mountain View, California, USA',
    industry: 'Technology',
    size: '100,000+',
    founded: 1998,
    isVerified: true
  },
  {
    name: 'Microsoft',
    description: 'Microsoft Corporation is an American multinational technology company which produces computer software, consumer electronics, personal computers, and related services.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/2560px-Microsoft_logo.svg.png',
    website: 'https://careers.microsoft.com',
    location: 'Redmond, Washington, USA',
    industry: 'Technology',
    size: '100,000+',
    founded: 1975,
    isVerified: true
  },
  {
    name: 'Amazon',
    description: 'Amazon.com, Inc. is an American multinational technology company focusing on e-commerce, cloud computing, digital streaming, and artificial intelligence.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png',
    website: 'https://www.amazon.jobs',
    location: 'Seattle, Washington, USA',
    industry: 'Technology',
    size: '100,000+',
    founded: 1994,
    isVerified: true
  },
  {
    name: 'Apple Inc.',
    description: 'Apple Inc. is an American multinational technology company that specializes in consumer electronics, computer software, and online services.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/1667px-Apple_logo_black.svg.png',
    website: 'https://jobs.apple.com',
    location: 'Cupertino, California, USA',
    industry: 'Technology',
    size: '100,000+',
    founded: 1976,
    isVerified: true
  },
  {
    name: 'Meta (Facebook)',
    description: 'Meta Platforms, Inc., doing business as Meta, is an American multinational technology conglomerate based in Menlo Park, California.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/2560px-Meta_Platforms_Inc._logo.svg.png',
    website: 'https://careers.meta.com',
    location: 'Menlo Park, California, USA',
    industry: 'Technology',
    size: '100,000+',
    founded: 2004,
    isVerified: true
  },
  {
    name: 'Netflix',
    description: 'Netflix, Inc. is an American subscription streaming service and production company. Launched on August 29, 1997, it offers a library of films and television series.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/2560px-Netflix_2015_logo.svg.png',
    website: 'https://jobs.netflix.com',
    location: 'Los Gatos, California, USA',
    industry: 'Entertainment',
    size: '10,000+',
    founded: 1997,
    isVerified: true
  },
  {
    name: 'Uber',
    description: 'Uber Technologies, Inc. is an American multinational transportation network company. The company offers services including peer-to-peer ridesharing, ride service hailing, food delivery.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Uber_logo_2018.svg/2560px-Uber_logo_2018.svg.png',
    website: 'https://www.uber.com/careers',
    location: 'San Francisco, California, USA',
    industry: 'Transportation',
    size: '10,000+',
    founded: 2009,
    isVerified: true
  },
  {
    name: 'Airbnb',
    description: 'Airbnb, Inc. is an American company operating an online marketplace for short- and long-term homestays and experiences.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Airbnb_Logo_B%C3%A9lo.svg/2560px-Airbnb_Logo_B%C3%A9lo.svg.png',
    website: 'https://careers.airbnb.com',
    location: 'San Francisco, California, USA',
    industry: 'Travel',
    size: '10,000+',
    founded: 2008,
    isVerified: true
  },
  {
    name: 'Spotify',
    description: 'Spotify is a Swedish audio streaming and media services provider, launched in October 2008. It is one of the largest music streaming service providers.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/168px-Spotify_logo_without_text.svg.png',
    website: 'https://careers.spotify.com',
    location: 'Stockholm, Sweden',
    industry: 'Entertainment',
    size: '10,000+',
    founded: 2006,
    isVerified: true
  },
  {
    name: 'Slack',
    description: 'Slack is a proprietary business communication platform developed by American software company Slack Technologies.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/2048px-Slack_icon_2019.svg.png',
    website: 'https://slack.com/careers',
    location: 'San Francisco, California, USA',
    industry: 'Technology',
    size: '1,000+',
    founded: 2009,
    isVerified: true
  }
];

async function seedRealCompanies() {
  try {
    console.log('🏢 Starting real companies seeding...');
    
    // Check if companies already exist
    const existingCount = await prisma.company.count();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing companies. Do you want to continue? (y/n)`);
      // For now, we'll continue
    }
    
    // Create companies
    console.log('🏢 Creating real companies...');
    const createdCompanies = [];
    
    for (const companyData of realCompanies) {
      console.log(`   Creating company: ${companyData.name}`);
      
      const company = await prisma.company.create({
        data: companyData
      });
      
      createdCompanies.push(company);
      console.log(`   ✅ Created company: ${company.id} - ${company.name}`);
    }
    
    console.log('\n🎉 Real companies seeding completed successfully!');
    console.log(`📊 Created ${createdCompanies.length} companies`);
    
    // Display company details
    console.log('\n📋 Company Details:');
    createdCompanies.forEach(company => {
      console.log(`   ${company.name} (${company.industry}) - ${company.location}`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding real companies:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
if (process.argv[1] === new URL(import.meta.url).pathname) {
  seedRealCompanies()
    .then(() => {
      console.log('✅ Real companies seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Real companies seeding failed:', error);
      process.exit(1);
    });
}

export { seedRealCompanies };
