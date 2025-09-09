import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'indeed';
    
    const cseId = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;
    const apiKey = process.env.GOOGLE_CSE_API_KEY;
    
    const results = {
      environment: {
        cseId: !!cseId,
        apiKey: !!apiKey,
        cseIdValue: cseId,
        apiKeyValue: apiKey ? `${apiKey.substring(0, 10)}...` : 'missing'
      },
      tests: []
    };
    
    // Test 1: Direct Google API call (no modifications)
    try {
      const directUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}`;
      const directResponse = await fetch(directUrl);
      const directData = await directResponse.json();
      
      results.tests.push({
        name: 'Direct Google API (no params)',
        url: directUrl,
        status: directResponse.status,
        totalResults: directData.searchInformation?.totalResults || '0',
        itemsCount: directData.items?.length || 0,
        success: directResponse.ok
      });
    } catch (error) {
      results.tests.push({
        name: 'Direct Google API (no params)',
        error: error.message,
        success: false
      });
    }
    
    return NextResponse.json({
      success: true,
      query: query,
      results: results
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}
