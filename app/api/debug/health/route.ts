import { NextRequest, NextResponse } from 'next/server';
import { checkJobProvidersHealth } from '@/lib/jobs/providers';

export async function GET(_request: NextRequest) {
  try {
    const health = await checkJobProvidersHealth();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      providers: health,
      summary: {
        totalProviders: 4,
        healthyProviders: Object.values(health).filter(Boolean).length,
        configuredProviders: Object.keys(health.details).filter(key => 
          health.details[key].status !== 'not_configured'
        ).length
      }
    });
  } catch (_error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}