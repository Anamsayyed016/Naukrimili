/**
 * Authentication Debug Test Script
 * Run this to test the authentication flow and identify issues
 */

const testAuthFlow = async () => {
  console.log('🔍 Testing Authentication Flow...\n');
  
  try {
    // Test 1: Check debug endpoint
    console.log('1. Testing user status debug endpoint...');
    const debugResponse = await fetch('http://localhost:3000/api/debug/user-status');
    const debugData = await debugResponse.json();
    
    console.log('Debug Response:', JSON.stringify(debugData, null, 2));
    
    if (debugData.success) {
      console.log('✅ Debug endpoint working');
      
      const { session, database, comparison } = debugData.debug;
      
      console.log('\n📊 Analysis:');
      console.log('- Session has ID:', session.hasId);
      console.log('- Session has Role:', session.hasRole);
      console.log('- Database user found:', database.found);
      console.log('- Database user has role:', database.hasRole);
      console.log('- IDs match:', comparison.idsMatch);
      console.log('- Roles match:', comparison.rolesMatch);
      
      if (!session.hasId) {
        console.log('❌ ISSUE: Session missing user ID');
      }
      if (!database.found) {
        console.log('❌ ISSUE: User not found in database');
      }
      if (!comparison.idsMatch) {
        console.log('❌ ISSUE: Session ID and database ID mismatch');
      }
    } else {
      console.log('❌ Debug endpoint failed:', debugData.error);
    }
    
    // Test 2: Check jobs API
    console.log('\n2. Testing jobs API...');
    const jobsResponse = await fetch('http://localhost:3000/api/jobs/unified?limit=5');
    const jobsData = await jobsResponse.json();
    
    console.log('Jobs Response:', JSON.stringify(jobsData, null, 2));
    
    if (jobsData.success) {
      console.log(`✅ Jobs API working - Found ${jobsData.jobs?.length || 0} jobs`);
    } else {
      console.log('❌ Jobs API failed:', jobsData.error);
    }
    
    // Test 3: Check role update API (if user exists)
    if (debugData.success && debugData.debug.database.user) {
      console.log('\n3. Testing role update API...');
      const roleUpdateResponse = await fetch('http://localhost:3000/api/auth/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: debugData.debug.database.user.id,
          role: 'jobseeker'
        })
      });
      
      const roleUpdateData = await roleUpdateResponse.json();
      console.log('Role Update Response:', JSON.stringify(roleUpdateData, null, 2));
      
      if (roleUpdateData.success) {
        console.log('✅ Role update API working');
      } else {
        console.log('❌ Role update API failed:', roleUpdateData.error);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testAuthFlow();
