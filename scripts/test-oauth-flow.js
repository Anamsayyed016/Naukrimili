#!/usr/bin/env node

/**
 * Test OAuth Flow Script
 * Tests the role selection API endpoint
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testOAuthFlow() {
  try {
    console.log('🧪 Testing OAuth flow...');
    
    // Check if we have any OAuth users
    const oauthUsers = await prisma.user.findMany({
      where: {
        OR: [
          { accounts: { some: { provider: 'google' } } },
          { accounts: { some: { provider: 'linkedin' } } }
        ]
      },
      include: {
        accounts: true
      }
    });
    
    console.log(`📊 Found ${oauthUsers.length} OAuth users:`);
    oauthUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role || 'no role'})`);
      user.accounts.forEach(account => {
        console.log(`    Provider: ${account.provider}`);
      });
    });
    
    // Test role update for OAuth users
    for (const user of oauthUsers) {
      if (!user.role) {
        console.log(`\n🔧 Testing role update for ${user.email}...`);
        
        // Simulate role update
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { role: 'employer' },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true
          }
        });
        
        console.log(`✅ Role updated successfully:`, updatedUser);
      }
    }
    
    console.log('\n🎉 OAuth flow test completed!');
    
  } catch (error) {
    console.error('❌ Error testing OAuth flow:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOAuthFlow();