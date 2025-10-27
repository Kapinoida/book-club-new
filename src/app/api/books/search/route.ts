import { NextRequest, NextResponse } from "next/server";

// Simple in-memory cache to reduce API calls
const searchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = searchCache.get(query);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // Build Google Books API URL
    // Use API key if available (optional, increases rate limits)
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const baseUrl = 'https://www.googleapis.com/books/v1/volumes';
    const params = new URLSearchParams({
      q: query,
      maxResults: '10',
      printType: 'books',
      ...(apiKey && { key: apiKey })
    });

    // Call Google Books API
    const response = await fetch(`${baseUrl}?${params}`, {
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    // Handle rate limiting
    if (response.status === 429) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again in a moment.",
          retryAfter: response.headers.get('Retry-After') || '60'
        },
        { status: 429 }
      );
    }

    if (!response.ok) {
      console.error(`Google Books API error: ${response.status} ${response.statusText}`);
      throw new Error(`Google Books API request failed: ${response.status}`);
    }

    const data = await response.json();

    // Transform the data to a simpler format
    const books = data.items?.map((item: any) => ({
      id: item.id,
      title: item.volumeInfo?.title || 'Unknown Title',
      authors: item.volumeInfo?.authors || [],
      description: item.volumeInfo?.description || '',
      coverImage: item.volumeInfo?.imageLinks?.thumbnail?.replace('http:', 'https:') ||
                  item.volumeInfo?.imageLinks?.smallThumbnail?.replace('http:', 'https:') || '',
      publishedDate: item.volumeInfo?.publishedDate || '',
      pageCount: item.volumeInfo?.pageCount || 0,
      categories: item.volumeInfo?.categories || [],
    })) || [];

    const result = { books };

    // Cache the successful response
    searchCache.set(query, {
      data: result,
      timestamp: Date.now()
    });

    // Clean up old cache entries (keep cache size reasonable)
    if (searchCache.size > 100) {
      const oldestKey = searchCache.keys().next().value;
      if (oldestKey) {
        searchCache.delete(oldestKey);
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error searching Google Books:", error);

    // Handle timeout errors specifically
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return NextResponse.json(
        { error: "Request timed out. Please try again." },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Failed to search books. Please try again later." },
      { status: 500 }
    );
  }
}
