#!/usr/bin/env node

/**
 * USER SEEDING SCRIPT
 * Creates test users for development and testing
 * Run this after setting up your database connection
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Sample users data
const users = [
  {
    email: 'test@jobportal.com',
    name: 'Test User',
    role: 'jobseeker',
    phone: '+91-9876543210',
    location: 'Bangalore, Karnataka',
    bio: 'Experienced software developer looking for new opportunities',
    skills: ['JavaScript', 'React', 'Node.js', 'Python'],
    experience: '5+ years in software development',
    education: 'B.Tech Computer Science from IIT',
    isVerified: true,
    isActive: true
  },
  {
    email: 'employer@jobportal.com',
    name: 'Test Employer',
    role: 'employer',
    phone: '+91-9876543211',
    location: 'Mumbai, Maharashtra',
    bio: 'HR Manager at TechCorp Solutions',
    skills: ['HR Management', 'Recruitment', 'Employee Relations'],
    experience: '8+ years in HR and recruitment',
    education: 'MBA in Human Resources',
    isVerified: true,
    isActive: true
  },
  {
    email: 'admin@jobportal.com',
    name: 'System Admin',
    role: 'admin',
    password: 'admin123', // Will be hashed before saving
    phone: '+91-9876543212',
    location: 'Delhi, NCR',
    bio: 'System administrator for the job portal',
    skills: ['System Administration', 'Database Management', 'Security'],
    experience: '10+ years in IT administration',
    education: 'M.Tech in Computer Science',
    isVerified: true,
    isActive: true
  }
];

async function seedUsers() {
  try {
    console.log('🌱 Starting user seeding...');
    
    // Check if users already exist
    const existingUsers = await prisma.user.findMany();
    if (existingUsers.length > 0) {
      console.log(`📊 Found ${existingUsers.length} existing users`);
      existingUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.role})`);
      });
      
      // Ask if user wants to continue
      console.log('\n⚠️  Users already exist. Do you want to continue? (y/n)');
      // For now, we'll continue but you can add interactive input if needed
    }
    
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const userData of users) {
      try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });
        
        if (existingUser) {
          // Update existing user
          const updateData = {
            name: userData.name,
            role: userData.role,
            phone: userData.phone,
            location: userData.location,
            bio: userData.bio,
            skills: userData.skills,
            experience: userData.experience,
            education: userData.education,
            isVerified: userData.isVerified,
            isActive: userData.isActive
          };
          
          // Add password if provided and user doesn't have one
          if (userData.password && !existingUser.password) {
            updateData.password = await bcrypt.hash(userData.password, 10);
          }
          
          await prisma.user.update({
            where: { email: userData.email },
            data: updateData
          });
          updatedCount++;
          console.log(`✅ Updated user: ${userData.email}`);
        } else {
          // Create new user
          const createData = { ...userData };
          
          // Hash password if provided
          if (userData.password) {
            createData.password = await bcrypt.hash(userData.password, 10);
          }
          
          await prisma.user.create({
            data: createData
          });
          createdCount++;
          console.log(`✅ Created user: ${userData.email}`);
        }
      } catch (error) {
        console.error(`❌ Error processing user ${userData.email}:`, error);
      }
    }
    
    console.log(`\n🎉 User seeding completed!`);
    console.log(`📊 Created: ${createdCount} users`);
    console.log(`📊 Updated: ${updatedCount} users`);
    
    // Display final user count
    const finalUserCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${finalUserCount}`);
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedUsers();
    console.log('\n🎉 User seeding completed successfully!');
  } catch (error) {
    console.error('\n💥 User seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { seedUsers };
