import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const location = searchParams.get('location') || '';
    const num = searchParams.get('num') || '6';
    const sort = searchParams.get('sort') || 'relevance';
    const safe = searchParams.get('safe') || 'active';
    const lr = searchParams.get('lr') || 'lang_en';
    const cr = searchParams.get('cr') || 'countryus';
    const dateRestrict = searchParams.get('dateRestrict');
    const searchType = searchParams.get('searchType');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const cseId = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;
    const apiKey = process.env.GOOGLE_CSE_API_KEY;

    if (!cseId || !apiKey) {
      return NextResponse.json({ error: 'CSE configuration missing' }, { status: 500 });
    }

    const searchParams_g = new URLSearchParams({
      key: apiKey,
      cx: cseId,
      q: `${query} jobs ${location ? `in ${location}` : ''}`,
      num,
      sort,
      safe,
      lr,
      cr,
      ...(dateRestrict && { dateRestrict }),
      ...(searchType && { searchType })
    });

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${searchParams_g}`
    );

    if (!response.ok) {
      throw new Error(`Google CSE API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Clean up the data to prevent React rendering issues
    const searchResults = data.items?.map((item: any) => ({
      title: item.title || "No Title",
      link: item.link || "#",
      snippet: item.snippet || "No description available",
      displayLink: item.displayLink || "Unknown",
      formattedUrl: item.formattedUrl || item.link || "#",
      pagemap: item.pagemap ? {
        cse_thumbnail: Array.isArray(item.pagemap.cse_thumbnail) ? item.pagemap.cse_thumbnail : [],
        metatags: Array.isArray(item.pagemap.metatags) ? item.pagemap.metatags : []
      } : {
        cse_thumbnail: [],
        metatags: []
      }
    })) || [];

    return NextResponse.json({
      success: true,
      results: searchResults,
      searchInformation: data.searchInformation
    });

  } catch (error) {
    console.error('CSE Search API Error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
