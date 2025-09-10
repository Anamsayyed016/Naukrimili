// Test script for Dynamic Resume AI
const { DynamicResumeAI } = require('./lib/dynamic-resume-ai.ts');

async function testDynamicResumeAI() {
  console.log('🧪 Testing Dynamic Resume AI...');
  
  const resumeAI = new DynamicResumeAI();
  
  // Test resume text
  const testResumeText = `
John Doe
Software Engineer
Email: john.doe@example.com
Phone: +1-555-123-4567
Location: San Francisco, CA

SUMMARY:
Experienced software engineer with 5+ years of experience in full-stack development.
Expertise in JavaScript, React, Node.js, Python, and cloud technologies.

EXPERIENCE:
Senior Software Engineer | Tech Corp | 2021 - Present
- Led development of scalable web applications
- Improved system performance by 40%
- Mentored junior developers

Software Engineer | StartupXYZ | 2019 - 2021
- Built RESTful APIs using Node.js
- Implemented CI/CD pipelines
- Collaborated with cross-functional teams

EDUCATION:
Bachelor of Science in Computer Science
University of California | 2015 - 2019
GPA: 3.8/4.0

SKILLS:
JavaScript, React, Node.js, Python, AWS, Docker, Git, SQL, MongoDB

CERTIFICATIONS:
AWS Certified Developer
Google Cloud Professional Developer
  `;

  try {
    console.log('📄 Processing test resume...');
    const result = await resumeAI.parseResumeText(testResumeText);
    
    console.log('✅ Dynamic Resume AI Test Results:');
    console.log('📊 ATS Score:', result.atsScore);
    console.log('👤 Full Name:', result.personalInformation.fullName);
    console.log('📧 Email:', result.personalInformation.email);
    console.log('📱 Phone:', result.personalInformation.phone);
    console.log('📍 Location:', result.personalInformation.location);
    console.log('💼 Job Title:', result.professionalInformation.jobTitle);
    console.log('🛠️ Skills Count:', result.skills.length);
    console.log('🎓 Education Count:', result.education.length);
    console.log('💼 Experience Count:', result.experience.length);
    console.log('🏆 Certifications Count:', result.certifications.length);
    console.log('💡 Improvement Tips:', result.improvementTips.length);
    console.log('🎯 Recommended Jobs:', result.recommendedJobTitles.length);
    
    console.log('\n🎯 Recommended Job Titles:');
    result.recommendedJobTitles.forEach((title, index) => {
      console.log(`  ${index + 1}. ${title}`);
    });
    
    console.log('\n💡 Improvement Tips:');
    result.improvementTips.forEach((tip, index) => {
      console.log(`  ${index + 1}. ${tip}`);
    });
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testDynamicResumeAI();
