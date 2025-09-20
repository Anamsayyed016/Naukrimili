import { HybridResumeAI } from './lib/hybrid-resume-ai.ts';

console.log('Testing AI Service...');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');

const ai = new HybridResumeAI();
const testText = `John Doe
Software Engineer
john@example.com
+91 9876543210
Mumbai, India

SKILLS: JavaScript, React, Node.js, Python
EXPERIENCE: 5 years in web development
EDUCATION: BTech Computer Science`;

ai.parseResumeText(testText)
  .then(result => {
    console.log('✅ AI Service working!');
    console.log('Result:', JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.log('❌ AI Service failed:', error.message);
  });
