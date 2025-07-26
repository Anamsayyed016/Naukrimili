import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Candidate } from '@/models/Candidate';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    await connectDB();
    const candidate = await Candidate.findById(params.id);
    
    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Error fetching candidate:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    await connectDB();
    const data = await request.json();
    
    const candidate = await Candidate.findByIdAndUpdate(
      params.id,
      {
        ...data,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(candidate);
  } catch (error) {
    console.error('Error updating candidate:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  try {
    await connectDB();
    const candidate = await Candidate.findByIdAndDelete(params.id);
    
    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
