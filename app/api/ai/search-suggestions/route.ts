import { NextRequest, NextResponse } from 'next/server';

// Initialize OpenAI only if API key is available
let openai: any = null;
if (process.env.OPENAI_API_KEY) {
  try {
    const { default: OpenAI } = await import('openai');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (_error) {
    console.warn('OpenAI initialization failed:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const location = searchParams.get('location');
    const context = searchParams.get('context') || 'job_search';

    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Query parameter is required'
      }, { status: 400 });
    }

    // Check if OpenAI is available
    if (!openai || !process.env.OPENAI_API_KEY) {
      // Return fallback suggestions if OpenAI is not available
      const fallbackSuggestions = [
        {
          query: `${query} jobs`,
          confidence: 0.8,
          reasoning: "Direct job search with your original terms"
        },
        {
          query: `${query} careers`,
          confidence: 0.7,
          reasoning: "Alternative terminology for broader results"
        },
        {
          query: `${query} positions`,
          confidence: 0.6,
          reasoning: "Using 'positions' instead of 'jobs' for variety"
        }
      ];

      return NextResponse.json({
        success: true,
        suggestions: fallbackSuggestions
      });
    }

    // Generate AI-powered search suggestions
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI job search assistant. Generate 3-4 alternative search queries that would help someone find better job opportunities. 
          
          Consider:
          - Different job titles and synonyms
          - Industry-specific terms
          - Skill-based searches
          - Experience level variations
          - Location-specific terms
          
          Return suggestions that are more specific, broader, or use different terminology than the original query.
          
          Format your response as a JSON array of objects with:
          - query: the suggested search term
          - confidence: a number between 0 and 1 indicating how relevant this suggestion is
          - reasoning: a brief explanation of why this suggestion might be helpful`
        },
        {
          role: "user",
          content: `Original search: "${query}"${location ? ` in ${location}` : ''}
          
          Context: ${context}
          
          Generate 3-4 alternative search suggestions that could help find better job opportunities.`
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let suggestions;
    try {
      suggestions = JSON.parse(response);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      suggestions = [
        {
          query: `${query} jobs`,
          confidence: 0.8,
          reasoning: "Direct job search with your original terms"
        },
        {
          query: `${query} careers`,
          confidence: 0.7,
          reasoning: "Alternative terminology for broader results"
        },
        {
          query: `${query} positions`,
          confidence: 0.6,
          reasoning: "Using 'positions' instead of 'jobs' for variety"
        }
      ];
    }

    return NextResponse.json({
      success: true,
      suggestions: Array.isArray(suggestions) ? suggestions : [suggestions]
    });

  } catch (_error) {
    console.error('AI Search Suggestions Error:', error);
    
    // Fallback suggestions if AI fails
    const { searchParams } = new URL(request.url);
    const fallbackQuery = searchParams.get('query') || 'jobs';
    const fallbackSuggestions = [
      {
        query: `${fallbackQuery} jobs`,
        confidence: 0.8,
        reasoning: "Direct job search with your original terms"
      },
      {
        query: `${fallbackQuery} careers`,
        confidence: 0.7,
        reasoning: "Alternative terminology for broader results"
      },
      {
        query: `${fallbackQuery} positions`,
        confidence: 0.6,
        reasoning: "Using 'positions' instead of 'jobs' for variety"
      }
    ];

    return NextResponse.json({
      success: true,
      suggestions: fallbackSuggestions
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, location, context = 'job_search' } = await request.json();

    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Query is required'
      }, { status: 400 });
    }

    // Check if OpenAI is available
    if (!openai || !process.env.OPENAI_API_KEY) {
      // Return fallback suggestions if OpenAI is not available
      const fallbackSuggestions = [
        {
          query: `${query} jobs`,
          confidence: 0.8,
          reasoning: "Direct job search with your original terms"
        },
        {
          query: `${query} careers`,
          confidence: 0.7,
          reasoning: "Alternative terminology for broader results"
        },
        {
          query: `${query} positions`,
          confidence: 0.6,
          reasoning: "Using 'positions' instead of 'jobs' for variety"
        }
      ];

      return NextResponse.json({
        success: true,
        suggestions: fallbackSuggestions
      });
    }

    // Generate AI-powered search suggestions
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI job search assistant. Generate 3-4 alternative search queries that would help someone find better job opportunities. 
          
          Consider:
          - Different job titles and synonyms
          - Industry-specific terms
          - Skill-based searches
          - Experience level variations
          - Location-specific terms
          
          Return suggestions that are more specific, broader, or use different terminology than the original query.
          
          Format your response as a JSON array of objects with:
          - query: the suggested search term
          - confidence: a number between 0 and 1 indicating how relevant this suggestion is
          - reasoning: a brief explanation of why this suggestion might be helpful`
        },
        {
          role: "user",
          content: `Original search: "${query}"${location ? ` in ${location}` : ''}
          
          Context: ${context}
          
          Generate 3-4 alternative search suggestions that could help find better job opportunities.`
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let suggestions;
    try {
      suggestions = JSON.parse(response);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      suggestions = [
        {
          query: `${query} jobs`,
          confidence: 0.8,
          reasoning: "Direct job search with your original terms"
        },
        {
          query: `${query} careers`,
          confidence: 0.7,
          reasoning: "Alternative terminology for broader results"
        },
        {
          query: `${query} positions`,
          confidence: 0.6,
          reasoning: "Using 'positions' instead of 'jobs' for variety"
        }
      ];
    }

    return NextResponse.json({
      success: true,
      suggestions: Array.isArray(suggestions) ? suggestions : [suggestions]
    });

  } catch (_error) {
    console.error('AI Search Suggestions Error:', error);
    
    // Fallback suggestions if AI fails
    const { query: fallbackQuery } = await request.json().catch(() => ({ query: 'jobs' }));
    const fallbackSuggestions = [
      {
        query: `${fallbackQuery} jobs`,
        confidence: 0.8,
        reasoning: "Direct job search with your original terms"
      },
      {
        query: `${fallbackQuery} careers`,
        confidence: 0.7,
        reasoning: "Alternative terminology for broader results"
      },
      {
        query: `${fallbackQuery} positions`,
        confidence: 0.6,
        reasoning: "Using 'positions' instead of 'jobs' for variety"
      }
    ];

    return NextResponse.json({
      success: true,
      suggestions: fallbackSuggestions
    });
  }
}
