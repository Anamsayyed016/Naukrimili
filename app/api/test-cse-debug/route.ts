import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'software engineer indeed';
    
    const cseId = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;
    const apiKey = process.env.GOOGLE_CSE_API_KEY;
    
    // Test 1: Direct query (no modifications)
    const directUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}`;
    
    const response = await fetch(directUrl);
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      query: query,
      directUrl: directUrl,
      totalResults: data.searchInformation?.totalResults || '0',
      itemsCount: data.items?.length || 0,
      firstItem: data.items?.[0] || null
    });
    
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
