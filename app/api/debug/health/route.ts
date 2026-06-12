import { NextRequest, NextResponse } from 'next/server';
import { checkJobProvidersHealth } from '@/lib/jobs/providers';
import { getResumeParserHealth } from '@/lib/resume-parser/parser-health';

export async function GET(_request: NextRequest) {
  try {
    const health = await checkJobProvidersHealth();
    const resumeParsers = getResumeParserHealth();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      providers: health,
      resumeParsers,
      summary: {
        totalProviders: 4,
        healthyProviders: Object.values(health).filter(Boolean).length,
        configuredProviders: Object.keys(health.details).filter(key => 
          health.details[key].status !== 'not_configured'
        ).length,
        resumeParsersEnabled: resumeParsers.filter((p) => p.enabled).length,
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}