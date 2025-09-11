import { NextRequest, NextResponse } from 'next/server';
import { HybridFormSuggestions } from '@/lib/hybrid-form-suggestions';

const hybridFormSuggestions = new HybridFormSuggestions();

// Enhanced fallback suggestions
function getFallbackSuggestions(field: string, value: string): string[] {
  const fallbackSuggestions: { [key: string]: string[] } = {
    skills: [
      'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript',
      'AWS', 'Docker', 'Git', 'SQL', 'MongoDB', 'Express.js',
      'Next.js', 'Vue.js', 'Angular', 'Java', 'C++', 'PHP',
      'Laravel', 'Django', 'Flask', 'Spring Boot', 'PostgreSQL',
      'Redis', 'GraphQL', 'REST API', 'Microservices', 'Kubernetes'
    ],
    jobTitle: [
      'Software Engineer', 'Full Stack Developer', 'Frontend Developer',
      'Backend Developer', 'DevOps Engineer', 'Data Scientist',
      'Machine Learning Engineer', 'Product Manager', 'UI/UX Designer',
      'Mobile App Developer', 'Cloud Engineer', 'Security Engineer'
    ],
    location: [
      'Bangalore, India', 'Mumbai, India', 'Delhi, India',
      'Hyderabad, India', 'Pune, India', 'Chennai, India',
      'Kolkata, India', 'Ahmedabad, India', 'Gurgaon, India',
      'Noida, India', 'Remote', 'Hybrid'
    ],
    summary: [
      'Experienced software developer with strong technical skills and passion for creating innovative solutions.',
      'Results-driven professional with expertise in modern technologies and proven track record of delivering high-quality projects.',
      'Passionate developer with excellent problem-solving abilities and strong communication skills.',
      'Detail-oriented software engineer with experience in full-stack development and agile methodologies.',
      'Creative and analytical developer with strong foundation in computer science and continuous learning mindset.'
    ],
    expectedSalary: [
      '5-8 LPA', '8-12 LPA', '12-18 LPA', '18-25 LPA', 
      '25-35 LPA', '35-50 LPA', '50+ LPA', 'Negotiable'
    ],
    preferredJobType: [
      'Full-time', 'Part-time', 'Contract', 'Freelance', 
      'Internship', 'Remote', 'Hybrid', 'On-site'
    ],
    linkedin: [
      'https://linkedin.com/in/yourname',
      'https://linkedin.com/in/yourusername',
      'https://www.linkedin.com/in/yourprofile'
    ],
    portfolio: [
      'https://yourname.dev',
      'https://yourname.github.io',
      'https://yourname.vercel.app',
      'https://yourname.netlify.app'
    ]
  };

  return fallbackSuggestions[field] || ['Option 1', 'Option 2', 'Option 3'];
}

export async function POST(request: NextRequest) {
  let field = 'skills';
  let value = '';
  let context = {};

  try {
    const requestData = await request.json();
    field = requestData.field || 'skills';
    value = requestData.value || '';
    context = requestData.context || {};

    if (!field || !value) {
      return NextResponse.json({
        success: false,
        error: 'Field and value are required'
      }, { status: 400 });
    }

    console.log(`🔮 Generating suggestions for field: ${field}, value: ${value}`);

    // Generate suggestions using hybrid AI
    const result = await hybridFormSuggestions.generateSuggestions(field, value, context);

    console.log(`✅ Generated ${result.suggestions.length} suggestions using ${result.aiProvider}`);

    return NextResponse.json({
      success: true,
      suggestions: result.suggestions,
      confidence: result.confidence,
      aiProvider: result.aiProvider
    });

  } catch (error) {
    console.error('AI form suggestions error:', error);
    
    // Enhanced fallback when AI fails
    const fallbackSuggestions = getFallbackSuggestions(field, value);
    
    return NextResponse.json({
      success: true,
      suggestions: fallbackSuggestions,
      confidence: 30,
      aiProvider: 'fallback'
    });
  }
}