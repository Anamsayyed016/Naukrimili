import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Fetch job categories from the user's own FastAPI backend
    const res = await fetch('http://localhost:8000/categories');
    if (!res.ok) throw new Error('Failed to fetch categories from backend');
    const categories = await res.json();
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to fetch categories from backend.' }, { status: 500 });
  }
}
