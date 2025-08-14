#!/usr/bin/env node

/**
 * Comprehensive API Validation Script
 * Tests all API endpoints to ensure they're working with real data
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 'test-user-123';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class APIValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  async testEndpoint(name, method, url, options = {}) {
    this.log(`\n${colors.blue}Testing: ${name}${colors.reset}`);
    this.log(`${method} ${url}`);
    
    try {
      const config = {
        method: method.toLowerCase(),
        url: `${BASE_URL}${url}`,
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': TEST_USER_ID,
          ...options.headers
        },
        validateStatus: function (status) {
          return status >= 200 && status < 600; // Don't throw on any status
        }
      };

      if (options.data) {
        config.data = options.data;
      }

      const response = await axios(config);
      const isSuccess = response.status >= 200 && response.status < 300;
      
      const testResult = {
        name,
        method,
        url,
        status: response.status,
        success: isSuccess,
        hasRealData: this.checkForRealData(response.data),
        responseTime: response.headers['x-response-time'] || 'N/A',
        data: response.data
      };

      if (isSuccess && testResult.hasRealData) {
        this.log(`${colors.green}✓ PASS: ${response.status} - Real data detected${colors.reset}`);
        this.results.passed++;
      } else if (isSuccess && !testResult.hasRealData) {
        this.log(`${colors.yellow}⚠ WARN: ${response.status} - Mock data detected${colors.reset}`);
        this.results.warnings++;
      } else {
        this.log(`${colors.red}✗ FAIL: ${response.status} - ${response.data?.error || 'Request failed'}${colors.reset}`);
        this.results.failed++;
      }

      this.results.tests.push(testResult);
      return testResult;

    } catch (error) {
      this.log(`${colors.red}✗ FAIL: Network error - ${error.message}${colors.reset}`);
      
      const testResult = {
        name,
        method,
        url,
        success: false,
        error: error.message,
        hasRealData: false
      };
      
      this.results.failed++;
      this.results.tests.push(testResult);
      return testResult;
    }
  }

  checkForRealData(responseData) {
    if (!responseData) return false;
    
    // Check for real data indicators
    const realDataIndicators = [
      'REAL_DATA',
      'database_status',
      'totalJobs',
      'sourceBreakdown',
      'DATABASE_URL'
    ];

    // Check for mock data indicators
    const mockDataIndicators = [
      'MOCK',
      'mock',
      'test data',
      'placeholder',
      'pretend',
      'simulate'
    ];

    const dataString = JSON.stringify(responseData).toLowerCase();
    
    // Strong indicators of real data
    if (realDataIndicators.some(indicator => 
      dataString.includes(indicator.toLowerCase())
    )) {
      return true;
    }

    // Strong indicators of mock data
    if (mockDataIndicators.some(indicator => 
      dataString.includes(indicator)
    )) {
      return false;
    }

    // Check for database connection indicators
    if (responseData.database_status === 'CONNECTED' || 
        responseData.dataType === 'REAL_DATA') {
      return true;
    }

    // If response has actual job/resume data with realistic structure
    if (responseData.jobs && Array.isArray(responseData.jobs) && 
        responseData.jobs.length > 0) {
      return responseData.jobs.some(job => 
        job.source && job.createdAt && job.id
      );
    }

    // Default to false if unsure
    return false;
  }

  async runAllTests() {
    this.log(`${colors.bold}${colors.blue}🧪 Starting Comprehensive API Validation${colors.reset}\n`);
    this.log(`Base URL: ${BASE_URL}`);
    this.log(`Test User ID: ${TEST_USER_ID}\n`);

    // Basic test endpoints
    await this.testEndpoint('Basic Test', 'GET', '/api/test');
    await this.testEndpoint('Health Check', 'GET', '/api/health');

    // Database and real data tests
    await this.testEndpoint('Real Data Test', 'GET', '/api/test-real-data');
    await this.testEndpoint('Jobs Real Data', 'GET', '/api/jobs/real');

    // Job-related APIs
    await this.testEndpoint('Jobs List', 'GET', '/api/jobs');
    await this.testEndpoint('Jobs Search', 'GET', '/api/jobs?query=developer&location=bangalore');
    await this.testEndpoint('Job Stats', 'GET', '/api/jobs/stats');
    await this.testEndpoint('Job Sectors', 'GET', '/api/jobs/sectors');
    await this.testEndpoint('Salary Stats', 'GET', '/api/jobs/salary-stats');

    // Job import and external APIs
    await this.testEndpoint('Job Import', 'POST', '/api/jobs/import', {
      data: {
        queries: ['software engineer'],
        country: 'IN',
        page: 1,
        source: 'all'
      }
    });

    // Resume APIs
    await this.testEndpoint('Resume List', 'GET', '/api/resumes');
    await this.testEndpoint('Resume API Docs', 'GET', '/api/resumes?docs=true');
    
    await this.testEndpoint('Resume Create', 'POST', '/api/resumes', {
      data: {
        action: 'create',
        data: {
          fullName: 'Test User API Validation',
          contact: { email: 'test@example.com', phone: '+1234567890' },
          summary: 'API validation test resume',
          skills: ['JavaScript', 'Node.js', 'API Testing'],
          education: [],
          workExperience: [],
          certifications: [],
          projects: []
        }
      }
    });

    // User and auth APIs
    await this.testEndpoint('Users List', 'GET', '/api/users');
    await this.testEndpoint('User Profile', 'GET', `/api/users/${TEST_USER_ID}`);

    // Application APIs
    await this.testEndpoint('Applications', 'GET', '/api/applications');

    // Admin APIs
    await this.testEndpoint('Admin Dashboard', 'GET', '/api/admin');

    // Location and search APIs
    await this.testEndpoint('Locations', 'GET', '/api/locations');
    await this.testEndpoint('Search Suggestions', 'GET', '/api/search-suggestions?q=soft');

    // Additional test endpoints
    await this.testEndpoint('Test Jobs', 'GET', '/api/test-jobs');
    await this.testEndpoint('Debug Jobs', 'GET', '/api/debug-jobs');

    this.generateReport();
  }

  generateReport() {
    this.log(`\n${colors.bold}${colors.blue}📊 API Validation Report${colors.reset}`);
    this.log(`${'='.repeat(50)}`);
    
    this.log(`${colors.green}✓ Passed: ${this.results.passed}${colors.reset}`);
    this.log(`${colors.yellow}⚠ Warnings: ${this.results.warnings} (mock data)${colors.reset}`);
    this.log(`${colors.red}✗ Failed: ${this.results.failed}${colors.reset}`);
    
    const total = this.results.passed + this.results.warnings + this.results.failed;
    const successRate = ((this.results.passed / total) * 100).toFixed(1);
    const realDataRate = (((this.results.passed) / total) * 100).toFixed(1);
    
    this.log(`\nTotal Tests: ${total}`);
    this.log(`Success Rate: ${successRate}%`);
    this.log(`Real Data Rate: ${realDataRate}%`);

    // Detailed results
    this.log(`\n${colors.bold}Detailed Results:${colors.reset}`);
    this.results.tests.forEach(test => {
      const status = test.success ? 
        (test.hasRealData ? '✓ REAL' : '⚠ MOCK') : 
        '✗ FAIL';
      
      const color = test.success ? 
        (test.hasRealData ? colors.green : colors.yellow) : 
        colors.red;
      
      this.log(`${color}${status}${colors.reset} ${test.method} ${test.url} (${test.status || 'ERROR'})`);
    });

    // Recommendations
    this.log(`\n${colors.bold}Recommendations:${colors.reset}`);
    
    if (this.results.failed > 0) {
      this.log(`${colors.red}• Fix ${this.results.failed} failing endpoints${colors.reset}`);
    }
    
    if (this.results.warnings > 0) {
      this.log(`${colors.yellow}• Convert ${this.results.warnings} endpoints from mock to real data${colors.reset}`);
    }
    
    if (this.results.passed === total) {
      this.log(`${colors.green}• All APIs are working with real data! 🎉${colors.reset}`);
    }

    // Save detailed report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total,
        passed: this.results.passed,
        warnings: this.results.warnings,
        failed: this.results.failed,
        successRate: parseFloat(successRate),
        realDataRate: parseFloat(realDataRate)
      },
      tests: this.results.tests
    };

    fs.writeFileSync(
      path.join(__dirname, 'api-validation-report.json'),
      JSON.stringify(reportData, null, 2)
    );

    this.log(`\n${colors.blue}📄 Detailed report saved to: api-validation-report.json${colors.reset}`);
  }
}

// Run the validation
async function main() {
  const validator = new APIValidator();
  
  try {
    await validator.runAllTests();
  } catch (error) {
    console.error(`${colors.red}Validation failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Check if axios is available
try {
  require.resolve('axios');
  main();
} catch (error) {
  console.log(`${colors.yellow}Installing axios...${colors.reset}`);
  const { execSync } = require('child_process');
  
  try {
    execSync('npm install axios', { stdio: 'inherit' });
    console.log(`${colors.green}Axios installed successfully!${colors.reset}`);
    main();
  } catch (installError) {
    console.error(`${colors.red}Failed to install axios. Please run: npm install axios${colors.reset}`);
    process.exit(1);
  }
}