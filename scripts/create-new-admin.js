#!/usr/bin/env node

/**
 * Create New Admin User Script
 * Creates admin user with specified credentials
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createNewAdmin() {
  try {
    console.log('🔐 Setting up admin user with email/password authentication...');
    console.log('📧 Email: naukrimili@naukrimili.com');
    console.log('🔑 Password: naukrimili@123\n');
    
    // Check if admin user already exists
    let adminUser = await prisma.user.findUnique({
      where: { email: 'naukrimili@naukrimili.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        password: true
      }
    });
    
    // Check for duplicate admin users with same email
    const duplicateUsers = await prisma.user.findMany({
      where: { email: 'naukrimili@naukrimili.com' },
      orderBy: { createdAt: 'asc' }
    });
    
    if (duplicateUsers.length > 1) {
      console.log(`⚠️ Found ${duplicateUsers.length} duplicate admin user(s). Keeping the first one, removing others...`);
      const usersToDelete = duplicateUsers.slice(1);
      for (const userToDelete of usersToDelete) {
        // Delete OAuth accounts first (if any)
        await prisma.account.deleteMany({
          where: { userId: userToDelete.id }
        });
        // Delete sessions
        await prisma.session.deleteMany({
          where: { userId: userToDelete.id }
        });
        // Delete the duplicate user
        await prisma.user.delete({
          where: { id: userToDelete.id }
        });
        console.log(`✅ Removed duplicate admin user: ${userToDelete.id}`);
      }
      console.log('✅ Duplicate admin users removed.\n');
    }
    
    // Check for any OAuth accounts linked to this email (should be removed)
    const oauthAccounts = await prisma.account.findMany({
      where: {
        user: {
          email: 'naukrimili@naukrimili.com'
        }
      }
    });
    
    if (oauthAccounts.length > 0) {
      console.log(`⚠️ Found ${oauthAccounts.length} OAuth account(s) linked to admin email. Removing...`);
      await prisma.account.deleteMany({
        where: {
          user: {
            email: 'naukrimili@naukrimili.com'
          }
        }
      });
      console.log('✅ OAuth accounts removed. Admin will use email/password only.\n');
    }
    
    if (adminUser) {
      console.log('👤 Admin user already exists, updating...');
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash('naukrimili@123', 12);
      
      // Update existing admin user
      adminUser = await prisma.user.update({
        where: { email: 'naukrimili@naukrimili.com' },
        data: {
          password: hashedPassword,
          role: 'admin',
          isVerified: true,
          isActive: true,
          firstName: 'Naukrimili',
          lastName: 'Admin',
          phone: '+91-9876543210',
          location: 'India',
          bio: 'Naukrimili System Administrator',
          skills: '["System Administration", "Job Portal Management", "User Management"]',
          experience: '5+ years in job portal administration',
          education: 'B.Tech in Computer Science'
        }
      });
      console.log('✅ Admin user updated successfully!');
    } else {
      console.log('📝 Creating new admin user...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash('naukrimili@123', 12);
      
      // Create new admin user
      adminUser = await prisma.user.create({
        data: {
          email: 'naukrimili@naukrimili.com',
          firstName: 'Naukrimili',
          lastName: 'Admin',
          role: 'admin',
          password: hashedPassword,
          phone: '+91-9876543210',
          location: 'India',
          bio: 'Naukrimili System Administrator',
          skills: '["System Administration", "Job Portal Management", "User Management"]',
          experience: '5+ years in job portal administration',
          education: 'B.Tech in Computer Science',
          isVerified: true,
          isActive: true
        }
      });
      console.log('✅ Admin user created successfully!');
    }
    
    // Verify the admin user was created/updated
    console.log('\n🔍 Verifying admin user...');
    const verifyUser = await prisma.user.findUnique({
      where: { email: 'naukrimili@naukrimili.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        password: true
      }
    });
    
    if (verifyUser) {
      console.log('✅ Admin user verification successful!');
      console.log(`📧 Email: ${verifyUser.email}`);
      console.log(`👤 Name: ${verifyUser.firstName} ${verifyUser.lastName}`);
      console.log(`🔑 Role: ${verifyUser.role}`);
      console.log(`✅ Active: ${verifyUser.isActive}`);
      console.log(`✅ Verified: ${verifyUser.isVerified}`);
      console.log(`🔐 Has Password: ${!!verifyUser.password}`);
    } else {
      console.log('❌ Admin user verification failed!');
    }
    
    // Test password verification
    if (verifyUser && verifyUser.password) {
      console.log('\n🧪 Testing password verification...');
      const testPassword = await bcrypt.compare('naukrimili@123', verifyUser.password);
      console.log(`🔐 Password test: ${testPassword ? 'PASS' : 'FAIL'}`);
    } else {
      console.log('⚠️ Cannot test password - user or password not found');
    }
    
    console.log('\n🎉 Admin setup completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('📧 Email: naukrimili@naukrimili.com');
    console.log('🔑 Password: naukrimili@123');
    console.log('👤 Role: admin');
    console.log('\n🌐 Access URLs:');
    console.log('🔗 Login: /auth/signin');
    console.log('🔗 Admin Dashboard: /dashboard/admin');
    console.log('🔗 Admin Companies: /dashboard/admin/companies');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createNewAdmin();
