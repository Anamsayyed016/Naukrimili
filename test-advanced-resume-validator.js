/**
 * Test Advanced Resume Validator
 * 
 * This test file validates the advanced resume parser integration
 * without disrupting the existing codebase.
 */

const { AdvancedResumeValidator } = require('./lib/advanced-resume-validator.ts');

// Test data samples
const sampleParserData = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-123-4567',
  skills: ['JavaScript', 'React', 'Node.js'],
  education: [
    {
      degree: 'Bachelor of Science',
      institution: 'University of Technology',
      year: '2020'
    }
  ],
  experience: [
    {
      job_title: 'Software Engineer',
      company: 'Tech Corp',
      start_date: '2021',
      end_date: '2023',
      description: 'Developed web applications'
    }
  ]
};

const sampleGeminiData = {
  name: 'John Doe',
  email: 'john.doe@example.com', // Slightly different email
  phone: '+1-555-123-4567', // Different phone format
  skills: ['JavaScript', 'Node.js', 'Python'], // Different skills
  education: [
    {
      degree: 'B.S. Computer Science',
      institution: 'University of Technology',
      year: '2020'
    }
  ],
  experience: [
    {
      job_title: 'Senior Software Engineer',
      company: 'Tech Corp',
      start_date: '2021',
      end_date: 'present',
      description: 'Led development of web applications'
    }
  ]
};

const sampleOriginalText = `
John Doe
Software Engineer
Email: john.doe@example.com
Phone: +1 (555) 123-4567
Location: San Francisco, CA

EDUCATION
Bachelor of Science in Computer Science
University of Technology, 2020
GPA: 3.8

EXPERIENCE
Senior Software Engineer
Tech Corp, 2021 - Present
• Led development of web applications using React and Node.js
• Implemented CI/CD pipelines
• Mentored junior developers

Software Developer Intern
StartupXYZ, 2020 - 2021
• Developed mobile applications using React Native
• Collaborated with design team

SKILLS
JavaScript, React, Node.js, Python, AWS, Docker, Git, Agile

PROJECTS
E-commerce Platform
• Built full-stack e-commerce solution
• Technologies: React, Node.js, MongoDB

Task Management App
• Created collaborative task management tool
• Technologies: Vue.js, Express, PostgreSQL

CERTIFICATIONS
AWS Certified Developer
Google Cloud Professional Developer
`;

async function runTests() {
  console.log('🧪 Starting Advanced Resume Validator Tests...\n');

  const validator = new AdvancedResumeValidator();

  // Test 1: Basic validation with all three sources
  console.log('Test 1: Full validation with all sources');
  try {
    const result1 = await validator.validateAndMerge({
      parserData: sampleParserData,
      geminiData: sampleGeminiData,
      originalText: sampleOriginalText
    });

    console.log('✅ Result:', {
      name: result1.name,
      email: result1.email,
      phone: result1.phone,
      skillsCount: result1.skills.length,
      educationCount: result1.education.length,
      experienceCount: result1.experience.length,
      projectsCount: result1.projects.length,
      certificationsCount: result1.certifications.length
    });

    const validation1 = validator.validateParsedData(result1);
    console.log('📊 Validation:', {
      isValid: validation1.isValid,
      confidence: validation1.confidence + '%',
      errors: validation1.errors,
      warnings: validation1.warnings
    });
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Only parser data + original text
  console.log('Test 2: Parser data + original text only');
  try {
    const result2 = await validator.validateAndMerge({
      parserData: sampleParserData,
      originalText: sampleOriginalText
    });

    console.log('✅ Result:', {
      name: result2.name,
      email: result2.email,
      phone: result2.phone,
      skillsCount: result2.skills.length
    });

    const validation2 = validator.validateParsedData(result2);
    console.log('📊 Validation:', {
      isValid: validation2.isValid,
      confidence: validation2.confidence + '%'
    });
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Only original text (fallback scenario)
  console.log('Test 3: Original text only (fallback)');
  try {
    const result3 = await validator.validateAndMerge({
      originalText: sampleOriginalText
    });

    console.log('✅ Result:', {
      name: result3.name,
      email: result3.email,
      phone: result3.phone,
      skillsCount: result3.skills.length,
      educationCount: result3.education.length,
      experienceCount: result3.experience.length
    });

    const validation3 = validator.validateParsedData(result3);
    console.log('📊 Validation:', {
      isValid: validation3.isValid,
      confidence: validation3.confidence + '%'
    });
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Invalid data correction
  console.log('Test 4: Invalid data correction');
  try {
    const invalidData = {
      parserData: {
        name: 'Invalid Name',
        email: 'invalid-email',
        phone: 'invalid-phone',
        skills: ['JavaScript', 'JavaScript', 'React', 'React'] // Duplicates
      },
      geminiData: {
        name: 'Valid Name',
        email: 'valid@example.com',
        phone: '+1-555-123-4567',
        skills: ['JavaScript', 'Python']
      },
      originalText: `
Valid Name
Email: valid.name@example.com
Phone: (555) 123-4567
Skills: JavaScript, Python, React, Node.js
`
    };

    const result4 = await validator.validateAndMerge(invalidData);
    console.log('✅ Result:', {
      name: result4.name,
      email: result4.email,
      phone: result4.phone,
      skillsCount: result4.skills.length,
      skillsUnique: [...new Set(result4.skills)].length
    });

    const validation4 = validator.validateParsedData(result4);
    console.log('📊 Validation:', {
      isValid: validation4.isValid,
      confidence: validation4.confidence + '%',
      errors: validation4.errors,
      warnings: validation4.warnings
    });
  } catch (error) {
    console.error('❌ Test 4 failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 5: Edge cases
  console.log('Test 5: Edge cases');
  try {
    const edgeCaseData = {
      originalText: `
Minimal Resume
john@test.com
555-1234
Python, Java
`
    };

    const result5 = await validator.validateAndMerge(edgeCaseData);
    console.log('✅ Result:', {
      name: result5.name,
      email: result5.email,
      phone: result5.phone,
      skillsCount: result5.skills.length
    });

    const validation5 = validator.validateParsedData(result5);
    console.log('📊 Validation:', {
      isValid: validation5.isValid,
      confidence: validation5.confidence + '%',
      errors: validation5.errors,
      warnings: validation5.warnings
    });
  } catch (error) {
    console.error('❌ Test 5 failed:', error.message);
  }

  console.log('\n🎉 All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
