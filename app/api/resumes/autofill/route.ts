import { NextRequest, NextResponse } from 'next/server';
import { RealResumeService } from '@/lib/real-resume-service';
import { standardizeCandidateProfile } from '@/lib/resume/standardize';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type' }, { status: 400 });
    }

    console.log(`🔄 Processing resume: ${file.name} (${file.type})`);

    const uploadsDir = path.join(process.cwd(), 'uploads', 'resumes');
    await mkdir(uploadsDir, { recursive: true }).catch(() => {});
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${safeName}`;
    const filepath = path.join(uploadsDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    console.log(`📁 File saved to: ${filepath}`);

    const resumeService = new RealResumeService();
    let fileType = 'application/pdf';
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') fileType = file.type;
    if (file.type === 'application/msword') fileType = file.type;

    console.log(`🔍 Extracting text from file type: ${fileType}`);
    const text = await resumeService.extractTextFromFile(filepath, fileType);
    console.log(`📝 Extracted text length: ${text.length} characters`);

    if (!text || text.length < 10) {
      console.warn(`⚠️ Extracted text is too short: ${text}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Could not extract meaningful text from resume',
        fallback: true
      }, { status: 400 });
    }

    console.log(`🧠 Analyzing resume with AI...`);
    const extracted = await resumeService.analyzeResume(text);
    console.log(`✅ AI analysis complete: ${extracted.fullName || 'No name'}, ${extracted.skills.length} skills found`);
    
    const profile = standardizeCandidateProfile(extracted);

    // Enhanced AI Analysis
    const analysis = await performEnhancedAnalysis(profile, text);

    console.log(`🎯 Profile standardized: ${profile.fullName}, ${profile.skills.length} skills`);

    return NextResponse.json({ 
      success: true, 
      profile,
      analysis,
      extractedText: text.substring(0, 200) + '...' // First 200 chars for debugging
    });
  } catch (e: any) {
    console.error('❌ Autofill error:', e?.message || e);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process resume',
      details: e?.message || 'Unknown error',
      fallback: true
    }, { status: 500 });
  }
}

async function performEnhancedAnalysis(profile: any, rawText: string) {
  // Calculate ATS Score
  let atsScore = 0;
  const atsCriteria = {
    hasName: !!profile.fullName,
    hasEmail: !!profile.email,
    hasPhone: !!profile.phone,
    hasLocation: !!profile.location,
    hasSkills: profile.skills.length > 0,
    hasExperience: profile.experience.length > 0,
    hasEducation: profile.education.length > 0,
    hasJobTitle: !!profile.jobTitle,
    textLength: rawText.length > 200,
    hasKeywords: extractKeywords(rawText).length > 5
  };

  Object.values(atsCriteria).forEach(criteria => {
    if (criteria) atsScore += 10;
  });

  // Skills Analysis
  const skillsAnalysis = analyzeSkills(profile.skills, rawText);
  
  // Content Quality Analysis
  const contentQuality = analyzeContentQuality(rawText);
  
  // Professional Summary
  const professionalSummary = generateProfessionalSummary(profile, atsScore);

  return {
    atsScore: Math.min(atsScore, 100),
    atsCriteria,
    skillsAnalysis,
    contentQuality,
    professionalSummary,
    recommendations: generateRecommendations(atsScore, profile, skillsAnalysis)
  };
}

function extractKeywords(text: string): string[] {
  const commonKeywords = [
    'experience', 'skills', 'education', 'project', 'management', 'development',
    'analysis', 'design', 'implementation', 'coordination', 'leadership',
    'communication', 'teamwork', 'problem solving', 'innovation', 'strategy'
  ];
  
  return commonKeywords.filter(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
}

function analyzeSkills(skills: string[], text: string): any {
  const technicalSkills = skills.filter(skill => 
    /javascript|react|node|python|java|sql|aws|docker|git|html|css|typescript/i.test(skill)
  );
  
  const softSkills = skills.filter(skill => 
    /leadership|communication|teamwork|problem solving|management|collaboration/i.test(skill)
  );

  return {
    technical: technicalSkills,
    soft: softSkills,
    total: skills.length,
    technicalPercentage: Math.round((technicalSkills.length / skills.length) * 100) || 0,
    softPercentage: Math.round((softSkills.length / skills.length) * 100) || 0
  };
}

function analyzeContentQuality(text: string): any {
  const wordCount = text.split(/\s+/).length;
  const sentenceCount = text.split(/[.!?]+/).length;
  const paragraphCount = text.split(/\n\s*\n/).length;
  
  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgWordsPerParagraph = wordCount / paragraphCount;
  
  return {
    wordCount,
    sentenceCount,
    paragraphCount,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgWordsPerParagraph: Math.round(avgWordsPerParagraph * 10) / 10,
    readability: calculateReadability(text)
  };
}

function calculateReadability(text: string): string {
  const sentences = text.split(/[.!?]+/).length;
  const words = text.split(/\s+/).length;
  const syllables = countSyllables(text);
  
  const fleschScore = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
  
  if (fleschScore >= 90) return 'Very Easy';
  if (fleschScore >= 80) return 'Easy';
  if (fleschScore >= 70) return 'Fairly Easy';
  if (fleschScore >= 60) return 'Standard';
  if (fleschScore >= 50) return 'Fairly Difficult';
  if (fleschScore >= 30) return 'Difficult';
  return 'Very Difficult';
}

function countSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  let count = 0;
  
  words.forEach(word => {
    if (word.length <= 3) {
      count += 1;
    } else {
      count += word.replace(/[^aeiouy]/g, '').length;
    }
  });
  
  return count;
}

function generateProfessionalSummary(profile: any, atsScore: number): string {
  const strengths = [];
  if (profile.skills.length > 0) strengths.push(`${profile.skills.length} skills identified`);
  if (profile.experience.length > 0) strengths.push(`${profile.experience.length} experience entries`);
  if (profile.education.length > 0) strengths.push(`${profile.education.length} education entries`);
  
  const summary = `Professional resume with ${strengths.join(', ')}. `;
  
  if (atsScore >= 80) {
    return summary + 'Excellent ATS compatibility score.';
  } else if (atsScore >= 60) {
    return summary + 'Good ATS compatibility with room for improvement.';
  } else {
    return summary + 'Needs improvement for better ATS compatibility.';
  }
}

function generateRecommendations(atsScore: number, profile: any, skillsAnalysis: any): string[] {
  const recommendations = [];
  
  if (!profile.fullName) recommendations.push('Add your full name prominently at the top');
  if (!profile.email) recommendations.push('Include your email address');
  if (!profile.phone) recommendations.push('Add your phone number');
  if (!profile.location) recommendations.push('Specify your location');
  if (profile.skills.length < 5) recommendations.push('Include more relevant skills');
  if (profile.experience.length < 2) recommendations.push('Add more work experience details');
  if (profile.education.length < 1) recommendations.push('Include your educational background');
  
  if (atsScore < 70) {
    recommendations.push('Use standard section headings (Experience, Education, Skills)');
    recommendations.push('Avoid complex formatting and graphics');
    recommendations.push('Use bullet points for better readability');
  }
  
  if (skillsAnalysis.technicalPercentage < 30) {
    recommendations.push('Highlight more technical skills relevant to your field');
  }
  
  if (skillsAnalysis.softPercentage < 20) {
    recommendations.push('Include soft skills like leadership and communication');
  }
  
  return recommendations.slice(0, 5); // Limit to top 5 recommendations
}

export const dynamic = 'force-dynamic';





