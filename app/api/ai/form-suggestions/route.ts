import { NextRequest, NextResponse } from 'next/server';

// Initialize OpenAI only if API key is available
let openai: any = null;
if (process.env.OPENAI_API_KEY) {
  try {
    const OpenAI = require('openai').default;
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    console.warn('OpenAI initialization failed:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { field, value, context = {} } = await request.json();

    if (!field || !value) {
      return NextResponse.json({
        success: false,
        error: 'Field and value are required'
      }, { status: 400 });
    }

    // Check if OpenAI is available
    if (!openai || !process.env.OPENAI_API_KEY) {
      // Return fallback suggestions if OpenAI is not available
      return NextResponse.json({
        success: true,
        suggestions: getFallbackSuggestions(field, value)
      });
    }

    // Generate AI-powered suggestions based on field type
    const suggestions = await generateAISuggestions(field, value, context);

    return NextResponse.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('AI form suggestions error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate suggestions'
    }, { status: 500 });
  }
}

async function generateAISuggestions(field: string, value: string, context: any) {
  const prompt = getPromptForField(field, value, context);
  
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: `You are an AI career assistant helping users complete their resume forms. Provide relevant, professional suggestions based on the field type and user input.`
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 300,
    temperature: 0.7,
  });

  const response = completion.choices[0]?.message?.content;
  
  if (!response) {
    throw new Error('No response from OpenAI');
  }

  try {
    return JSON.parse(response);
  } catch (parseError) {
    // Fallback if JSON parsing fails
    return getFallbackSuggestions(field, value);
  }
}

function getPromptForField(field: string, value: string, context: any): string {
  switch (field) {
    case 'skills':
      return `Generate 5-8 relevant technical and soft skills that complement "${value}". Consider:
      - Related technologies and frameworks
      - Industry-standard skills
      - Soft skills that pair well
      - Current market trends
      
      Return as JSON array: ["skill1", "skill2", ...]`;

    case 'jobTitle':
      return `Generate 5-7 professional job titles related to "${value}". Consider:
      - Different seniority levels (Junior, Senior, Lead, Principal)
      - Alternative titles used in the industry
      - Specialized roles
      - Modern job titles
      
      Return as JSON array: ["title1", "title2", ...]`;

    case 'location':
      return `Generate 5-6 major cities/regions in India that are tech hubs or have good job opportunities. Consider:
      - Major metropolitan areas
      - Emerging tech cities
      - IT hubs
      - Startup ecosystems
      
      Return as JSON array: ["city1", "city2", ...]`;

    case 'summary':
      return `Generate 3-4 professional summary suggestions for someone with skills: ${context.skills?.join(', ') || 'various'}. Each should be:
      - 2-3 sentences long
      - Professional and compelling
      - Highlight key strengths
      - ATS-friendly
      
      Return as JSON array: ["summary1", "summary2", ...]`;

    case 'expectedSalary':
      return `Generate 4-5 realistic salary ranges for "${context.jobTitle || 'software developer'}" in India. Consider:
      - Different experience levels
      - Different cities (Bangalore, Mumbai, Delhi, etc.)
      - Current market rates
      - Format as "X-Y LPA"
      
      Return as JSON array: ["5-8 LPA", "8-12 LPA", ...]`;

    default:
      return `Generate 5 relevant suggestions for the field "${field}" with value "${value}". Return as JSON array.`;
  }
}

function getFallbackSuggestions(field: string, value: string) {
  const fallbacks: { [key: string]: string[] } = {
    skills: [
      'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git', 'AWS', 'Docker',
      'Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Agile'
    ],
    jobTitle: [
      'Software Engineer', 'Senior Software Engineer', 'Full Stack Developer',
      'Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'Tech Lead'
    ],
    location: [
      'Bangalore, Karnataka', 'Mumbai, Maharashtra', 'Delhi, NCR',
      'Hyderabad, Telangana', 'Pune, Maharashtra', 'Chennai, Tamil Nadu'
    ],
    summary: [
      'Experienced professional with strong technical skills and proven track record.',
      'Results-driven individual with expertise in multiple technologies.',
      'Passionate about technology and continuous learning.',
      'Strong problem-solving abilities with excellent communication skills.'
    ],
    expectedSalary: [
      '5-8 LPA', '8-12 LPA', '12-18 LPA', '18-25 LPA', '25+ LPA'
    ]
  };

  return fallbacks[field] || [];
}
