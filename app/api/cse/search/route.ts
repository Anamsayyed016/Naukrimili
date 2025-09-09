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

    console.log('CSE API Request:', { query, location, num, sort, safe, lr, cr, dateRestrict, searchType });

    if (!query) {
      console.log('No query provided');
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const cseId = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;
    const apiKey = process.env.GOOGLE_CSE_API_KEY;

    console.log('CSE Config:', { cseId: !!cseId, apiKey: !!apiKey });

    if (!cseId || !apiKey) {
      console.log('CSE configuration missing');
      return NextResponse.json({ error: 'CSE configuration missing' }, { status: 500 });
    }

    // Build search query - make it more specific for job searches
    const searchQuery = `${query} jobs ${location ? `in ${location}` : ''}`;
    console.log('Final search query:', searchQuery);

    const searchParams_g = new URLSearchParams({
      key: apiKey,
      cx: cseId,
      q: searchQuery,
      num,
      sort,
      safe,
      lr,
      cr,
      ...(dateRestrict && { dateRestrict }),
      ...(searchType && { searchType })
    });

    const googleApiUrl = `https://www.googleapis.com/customsearch/v1?${searchParams_g}`;
    console.log('Google API URL:', googleApiUrl);

    const response = await fetch(googleApiUrl);

    console.log('Google API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google CSE API Error:', response.status, errorText);
      throw new Error(`Google CSE API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Google API Response:', {
      searchInformation: data.searchInformation,
      itemsCount: data.items?.length || 0,
      hasItems: !!data.items
    });
    
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

    console.log('Processed results count:', searchResults.length);

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
