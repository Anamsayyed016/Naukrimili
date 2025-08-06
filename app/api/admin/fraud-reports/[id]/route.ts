import { NextRequest, NextResponse } from 'next/server';
import { prisma as _db } from '@/lib/database';

// Mock fraud report data structure
interface FraudReport {
  id: string;
  type: 'job' | 'user' | 'application';
  reason: string;
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  reportedBy: string;
  reportedItem: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock fraud reports storage
const mockFraudReports: FraudReport[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const report = mockFraudReports.find(r => r.id === id);

    if (!report) {
      return NextResponse.json(
        { error: 'Fraud report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (_error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const reportIndex = mockFraudReports.findIndex(r => r.id === id);

    if (reportIndex === -1) {
      return NextResponse.json(
        { error: 'Fraud report not found' },
        { status: 404 }
      );
    }

    mockFraudReports[reportIndex] = {
      ...mockFraudReports[reportIndex],
      ...body,
      updatedAt: new Date()
    };

    return NextResponse.json(mockFraudReports[reportIndex]);
  } catch (_error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const reportIndex = mockFraudReports.findIndex(r => r.id === id);

    if (reportIndex === -1) {
      return NextResponse.json(
        { error: 'Fraud report not found' },
        { status: 404 }
      );
    }

    mockFraudReports.splice(reportIndex, 1);

    return NextResponse.json({ message: 'Fraud report deleted successfully' });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
