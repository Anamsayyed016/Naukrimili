/**
 * Verification Script for Job URL Fixes
 * Tests SEO URL generation and parsing after Math.random() fix
 */

import { parseSEOJobUrl, isValidJobId, generateSEOJobUrl } from '../lib/seo-url-utils';

interface TestCase {
  name: string;
  input: string;
  expected: string | null;
  shouldPass: boolean;
}

const urlParsingTests: TestCase[] = [
  // Valid numeric IDs
  {
    name: 'Direct numeric ID',
    input: '123',
    expected: '123',
    shouldPass: true
  },
  {
    name: 'SEO URL with numeric ID',
    input: 'software-engineer-google-bangalore-senior-123',
    expected: '123',
    shouldPass: true
  },
  // Valid external job IDs
  {
    name: 'External job ID (ext)',
    input: 'data-analyst-microsoft-mumbai-ext-1730000000-534219',
    expected: 'ext-1730000000-534219',
    shouldPass: true
  },
  {
    name: 'Adzuna job ID',
    input: 'frontend-developer-techcorp-london-adzuna-1730000000-0-456789',
    expected: 'adzuna-1730000000-0-456789',
    shouldPass: true
  },
  {
    name: 'JSearch job ID',
    input: 'backend-developer-amazon-seattle-jsearch-1730000000-0-789012',
    expected: 'jsearch-1730000000-0-789012',
    shouldPass: true
  },
  // Sample job IDs
  {
    name: 'Sample job ID',
    input: 'product-manager-startup-bangalore-sample-1759851700270-18',
    expected: 'sample-1759851700270-18',
    shouldPass: true
  },
  // Invalid decimal IDs (should fail gracefully)
  {
    name: 'Decimal ID from Math.random()',
    input: 'senior-developer-company-location-0.09048953860373155',
    expected: null,
    shouldPass: false
  },
  {
    name: 'Another decimal ID',
    input: 'data-scientist-firm-city-0.5432156789',
    expected: null,
    shouldPass: false
  },
  // Edge cases
  {
    name: 'URL with trailing slash',
    input: 'software-engineer-google-bangalore-123/',
    expected: '123',
    shouldPass: true
  },
  {
    name: 'URL with /apply suffix',
    input: 'software-engineer-google-bangalore-123/apply',
    expected: '123',
    shouldPass: true
  }
];

const idValidationTests = [
  { id: '123', valid: true, name: 'Numeric ID' },
  { id: 456, valid: true, name: 'Number ID' },
  { id: 'ext-1730000000-534219', valid: true, name: 'External ID' },
  { id: 'sample-1759851700270-18', valid: true, name: 'Sample ID' },
  { id: '0.09048953860373155', valid: false, name: 'Decimal from Math.random()' },
  { id: 0.5432156789, valid: false, name: 'Decimal number' },
  { id: '', valid: false, name: 'Empty string' },
  { id: null, valid: false, name: 'Null' },
  { id: undefined, valid: false, name: 'Undefined' }
];

const urlGenerationTests = [
  {
    name: 'Valid job data',
    data: {
      id: '123',
      title: 'Software Engineer',
      company: 'Google',
      location: 'Bangalore, India'
    },
    expectedPattern: /^\/jobs\/software-engineer-google-bangalore-india-123$/
  },
  {
    name: 'External job data',
    data: {
      id: 'ext-1730000000-534219',
      title: 'Data Analyst',
      company: 'Microsoft',
      location: 'Mumbai'
    },
    expectedPattern: /^\/jobs\/data-analyst-microsoft-mumbai-ext-1730000000-534219$/
  },
  {
    name: 'Invalid decimal ID',
    data: {
      id: '0.09048953860373155',
      title: 'Senior Developer',
      company: 'TechCorp',
      location: 'Delhi'
    },
    expectedPattern: /^\/jobs\/invalid$/
  }
];

console.log('🧪 Running Job URL Verification Tests\n');
console.log('='.repeat(60));

// Test URL Parsing
console.log('\n📝 URL Parsing Tests\n');
let passingTests = 0;
let failingTests = 0;

urlParsingTests.forEach(test => {
  const result = parseSEOJobUrl(test.input);
  const passed = test.shouldPass 
    ? result === test.expected 
    : result === test.expected || result === null;
  
  if (passed) {
    console.log(`✅ PASS: ${test.name}`);
    console.log(`   Input: ${test.input}`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Got: ${result}\n`);
    passingTests++;
  } else {
    console.log(`❌ FAIL: ${test.name}`);
    console.log(`   Input: ${test.input}`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Got: ${result}\n`);
    failingTests++;
  }
});

// Test ID Validation
console.log('\n🔐 ID Validation Tests\n');
idValidationTests.forEach(test => {
  const result = isValidJobId(test.id);
  const passed = result === test.valid;
  
  if (passed) {
    console.log(`✅ PASS: ${test.name} - ID: ${test.id} → ${result ? 'Valid' : 'Invalid'}`);
    passingTests++;
  } else {
    console.log(`❌ FAIL: ${test.name} - ID: ${test.id} → Expected: ${test.valid}, Got: ${result}`);
    failingTests++;
  }
});

// Test URL Generation
console.log('\n🔗 URL Generation Tests\n');
urlGenerationTests.forEach(test => {
  const result = generateSEOJobUrl(test.data);
  const passed = test.expectedPattern.test(result);
  
  if (passed) {
    console.log(`✅ PASS: ${test.name}`);
    console.log(`   Generated: ${result}\n`);
    passingTests++;
  } else {
    console.log(`❌ FAIL: ${test.name}`);
    console.log(`   Expected pattern: ${test.expectedPattern}`);
    console.log(`   Got: ${result}\n`);
    failingTests++;
  }
});

// Summary
console.log('='.repeat(60));
console.log('\n📊 Test Results Summary\n');
console.log(`✅ Passing: ${passingTests}`);
console.log(`❌ Failing: ${failingTests}`);
console.log(`📊 Total: ${passingTests + failingTests}`);
console.log(`✨ Success Rate: ${((passingTests / (passingTests + failingTests)) * 100).toFixed(2)}%\n`);

if (failingTests === 0) {
  console.log('🎉 All tests passed! Job URL fixes are working correctly.\n');
  process.exit(0);
} else {
  console.log('⚠️ Some tests failed. Please review the fixes.\n');
  process.exit(1);
}

