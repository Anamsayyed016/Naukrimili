// Test script to verify location search functionality
const testSearch = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing Location Search Functionality...\n');
  
  // Test 1: Search with keyword only
  console.log('Test 1: Keyword only search');
  try {
    const response1 = await fetch(`${baseUrl}/api/jobs?query=developer&limit=5`);
    const data1 = await response1.json();
    console.log(`✅ Keyword search: Found ${data1.data?.jobs?.length || 0} jobs`);
    console.log(`   Sample job locations: ${data1.data?.jobs?.slice(0, 3).map(j => j.location).join(', ')}`);
  } catch (error) {
    console.log('❌ Keyword search failed:', error.message);
  }
  
  // Test 2: Search with location only
  console.log('\nTest 2: Location only search');
  try {
    const response2 = await fetch(`${baseUrl}/api/jobs?location=Mumbai&limit=5`);
    const data2 = await response2.json();
    console.log(`✅ Location search: Found ${data2.data?.jobs?.length || 0} jobs`);
    console.log(`   Sample job locations: ${data2.data?.jobs?.slice(0, 3).map(j => j.location).join(', ')}`);
  } catch (error) {
    console.log('❌ Location search failed:', error.message);
  }
  
  // Test 3: Combined search (keyword + location)
  console.log('\nTest 3: Combined search (keyword + location)');
  try {
    const response3 = await fetch(`${baseUrl}/api/jobs?query=developer&location=Mumbai&limit=5`);
    const data3 = await response3.json();
    console.log(`✅ Combined search: Found ${data3.data?.jobs?.length || 0} jobs`);
    console.log(`   Sample job locations: ${data3.data?.jobs?.slice(0, 3).map(j => j.location).join(', ')}`);
  } catch (error) {
    console.log('❌ Combined search failed:', error.message);
  }
  
  // Test 4: Different location
  console.log('\nTest 4: Different location (Delhi)');
  try {
    const response4 = await fetch(`${baseUrl}/api/jobs?query=engineer&location=Delhi&limit=5`);
    const data4 = await response4.json();
    console.log(`✅ Delhi search: Found ${data4.data?.jobs?.length || 0} jobs`);
    console.log(`   Sample job locations: ${data4.data?.jobs?.slice(0, 3).map(j => j.location).join(', ')}`);
  } catch (error) {
    console.log('❌ Delhi search failed:', error.message);
  }
  
  console.log('\n🏁 Test completed!');
};

// Run the test
testSearch().catch(console.error);
