import { NextRequest, NextResponse } from 'next/server';
import { logRegionalOAuthAttempt, detectRegionalOAuthIssues, getRegionalOAuthRecommendations } from '@/lib/regional-oauth-debug';

export async function GET(request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const xForwardedFor = request.headers.get('x-forwarded-for') || 'unknown';
    const cfCountry = request.headers.get('cf-ipcountry') || 'unknown';
    const cfRegion = request.headers.get('cf-region') || 'unknown';
    const cfCity = request.headers.get('cf-city') || 'unknown';
    
    // Get real IP (first in X-Forwarded-For chain)
    const realIP = xForwardedFor.split(',')[0].trim();
    
    console.log('🌍 Regional OAuth Debug Request:', {
      userAgent: userAgent.substring(0, 100),
      ip: realIP,
      country: cfCountry,
      region: cfRegion,
      city: cfCity,
      timestamp: new Date().toISOString()
    });
    
    // Detect regional issues
    const issues = detectRegionalOAuthIssues(userAgent, realIP, cfCountry, cfRegion);
    const recommendations = getRegionalOAuthRecommendations(userAgent, cfCountry);
    
    // Log the attempt
    const debug = logRegionalOAuthAttempt(
      userAgent,
      realIP,
      cfCountry,
      cfRegion,
      false, // This is just a test
      undefined
    );
    
    return NextResponse.json({
      success: true,
      debug: {
        timestamp: debug.timestamp,
        ip: debug.ip,
        country: debug.country,
        region: debug.region,
        city: cfCity,
        isMobile: debug.isMobile,
        browser: debug.browser,
        oauthFlow: debug.oauthFlow,
        timezone: debug.timezone
      },
      issues: issues.map(issue => ({
        type: issue.type,
        severity: issue.severity,
        description: issue.description,
        solution: issue.solution
      })),
      recommendations,
      headers: {
        userAgent: userAgent.substring(0, 100),
        xForwardedFor,
        cfCountry,
        cfRegion,
        cfCity
      }
    });
    
  } catch (_error) {
    console.error('❌ Regional OAuth Debug Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze regional OAuth issues',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAgent, ip, country, region, success, error } = body;
    
    console.log('🌍 Regional OAuth Test Result:', {
      userAgent: userAgent?.substring(0, 100),
      ip,
      country,
      region,
      success,
      error,
      timestamp: new Date().toISOString()
    });
    
    // Log the test result
    const debug = logRegionalOAuthAttempt(
      userAgent || 'unknown',
      ip || 'unknown',
      country,
      region,
      success,
      error
    );
    
    return NextResponse.json({
      success: true,
      message: 'Regional OAuth test logged successfully',
      debug: {
        timestamp: debug.timestamp,
        country: debug.country,
        region: debug.region,
        isMobile: debug.isMobile,
        browser: debug.browser,
        oauthFlow: debug.oauthFlow,
        success: debug.success,
        recommendations: debug.recommendations
      }
    });
    
  } catch (_error) {
    console.error('❌ Regional OAuth Test Logging Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to log regional OAuth test',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
