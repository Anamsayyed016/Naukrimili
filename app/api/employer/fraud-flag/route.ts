import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'employer') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { applicantId, signals, timestamp } = body;

    if (!applicantId) {
      return NextResponse.json(
        { error: 'Applicant ID is required' },
        { status: 400 }
      );
    }

    // Create fraud report
    const report = await prisma.fraudReport.create({
      data: {
        applicantId,
        reporterId: session.user.id,
        signals: signals || [],
        timestamp: timestamp || new Date().toISOString(),
        status: 'pending',
        severity: 'medium',
      }
    });

    // Update applicant risk score
    await prisma.user.update({
      where: { id: applicantId },
      data: {
        riskScore: {
          increment: 1
        }
      }
    });

    // Notify admins
    await prisma.notification.create({
      data: {
        type: 'FRAUD_REPORT',
        title: 'New Fraud Report',
        message: `A new fraud report has been submitted for applicant ${applicantId}`,
        recipientRole: 'admin',
        priority: 'high'
      }
    });

    return NextResponse.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Error in fraud-flag API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
