const fs = require('fs');
const path = require('path');
const axios = require('axios');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Calls Gemini API to extract structured resume data from plain text.
 * @param {string} resumeText - The plain text extracted from the resume file.
 * @returns {Promise<Object>} - The structured JSON response from Gemini.
 */
async function extractResumeWithGemini(resumeText) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set');

  console.log('Calling Gemini API with text length:', resumeText.length);
  console.log('First 300 characters of resume text:', resumeText.substring(0, 300));

  const prompt = `Analyze this resume document and extract the following structured JSON data. Follow ALL rules:\n\n1. Return ONLY valid JSON format\n2. Convert all dates to ISO format (YYYY-MM-DD)\n3. Normalize phone numbers to E.164 format (+[country][number])\n4. Categorize skills as 'technical' or 'soft'\n5. Calculate total experience in years (rounded to 0.5)\n6. Ignore irrelevant personal details (age, gender, marital status)\n\nOutput schema:\n{\n  "personal_info": {\n    "name": "string",\n    "email": "string",\n    "phone": "string",\n    "location": {\n      "city": "string",\n      "state": "string",\n      "country": "string"\n    },\n    "linkedin": "string | null",\n    "github": "string | null"\n  },\n  "work_experience": [\n    {\n      "title": "string",\n      "company": "string",\n      "start_date": "string",\n      "end_date": "string | null",\n      "current": "boolean",\n      "description": "string"\n    }\n  ],\n  "education": [\n    {\n      "degree": "string",\n      "institution": "string",\n      "field_of_study": "string | null",\n      "graduation_year": "string"\n    }\n  ],\n  "technical_skills": "string[]",\n  "soft_skills": "string[]",\n  "certifications": "string[]",\n  "total_experience_years": "number",\n  "summary": "string",\n  "recommendations": "string[]"\n}\n\nResume content: ${resumeText}`;

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
  const headers = {
    'Content-Type': 'application/json',
    'X-goog-api-key': GEMINI_API_KEY,
  };
  const data = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
      topK: 40,
      topP: 0.95
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' }
    ]
  };

  try {
    console.log('Making request to Gemini API...');
    const response = await axios.post(url, data, { headers });
    console.log('Gemini API response status:', response.status);
    console.log('Gemini API response data:', JSON.stringify(response.data, null, 2));
    
    // Gemini returns JSON in a 'candidates[0].content.parts[0].text' field
    const resultText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
      console.error('No result text in Gemini response');
      throw new Error('No structured data returned from Gemini');
    }
    
    console.log('Parsed result text from Gemini:', resultText);
    const parsedData = JSON.parse(resultText);
    console.log('Parsed JSON data:', JSON.stringify(parsedData, null, 2));
    return parsedData;
  } catch (error) {
    console.error('Gemini API call failed:', error);
    if (error.response) {
      console.error('Gemini API error response:', error.response.data);
    }
    throw error;
  }
}

// Function to extract text from different file types
const extractTextFromFile = async (filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.pdf':
        return await extractTextFromPDF(filePath);
      case '.doc':
      case '.docx':
        return await extractTextFromWord(filePath);
      default:
        throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error;
  }
};

// Real PDF text extraction
const extractTextFromPDF = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    console.log('Extracting text from PDF:', filePath);
    const dataBuffer = fs.readFileSync(filePath);
    console.log('PDF file size:', dataBuffer.length);
    const data = await pdfParse(dataBuffer);
    console.log('Extracted text length:', data.text.length);
    console.log('First 200 characters:', data.text.substring(0, 200));
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

// Real Word document text extraction
const extractTextFromWord = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    console.log('Extracting text from Word document:', filePath);
    const result = await mammoth.extractRawText({ path: filePath });
    console.log('Extracted text length:', result.value.length);
    return result.value;
  } catch (error) {
    console.error('Word extraction error:', error);
    throw new Error(`Failed to extract text from Word document: ${error.message}`);
  }
};

module.exports = {
  extractTextFromFile,
  extractResumeWithGemini,
};
