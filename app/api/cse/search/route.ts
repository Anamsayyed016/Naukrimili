import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'indeed';
    
    const cseId = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;
    const apiKey = process.env.GOOGLE_CSE_API_KEY;
    
    if (!cseId || !apiKey) {
      return NextResponse.json({ error: 'CSE configuration missing' }, { status: 500 });
    }
    
    // Use the same working parameters from debug endpoint
    const directUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}`;
    const response = await fetch(directUrl);
    const data = await response.json();
    
    const searchResults = data.items?.map((item: any) => ({
      title: item.title || "No Title",
      link: item.link || "#",
      snippet: item.snippet || "No description available",
      displayLink: item.displayLink || "Unknown",
      formattedUrl: item.formattedUrl || item.link || "#"
    })) || [];
    
    return NextResponse.json({
      success: true,
      results: searchResults,
      searchInformation: data.searchInformation
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}
