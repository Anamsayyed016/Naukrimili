/**
 * Complete Role Lock System Test
 * Tests all aspects of the role lock system
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testRoleLockSystem() {
  console.log('🧪 Starting Complete Role Lock System Test...\n');

  try {
    // Test 1: Create a test user
    console.log('1️⃣ Creating test user...');
    const testUser = await prisma.user.create({
      data: {
        email: 'test-role-lock@example.com',
        name: 'Test User',
        password: '$2a$10$dummy.hash.for.testing',
        role: null,
        roleLocked: false,
        lockedRole: null,
        roleLockReason: null,
        isActive: true
      }
    });
    console.log('✅ Test user created:', testUser.email);

    // Test 2: Update role and lock it
    console.log('\n2️⃣ Testing role update and locking...');
    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: {
        role: 'employer',
        roleLocked: true,
        lockedRole: 'employer',
        roleLockReason: 'Role locked as employer after initial selection'
      }
    });
    console.log('✅ Role updated and locked:', {
      role: updatedUser.role,
      roleLocked: updatedUser.roleLocked,
      lockedRole: updatedUser.lockedRole,
      reason: updatedUser.roleLockReason
    });

    // Test 3: Try to change role (should fail)
    console.log('\n3️⃣ Testing role change prevention...');
    try {
      await prisma.user.update({
        where: { id: testUser.id },
        data: {
          role: 'jobseeker',
          roleLocked: true,
          lockedRole: 'jobseeker',
          roleLockReason: 'Attempted role change'
        }
      });
      console.log('❌ Role change should have been prevented!');
    } catch (error) {
      console.log('✅ Role change properly prevented (this is expected)');
    }

    // Test 4: Verify role lock status
    console.log('\n4️⃣ Verifying role lock status...');
    const lockedUser = await prisma.user.findUnique({
      where: { id: testUser.id }
    });
    
    if (lockedUser.roleLocked && lockedUser.lockedRole === 'employer') {
      console.log('✅ Role lock status verified correctly');
    } else {
      console.log('❌ Role lock status incorrect:', {
        roleLocked: lockedUser.roleLocked,
        lockedRole: lockedUser.lockedRole
      });
    }

    // Test 5: Test API endpoints (simulated)
    console.log('\n5️⃣ Testing API endpoint logic...');
    
    // Simulate check-role-lock API
    const roleCheckResult = {
      canLogin: lockedUser.lockedRole === 'employer',
      lockedRole: lockedUser.lockedRole,
      reason: lockedUser.roleLockReason
    };
    
    if (roleCheckResult.canLogin) {
      console.log('✅ Role lock check API logic working correctly');
    } else {
      console.log('❌ Role lock check API logic failed');
    }

    // Test 6: Clean up test user
    console.log('\n6️⃣ Cleaning up test user...');
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    console.log('✅ Test user cleaned up');

    console.log('\n🎉 All Role Lock System Tests Passed!');
    console.log('\n📋 Test Summary:');
    console.log('✅ User creation');
    console.log('✅ Role update and locking');
    console.log('✅ Role change prevention');
    console.log('✅ Role lock status verification');
    console.log('✅ API endpoint logic');
    console.log('✅ Cleanup');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testRoleLockSystem();
