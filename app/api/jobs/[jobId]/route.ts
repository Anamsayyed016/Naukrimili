import { NextRequest, NextResponse } from 'next/server';
import { getAdzunaService } from '../../../../lib/adzuna-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const adref = searchParams.get('adref');

    if (!params.jobId || !adref) {
      return NextResponse.json(
        { error: 'jobId and adref are required' },
        { status: 400 }
      );
    }

    const adzunaService = getAdzunaService();
    const result = await adzunaService.getJobDetails(params.jobId, adref);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching job details:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching job details.' },
      { status: 500 }
    );
  }
}
