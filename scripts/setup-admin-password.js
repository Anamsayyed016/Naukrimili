#!/usr/bin/env node

/**
 * Setup Admin Password Script
 * Sets up the admin password for the job portal
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function setupAdminPassword() {
  try {
    console.log('🔐 Setting up admin password...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Update admin user with password
    const adminUser = await prisma.user.update({
      where: { email: 'admin@jobportal.com' },
      data: { password: hashedPassword }
    });
    
    if (adminUser) {
      console.log('✅ Admin password set successfully!');
      console.log('📧 Email: admin@jobportal.com');
      console.log('🔑 Password: admin123');
      console.log('👤 Role: admin');
    } else {
      console.log('❌ Admin user not found. Please run seed-users.js first.');
    }
    
  } catch (error) {
    console.error('❌ Error setting up admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdminPassword();
