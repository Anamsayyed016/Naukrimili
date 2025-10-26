import { NextRequest, NextResponse } from 'next/server';

// Initialize OpenAI only if API key is available
let openai: any = null;
if (process.env.OPENAI_API_KEY) {
  try {
    const { default: OpenAI } = await import('openai');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (_error) {
    console.warn('OpenAI not available:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobTitle, company, description, skills, location, salary, experienceLevel, jobType } = body;

    if (!jobTitle || !description) {
      return NextResponse.json(
        { success: false, error: 'Job title and description are required' },
        { status: 400 }
      );
    }

    // Create a comprehensive prompt for job enhancement
    const prompt = `
You are a professional job portal AI assistant. Analyze the following job posting and provide enhanced, structured information that would be valuable for job seekers.

Job Details:
- Title: ${jobTitle}
- Company: ${company || 'Not specified'}
- Location: ${location || 'Not specified'}
- Salary: ${salary || 'Not disclosed'}
- Experience Level: ${experienceLevel || 'Not specified'}
- Job Type: ${jobType || 'Not specified'}
- Skills: ${skills ? skills.join(', ') : 'Not specified'}

Job Description:
${description}

Please provide a comprehensive analysis in the following JSON format:

{
  "keyResponsibilities": [
    "List 5-7 key responsibilities based on the job description",
    "Make them specific and actionable",
    "Focus on what the candidate will actually do day-to-day"
  ],
  "requirements": [
    "List 5-8 essential requirements",
    "Include technical skills, soft skills, and qualifications",
    "Be specific about experience levels and certifications"
  ],
  "benefits": [
    "List 5-7 potential benefits and perks",
    "Include both standard and unique benefits",
    "Consider the company size, industry, and location"
  ],
  "companyCulture": "A brief 2-3 sentence description of the likely company culture based on the job posting",
  "growthOpportunities": [
    "List 3-5 potential career growth opportunities",
    "Consider the role and industry progression paths"
  ],
  "interviewProcess": [
    "List 4-6 typical interview stages for this type of role",
    "Include technical and behavioral components"
  ],
  "salaryInsights": "A brief 2-3 sentence analysis of the salary range and market competitiveness",
  "marketTrends": "A brief 2-3 sentence overview of current market trends for this role and industry"
}

Guidelines:
- Be professional and accurate
- Base insights on the provided information
- Make content helpful for job seekers
- Keep responses concise but informative
- Ensure all arrays have the specified number of items
- Return only valid JSON, no additional text
`;

    // Check if OpenAI is available
    if (!openai) {
      throw new Error('OpenAI API not configured');
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a professional job portal AI assistant. Always return valid JSON format as requested. Be helpful, accurate, and professional in your analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const enhancedData = JSON.parse(response);
    
    return NextResponse.json({
      success: true,
      data: enhancedData
    });

  } catch (_error) {
    console.error('Error enhancing job data:', error);
    
    // Return fallback data if OpenAI fails
    const fallbackData = {
      keyResponsibilities: [
        "Execute daily tasks as outlined in the job description",
        "Collaborate with team members on projects",
        "Meet performance targets and deadlines",
        "Contribute to team goals and objectives",
        "Maintain professional standards and quality"
      ],
      requirements: [
        "Relevant experience in the field",
        "Strong communication skills",
        "Ability to work independently and in teams",
        "Problem-solving and analytical skills",
        "Adaptability and willingness to learn"
      ],
      benefits: [
        "Competitive salary package",
        "Health insurance coverage",
        "Professional development opportunities",
        "Flexible working arrangements",
        "Paid time off and holidays"
      ],
      companyCulture: "A professional and collaborative work environment that values innovation and teamwork.",
      growthOpportunities: [
        "Career advancement opportunities",
        "Skill development programs",
        "Leadership training",
        "Cross-functional project exposure"
      ],
      interviewProcess: [
        "Initial phone/video screening",
        "Technical assessment",
        "Behavioral interview",
        "Final interview with hiring manager"
      ],
      salaryInsights: "The salary range appears competitive for the role and experience level.",
      marketTrends: "This role is in demand with good growth prospects in the current market."
    };

    return NextResponse.json({
      success: true,
      data: fallbackData
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
