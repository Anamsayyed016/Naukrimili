/**
 * Semantic ATS Match API
 * Phase 1.5: Calculate semantic match between resume and job
 * 
 * POST /api/resume-builder/semantic-match
 * 
 * Body:
 * {
 *   "resumeContent": {
 *     "summary": "...",
 *     "skills": ["..."],
 *     "experience": ["..."],
 *     "education": ["..."]
 *   },
 *   "jobDescription": "...",
 *   "requiredSkills": ["..."]
 * }
 * 
 * Returns:
 * {
 *   "matchScore": 85,
 *   "matchedSkills": [...],
 *   "matchedKeywords": [...],
 *   "missingSkills": [...],
 *   "missingKeywords": [...],
 *   "recommendations": [...]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { SemanticATSMatcher } from '@/lib/services/semantic-ats-matcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const semanticMatcher = new SemanticATSMatcher();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      resumeContent = {},
      jobDescription = '',
      requiredSkills = [],
      preferredSkills = []
    } = body;

    if (!jobDescription || jobDescription.trim().length === 0) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    // Build resume text from content
    const resumeText = [
      resumeContent.summary || '',
      Array.isArray(resumeContent.skills) ? resumeContent.skills.join(', ') : '',
      Array.isArray(resumeContent.experience) ? resumeContent.experience.join(' ') : '',
      Array.isArray(resumeContent.education) ? resumeContent.education.join(' ') : ''
    ].filter(Boolean).join(' ');

    if (resumeText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Resume content is required' },
        { status: 400 }
      );
    }

    console.log('🎯 Semantic Match API called:', {
      resumeLength: resumeText.length,
      jobDescriptionLength: jobDescription.length,
      requiredSkillsCount: requiredSkills.length
    });

    // Calculate semantic match
    const matchResult = await semanticMatcher.calculateMatch({
      resumeText,
      jobDescription,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      preferredSkills: Array.isArray(preferredSkills) ? preferredSkills : []
    });

    console.log('✅ Semantic match calculated:', {
      matchScore: matchResult.matchScore,
      matchedSkillsCount: matchResult.matchedSkills.length,
      missingSkillsCount: matchResult.missingSkills.length
    });

    return NextResponse.json(matchResult, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('❌ Semantic Match API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to calculate semantic match',
        matchScore: 0,
        matchedSkills: [],
        matchedKeywords: [],
        missingSkills: [],
        missingKeywords: [],
        recommendations: ['Unable to calculate semantic match. Please try again.']
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

