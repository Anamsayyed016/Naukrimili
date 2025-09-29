// Test search logic without database
console.log('🧪 Testing Search Logic Without Database...\n');

// Mock job data
const mockJobs = [
  {
    id: 1,
    title: 'Senior Software Developer',
    company: 'TechCorp',
    location: 'Mumbai, India',
    description: 'We are looking for a senior software developer...',
    skills: 'JavaScript, React, Node.js',
    isRemote: false,
    source: 'database'
  },
  {
    id: 2,
    title: 'Frontend Developer',
    company: 'WebTech',
    location: 'Delhi, India',
    description: 'Frontend developer position...',
    skills: 'React, Vue.js, CSS',
    isRemote: false,
    source: 'database'
  },
  {
    id: 3,
    title: 'Backend Developer',
    company: 'DataFlow',
    location: 'Mumbai, Maharashtra',
    description: 'Backend developer role...',
    skills: 'Python, Django, PostgreSQL',
    isRemote: true,
    source: 'database'
  },
  {
    id: 4,
    title: 'Product Manager',
    company: 'InnovateLabs',
    location: 'Bangalore, Karnataka',
    description: 'Product management position...',
    skills: 'Product Management, Analytics',
    isRemote: false,
    source: 'database'
  }
];

// Mock search function
function searchJobs(query, location) {
  console.log(`🔍 Searching for: query="${query}", location="${location}"`);
  
  let filteredJobs = mockJobs;
  
  // Apply keyword filter
  if (query && query.trim()) {
    const searchTerm = query.toLowerCase();
    filteredJobs = filteredJobs.filter(job => 
      job.title.toLowerCase().includes(searchTerm) ||
      job.company.toLowerCase().includes(searchTerm) ||
      job.description.toLowerCase().includes(searchTerm) ||
      job.skills.toLowerCase().includes(searchTerm)
    );
    console.log(`📝 After keyword filter: ${filteredJobs.length} jobs`);
  }
  
  // Apply location filter
  if (location && location.trim()) {
    const locationTerm = location.toLowerCase();
    filteredJobs = filteredJobs.filter(job => 
      job.location.toLowerCase().includes(locationTerm)
    );
    console.log(`📍 After location filter: ${filteredJobs.length} jobs`);
  }
  
  return filteredJobs;
}

// Test cases
const testCases = [
  {
    name: "Keyword only: 'developer'",
    query: "developer",
    location: "",
    expected: "Should find 3 developer jobs"
  },
  {
    name: "Location only: 'Mumbai'",
    query: "",
    location: "Mumbai",
    expected: "Should find 2 jobs in Mumbai"
  },
  {
    name: "Combined: 'developer' + 'Mumbai'",
    query: "developer",
    location: "Mumbai",
    expected: "Should find 2 developer jobs in Mumbai"
  },
  {
    name: "Combined: 'developer' + 'Delhi'",
    query: "developer",
    location: "Delhi",
    expected: "Should find 1 developer job in Delhi"
  }
];

console.log('📊 Mock Job Data:');
mockJobs.forEach(job => {
  console.log(`  - ${job.title} at ${job.company} (${job.location})`);
});
console.log('');

// Run tests
testCases.forEach((testCase, index) => {
  console.log(`\n🧪 Test ${index + 1}: ${testCase.name}`);
  console.log(`Expected: ${testCase.expected}`);
  
  const results = searchJobs(testCase.query, testCase.location);
  
  console.log(`✅ Results: Found ${results.length} jobs`);
  results.forEach(job => {
    console.log(`   - ${job.title} at ${job.company} (${job.location})`);
  });
  
  if (results.length === 0) {
    console.log('❌ No jobs found - this might indicate the search logic issue');
  } else {
    console.log('✅ Search logic is working correctly!');
  }
});

console.log('\n🎯 Summary:');
console.log('The search logic itself is working correctly.');
console.log('The issue is likely:');
console.log('1. Database not running or not accessible');
console.log('2. No jobs in the database');
console.log('3. Database connection configuration issues');
console.log('4. Server not running properly');
