/**
 * ATS-Friendly Auto-Suggestions API for Resume Builder
 * Generates comprehensive, role-specific, ATS-optimized suggestions
 * 
 * POST /api/resume-builder/ats-suggestions
 * 
 * Body:
 * {
 *   "job_title": "",
 *   "industry": "",
 *   "experience_level": "",
 *   "summary_input": "",
 *   "skills_input": "",
 *   "experience_input": "",
 *   "education_input": ""
 * }
 * 
 * Returns:
 * {
 *   "summary": "",
 *   "skills": [],
 *   "ats_keywords": [],
 *   "experience_bullets": [],
 *   "projects": []
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { ATSSuggestionEngine } from '@/lib/resume-builder/ats-suggestion-engine';

const engine = new ATSSuggestionEngine();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract and validate input
    const {
      job_title = '',
      industry = '',
      experience_level = '',
      summary_input = '',
      skills_input = '',
      experience_input = '',
      education_input = ''
    } = body;

    console.log('🎯 ATS Suggestions API called:', {
      job_title: job_title.substring(0, 50),
      industry: industry.substring(0, 50),
      experience_level,
      has_summary: !!summary_input,
      has_skills: !!skills_input,
      has_experience: !!experience_input,
      has_education: !!education_input
    });

    // Generate suggestions
    const suggestions = await engine.generateSuggestions({
      job_title,
      industry,
      experience_level,
      summary_input,
      skills_input,
      experience_input,
      education_input
    });

    console.log('✅ ATS Suggestions generated:', {
      summary_length: suggestions.summary.length,
      skills_count: suggestions.skills.length,
      keywords_count: suggestions.ats_keywords.length,
      bullets_count: suggestions.experience_bullets.length,
      projects_count: suggestions.projects.length
    });

    // Return strict JSON only (no markdown, no explanations)
    return NextResponse.json(suggestions, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('❌ ATS Suggestions API error:', error);
    
    // Return empty suggestions on error (don't break the UI)
    return NextResponse.json({
      summary: '',
      skills: [],
      ats_keywords: [],
      experience_bullets: [],
      projects: []
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

