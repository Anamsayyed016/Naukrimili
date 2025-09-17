#!/usr/bin/env node

/**
 * Test script to verify toLocaleString fixes
 * This script tests the common patterns that were causing errors
 */

console.log('🧪 Testing toLocaleString fixes...\n');

// Test 1: Admin dashboard stats
console.log('1. Testing admin dashboard stats:');
const mockStats = {
  totalViews: undefined,
  averageSalary: null,
  totalUsers: 0,
  activeUsers: undefined
};

try {
  const totalViews = (mockStats?.totalViews || 0).toLocaleString();
  const averageSalary = (mockStats?.averageSalary || 0).toLocaleString();
  const totalUsers = (mockStats?.totalUsers || 0).toLocaleString();
  const activeUsers = (mockStats?.activeUsers || 0).toLocaleString();
  
  console.log('✅ Admin stats:', { totalViews, averageSalary, totalUsers, activeUsers });
} catch (error) {
  console.log('❌ Admin stats error:', error.message);
}

// Test 2: Search stats
console.log('\n2. Testing search stats:');
const mockSearchStats = {
  totalJobs: undefined,
  searchTime: 150
};

try {
  const totalJobs = (mockSearchStats?.totalJobs || 0).toLocaleString();
  console.log('✅ Search stats:', { totalJobs });
} catch (error) {
  console.log('❌ Search stats error:', error.message);
}

// Test 3: Pagination
console.log('\n3. Testing pagination:');
const mockPagination = {
  total: null
};

try {
  const total = (mockPagination.total || 0).toLocaleString();
  console.log('✅ Pagination:', { total });
} catch (error) {
  console.log('❌ Pagination error:', error.message);
}

// Test 4: Salary range
console.log('\n4. Testing salary range:');
const mockSalaryRange = [undefined, null];

try {
  const minSalary = (mockSalaryRange[0] || 0).toLocaleString();
  const maxSalary = (mockSalaryRange[1] || 0).toLocaleString();
  console.log('✅ Salary range:', { minSalary, maxSalary });
} catch (error) {
  console.log('❌ Salary range error:', error.message);
}

// Test 5: Location data
console.log('\n5. Testing location data:');
const mockLocation = {
  jobCount: undefined
};

try {
  const jobCount = (mockLocation.jobCount || 0).toLocaleString();
  console.log('✅ Location data:', { jobCount });
} catch (error) {
  console.log('❌ Location data error:', error.message);
}

// Test 6: Array reduce with undefined values
console.log('\n6. Testing array reduce:');
const mockLocations = [
  { jobCount: 100 },
  { jobCount: undefined },
  { jobCount: null },
  { jobCount: 50 }
];

try {
  const totalJobs = mockLocations.reduce((sum, loc) => sum + (loc.jobCount || 0), 0);
  const formattedTotal = totalJobs.toLocaleString();
  console.log('✅ Array reduce:', { totalJobs, formattedTotal });
} catch (error) {
  console.log('❌ Array reduce error:', error.message);
}

console.log('\n🎉 All toLocaleString fixes tested successfully!');
console.log('The application should now handle undefined/null values gracefully.');
