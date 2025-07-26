import { headers } from 'next/headers';
import { db } from '@/lib/db';

import { headers } from 'next/headers';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const report = await db.fraudReport.findUnique({
      where: { id },
      include: {
        reportedBy: true,
        reportedJob: true
      }
    });

    if (!report) {
      return Response.json(
        { error: 'Fraud report not found' },
        { status: 404 }
      );
    }

    return Response.json({ report });
  } catch (error) {
    console.error('Error fetching fraud report:', error);
    return Response.json(
      { error: 'Failed to fetch fraud report' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const existingReport = await db.fraudReport.findUnique({
      where: { id }
    });

    if (!existingReport) {
      return Response.json(
        { error: 'Fraud report not found' },
        { status: 404 }
      );
    }

    const updatedReport = await db.fraudReport.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date()
      }
    });

    return Response.json({ report: updatedReport });
  } catch (error) {
    console.error('Error updating fraud report:', error);
    return Response.json(
      { error: 'Failed to update fraud report' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const existingReport = await db.fraudReport.findUnique({
      where: { id }
    });

    if (!existingReport) {
      return Response.json(
        { error: 'Fraud report not found' },
        { status: 404 }
      );
    }

    await db.fraudReport.delete({
      where: { id }
    });
    
    return Response.json({ message: 'Fraud report deleted successfully' });
  } catch (error) {
    console.error('Error deleting fraud report:', error);
    return Response.json(
      { error: 'Failed to delete fraud report' },
      { status: 500 }
    );
  }
}
