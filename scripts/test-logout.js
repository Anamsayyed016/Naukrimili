import fetch from 'node-fetch';

async function testLogout() {
  try {
    console.log('🧪 Testing logout functionality...');
    
    // Test the logout API endpoint
    const response = await fetch('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Logout API endpoint is working correctly');
      console.log('📝 Response:', data);
    } else {
      console.log('❌ Logout API endpoint failed');
      console.log('📝 Error:', data);
    }
    
  } catch (error) {
    console.error('❌ Error testing logout:', error);
  }
}

// Run the test
testLogout();
