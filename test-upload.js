const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testResumeUpload() {
  try {
    // Find a PDF file in the tmp/uploads directory
    const uploadsDir = path.join(__dirname, 'tmp', 'uploads');
    const files = fs.readdirSync(uploadsDir);
    const pdfFile = files.find(file => file.endsWith('.pdf'));
    
    if (!pdfFile) {
      console.log('No PDF files found in tmp/uploads directory');
      return;
    }
    
    const filePath = path.join(uploadsDir, pdfFile);
    console.log('Testing with file:', pdfFile);
    
    const formData = new FormData();
    formData.append('resume', fs.createReadStream(filePath));
    
    const response = await fetch('http://localhost:3001/api/resumes/upload', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Upload successful!');
      console.log('Resume ID:', data.resume.id);
      console.log('AI Data structure:', Object.keys(data.resume.aiData || {}));
    } else {
      console.log('❌ Upload failed:', data.message);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testResumeUpload();
