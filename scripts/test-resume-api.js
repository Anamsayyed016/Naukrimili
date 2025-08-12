/**
 * Resume API Testing Script
 * 
 * This script tests all the resume management API endpoints
 * Run with: node test-resume-api.js
 */

const API_BASE = 'http://localhost:3000/api/resumes';
const TEST_USER_ID = 'test-user-123';

// Sample resume data for testing
const sampleResumeData = {
  fullName: 'John Doe',
  contact: {
    email: 'john.doe@example.com',
    phone: '+1-555-123-4567',
    linkedin: 'https://linkedin.com/in/johndoe',
  },
  summary: 'Experienced software engineer with 5+ years of expertise in full-stack development, specializing in React, Node.js, and cloud technologies.',
  skills: [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'AWS', 
    'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL'
  ],
  education: [
    {
      degree: 'Bachelor of Science in Computer Science',
      institution: 'University of Technology',
      year: '2018',
      gpa: '3.8',
      details: 'Graduated Summa Cum Laude, Dean\'s List'
    }
  ],
  workExperience: [
    {
      jobTitle: 'Senior Software Engineer',
      company: 'Tech Innovations Inc.',
      startDate: '2021-03',
      endDate: 'Present',
      responsibilities: [
        'Led development of microservices architecture serving 1M+ users',
        'Mentored junior developers and conducted code reviews',
        'Implemented CI/CD pipelines reducing deployment time by 60%',
        'Collaborated with product team to deliver features ahead of schedule'
      ],
      achievements: [
        'Reduced application load time by 40%',
        'Improved test coverage from 60% to 95%'
      ]
    },
    {
      jobTitle: 'Full Stack Developer',
      company: 'Digital Solutions LLC',
      startDate: '2019-06',
      endDate: '2021-02',
      responsibilities: [
        'Developed responsive web applications using React and Node.js',
        'Integrated third-party APIs and payment processing systems',
        'Optimized database queries improving performance by 30%'
      ]
    }
  ],
  projects: [
    {
      name: 'E-commerce Platform',
      description: 'Built a scalable e-commerce platform with real-time inventory management',
      technologies: ['React', 'Node.js', 'MongoDB', 'Redis', 'AWS'],
      url: 'https://github.com/johndoe/ecommerce-platform',
      achievements: [
        'Handled 10,000+ concurrent users',
        'Achieved 99.9% uptime'
      ]
    },
    {
      name: 'Task Management App',
      description: 'Developed a collaborative task management application with real-time updates',
      technologies: ['Vue.js', 'Express.js', 'Socket.io', 'PostgreSQL'],
      achievements: [
        'Gained 5,000+ active users',
        'Featured in ProductHunt'
      ]
    }
  ],
  certifications: [
    'AWS Certified Solutions Architect',
    'Google Cloud Professional Developer',
    'Certified Kubernetes Administrator'
  ],
  languages: [
    { language: 'English', proficiency: 'Native' },
    { language: 'Spanish', proficiency: 'Intermediate' }
  ],
  awards: [
    'Employee of the Year 2022',
    'Best Innovation Award 2021'
  ]
};

const sampleJobDescription = `
We are seeking a Senior Frontend Developer to join our growing team. The ideal candidate will have:

- 5+ years of experience with React and modern JavaScript
- Strong knowledge of TypeScript
- Experience with state management (Redux, Context API)
- Understanding of responsive design and CSS frameworks
- Experience with testing frameworks (Jest, Cypress)
- Knowledge of build tools (Webpack, Vite)
- Familiarity with cloud platforms (AWS, GCP)
- Strong problem-solving skills and attention to detail

Responsibilities:
- Develop and maintain high-quality React applications
- Collaborate with design and backend teams
- Write clean, testable, and maintainable code
- Participate in code reviews and technical discussions
- Mentor junior developers
`;

class ResumeAPITester {
  constructor() {
    this.baseURL = API_BASE;
    this.userId = TEST_USER_ID;
    this.testResults = [];
    this.createdResumeId = null;
  }

  async makeRequest(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'x-user-id': this.userId,
    };

    const config = {
      headers: { ...defaultHeaders, ...options.headers },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      return {
        status: response.status,
        success: response.ok,
        data,
        headers: Object.fromEntries(response.headers),
      };
    } catch (error) {
      return {
        status: 0,
        success: false,
        error: error.message,
      };
    }
  }

  async test(name, testFunction) {
    console.log(`\\n🧪 Testing: ${name}`);
    console.log('─'.repeat(50));
    
    try {
      const result = await testFunction();
      this.testResults.push({ name, success: true, result });
      console.log('✅ PASSED');
      return result;
    } catch (error) {
      this.testResults.push({ name, success: false, error: error.message });
      console.log('❌ FAILED:', error.message);
      throw error;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Resume API Tests');
    console.log('='.repeat(60));

    try {
      // Test API Documentation
      await this.test('Get API Documentation', async () => {
        const response = await this.makeRequest('?docs=true');
        if (!response.success) {
          throw new Error(`Documentation request failed: ${response.status}`);
        }
        console.log('📚 API Documentation retrieved successfully');
        return response.data;
      });

      // Test Resume Analysis
      await this.test('Analyze Resume Data', async () => {
        const response = await this.makeRequest('/analyze', {
          method: 'POST',
          body: JSON.stringify({
            resumeData: sampleResumeData,
            userId: this.userId,
          }),
        });
        
        if (!response.success) {
          throw new Error(`Analysis failed: ${JSON.stringify(response.data)}`);
        }
        
        const analysis = response.data.analysis;
        console.log(`📊 Completeness: ${analysis.completeness}%`);
        console.log(`🎯 ATS Score: ${analysis.atsScore}%`);
        console.log(`💡 Suggestions: ${analysis.suggestions.length}`);
        console.log(`⚠️  Issues: ${analysis.issues.length}`);
        
        return response.data;
      });

      // Test Resume Generation
      await this.test('Generate Resume with AI', async () => {
        const response = await this.makeRequest('/generate', {
          method: 'POST',
          body: JSON.stringify({
            jobDescription: sampleJobDescription,
            targetRole: 'Senior Frontend Developer',
            experienceLevel: 'senior',
            industryType: 'Technology',
            preferences: {
              tone: 'professional',
              length: 'detailed',
              focus: 'skills',
            },
            userId: this.userId,
          }),
        });
        
        if (!response.success) {
          throw new Error(`Generation failed: ${JSON.stringify(response.data)}`);
        }
        
        const generated = response.data;
        console.log(`👤 Generated for: ${generated.resumeData.fullName}`);
        console.log(`🔧 Skills count: ${generated.resumeData.skills.length}`);
        console.log(`💼 Experience entries: ${generated.resumeData.workExperience.length}`);
        console.log(`🎯 ATS Optimizations: ${generated.atsOptimizations.length}`);
        
        return response.data;
      });

      // Test Resume Creation
      await this.test('Create New Resume', async () => {
        const response = await this.makeRequest('', {
          method: 'POST',
          body: JSON.stringify({
            action: 'create',
            data: sampleResumeData,
          }),
        });
        
        if (!response.success) {
          throw new Error(`Creation failed: ${JSON.stringify(response.data)}`);
        }
        
        this.createdResumeId = response.data.resume.id;
        console.log(`📝 Resume created with ID: ${this.createdResumeId}`);
        console.log(`📅 Created at: ${response.data.resume.createdAt}`);
        
        return response.data;
      });

      // Test Resume Retrieval
      await this.test('Retrieve Resume by ID', async () => {
        if (!this.createdResumeId) {
          throw new Error('No resume ID available for retrieval test');
        }
        
        const response = await this.makeRequest(`/${this.createdResumeId}`);
        
        if (!response.success) {
          throw new Error(`Retrieval failed: ${JSON.stringify(response.data)}`);
        }
        
        const resume = response.data.resume;
        console.log(`📄 Retrieved: ${resume.data.fullName}`);
        console.log(`📊 ATS Score: ${resume.metadata.atsScore}%`);
        console.log(`📈 Version: ${resume.version}`);
        
        return response.data;
      });

      // Test Resume Update
      await this.test('Update Resume', async () => {
        if (!this.createdResumeId) {
          throw new Error('No resume ID available for update test');
        }
        
        const updatedData = {
          ...sampleResumeData,
          summary: 'UPDATED: ' + sampleResumeData.summary,
          skills: [...sampleResumeData.skills, 'GraphQL', 'Next.js'],
        };
        
        const response = await this.makeRequest(`/${this.createdResumeId}`, {
          method: 'PUT',
          body: JSON.stringify({
            data: updatedData,
            changeNotes: 'Added new skills and updated summary',
            reanalyze: true,
          }),
        });
        
        if (!response.success) {
          throw new Error(`Update failed: ${JSON.stringify(response.data)}`);
        }
        
        const updated = response.data;
        console.log(`✏️  Fields modified: ${updated.changes.fieldsModified.join(', ')}`);
        console.log(`🔄 Version: ${updated.changes.previousVersion} → ${updated.changes.newVersion}`);
        
        return response.data;
      });

      // Test Resume List
      await this.test('List User Resumes', async () => {
        const response = await this.makeRequest('?page=1&limit=10&sortBy=updatedAt&sortOrder=desc');
        
        if (!response.success) {
          throw new Error(`Listing failed: ${JSON.stringify(response.data)}`);
        }
        
        const listing = response.data;
        console.log(`📋 Found ${listing.resumes.length} resumes`);
        console.log(`📄 Total: ${listing.pagination.total}`);
        console.log(`📑 Pages: ${listing.pagination.totalPages}`);
        
        return response.data;
      });

      // Test Resume Export
      await this.test('Export Resume (JSON)', async () => {
        if (!this.createdResumeId) {
          throw new Error('No resume ID available for export test');
        }
        
        const response = await this.makeRequest(`/${this.createdResumeId}/export`, {
          method: 'POST',
          body: JSON.stringify({
            format: 'json',
          }),
        });
        
        if (!response.success) {
          throw new Error(`Export failed: ${JSON.stringify(response.data)}`);
        }
        
        const exported = response.data;
        console.log(`📤 Export: ${exported.fileName}`);
        console.log(`📏 Size: ${Math.round(exported.fileSize / 1024)}KB`);
        console.log(`⏰ Expires: ${exported.expiresAt}`);
        
        return response.data;
      });

      // Test Resume Duplication
      await this.test('Duplicate Resume', async () => {
        if (!this.createdResumeId) {
          throw new Error('No resume ID available for duplication test');
        }
        
        const response = await this.makeRequest('', {
          method: 'POST',
          body: JSON.stringify({
            action: 'duplicate',
            sourceId: this.createdResumeId,
            modifications: {
              fullName: 'John Doe (Copy)',
              summary: 'Duplicated resume for testing purposes',
            },
          }),
        });
        
        if (!response.success) {
          throw new Error(`Duplication failed: ${JSON.stringify(response.data)}`);
        }
        
        const duplicated = response.data;
        console.log(`📋 Duplicated: ${duplicated.resume.data.fullName}`);
        console.log(`🆔 New ID: ${duplicated.resume.id}`);
        console.log(`🔗 Source: ${duplicated.sourceId}`);
        
        return response.data;
      });

      // Test Text-based Analysis
      await this.test('Analyze Resume Text', async () => {
        const resumeText = `
John Doe
Software Engineer
Email: john.doe@example.com
Phone: (555) 123-4567

SUMMARY
Experienced software engineer with expertise in JavaScript, React, and Node.js.

SKILLS
JavaScript, React, Node.js, Python, AWS, Docker

EXPERIENCE
Senior Software Engineer at Tech Corp (2021 - Present)
- Led development of web applications
- Mentored junior developers
- Implemented CI/CD pipelines

EDUCATION
BS Computer Science, University of Tech (2018)
        `;
        
        const response = await this.makeRequest('/analyze', {
          method: 'POST',
          body: JSON.stringify({
            resumeText,
            userId: this.userId,
          }),
        });
        
        if (!response.success) {
          throw new Error(`Text analysis failed: ${JSON.stringify(response.data)}`);
        }
        
        const analysis = response.data.analysis;
        console.log(`📝 Text analysis completed`);
        console.log(`📊 Completeness: ${analysis.completeness}%`);
        console.log(`🔍 Enhanced data generated: ${!!response.data.enhancedData}`);
        
        return response.data;
      });

      // Print Test Summary
      this.printTestSummary();

    } catch (error) {
      console.error('\\n💥 Test suite failed:', error.message);
      this.printTestSummary();
    }
  }

  printTestSummary() {
    console.log('\\n📋 TEST SUMMARY');
    console.log('='.repeat(60));
    
    const passed = this.testResults.filter(t => t.success).length;
    const failed = this.testResults.filter(t => t.success === false).length;
    const total = this.testResults.length;
    
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${failed}/${total}`);
    console.log(`📊 Success Rate: ${Math.round((passed / total) * 100)}%`);
    
    if (failed > 0) {
      console.log('\\n❌ Failed Tests:');
      this.testResults
        .filter(t => !t.success)
        .forEach(t => console.log(`   • ${t.name}: ${t.error}`));
    }
    
    console.log('\\n🎯 API Endpoints Tested:');
    console.log('   • GET /api/resumes (docs & listing)');
    console.log('   • POST /api/resumes (create & duplicate)');
    console.log('   • POST /api/resumes/analyze');
    console.log('   • POST /api/resumes/generate');
    console.log('   • GET /api/resumes/{id}');
    console.log('   • PUT /api/resumes/{id}');
    console.log('   • POST /api/resumes/{id}/export');
  }
}

// Auto-run tests if this script is executed directly
if (typeof window === 'undefined' && require.main === module) {
  const tester = new ResumeAPITester();
  tester.runAllTests().catch(console.error);
}

// Export for use in other modules
if (typeof module !== 'undefined') {
  module.exports = ResumeAPITester;
}
