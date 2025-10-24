import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      errorId,
      message,
      stack,
      componentStack,
      isMobile,
      userAgent,
      timestamp,
      url,
      screenSize,
      viewport,
      devicePixelRatio,
      touchSupport,
      protocol,
      hostname
    } = body;

    // Log error to console for immediate debugging
    console.error('🚨 Mobile Error Reported:', {
      errorId,
      message,
      isMobile,
      userAgent,
      timestamp,
      url
    });

    // Store error in database (if you have an errors table)
    try {
      await prisma.mobileError.create({
        data: {
          errorId,
          message: message || 'Unknown error',
          stack: stack || '',
          componentStack: componentStack || '',
          isMobile: isMobile || false,
          userAgent: userAgent || '',
          timestamp: timestamp || new Date().toISOString(),
          url: url || '',
          screenSize: screenSize || '',
          viewport: viewport || '',
          devicePixelRatio: devicePixelRatio || 1,
          touchSupport: touchSupport || false,
          protocol: protocol || '',
          hostname: hostname || ''
        }
      });
    } catch (dbError) {
      console.warn('Failed to store error in database:', dbError);
      // Continue execution even if database storage fails
    }

    // Send to external monitoring service (optional)
    try {
      // Example: Send to Sentry, LogRocket, or other monitoring service
      // await sendToMonitoringService(body);
    } catch (monitoringError) {
      console.warn('Failed to send to monitoring service:', monitoringError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Error reported successfully',
      errorId 
    });

  } catch (error: any) {
    console.error('Failed to process mobile error report:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to process error report',
      error: error.message 
    }, { status: 500 });
  }
}
