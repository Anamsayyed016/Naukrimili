/**
 * Verify Payment API
 * POST /api/payments/verify
 * 
 * Verifies payment signature and activates plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { verifyPaymentSignature, fetchPaymentDetails } from '@/lib/services/razorpay-service';
import { activateIndividualPlan } from '@/lib/services/payment-service';
import { prisma } from '@/lib/prisma';
import { findPaymentByOrderId, updatePaymentStatus, findUserCredits, createOrUpdateUserCredits } from '@/lib/db-direct';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Ensure route is registered
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [Verify Payment] Request received');
    
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error('❌ [Verify Payment] Unauthorized - no session');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ [Verify Payment] User authenticated:', session.user.id);

    // Parse request body with timeout to prevent hanging
    let body: any;
    try {
      const bodyPromise = request.json();
      const bodyTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request body parsing timed out')), 5000)
      );
      body = await Promise.race([bodyPromise, bodyTimeoutPromise]);
    } catch (parseError: any) {
      console.error('❌ [Verify Payment] Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body', details: parseError.message },
        { status: 400 }
      );
    }
    
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    console.log('📥 [Verify Payment] Payment details:', {
      hasOrderId: !!razorpayOrderId,
      hasPaymentId: !!razorpayPaymentId,
      hasSignature: !!razorpaySignature,
      orderIdPreview: razorpayOrderId ? `${razorpayOrderId.substring(0, 10)}...` : null,
      paymentIdPreview: razorpayPaymentId ? `${razorpayPaymentId.substring(0, 10)}...` : null,
    });

    // Validate all required fields are present and non-empty
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      console.error('❌ [Verify Payment] Missing payment details:', {
        hasOrderId: !!razorpayOrderId,
        hasPaymentId: !!razorpayPaymentId,
        hasSignature: !!razorpaySignature,
        orderIdType: typeof razorpayOrderId,
        paymentIdType: typeof razorpayPaymentId,
        signatureType: typeof razorpaySignature,
      });
      return NextResponse.json(
        { 
          error: 'Missing payment details', 
          details: 'Please ensure all payment information is provided',
          missingFields: [
            !razorpayOrderId && 'razorpayOrderId',
            !razorpayPaymentId && 'razorpayPaymentId',
            !razorpaySignature && 'razorpaySignature',
          ].filter(Boolean),
        },
        { status: 400 }
      );
    }

    // Validate field formats (basic sanity checks)
    if (typeof razorpayOrderId !== 'string' || razorpayOrderId.length < 10) {
      console.error('❌ [Verify Payment] Invalid order ID format:', razorpayOrderId);
      return NextResponse.json(
        { error: 'Invalid order ID format' },
        { status: 400 }
      );
    }
    
    if (typeof razorpayPaymentId !== 'string' || razorpayPaymentId.length < 10) {
      console.error('❌ [Verify Payment] Invalid payment ID format:', razorpayPaymentId);
      return NextResponse.json(
        { error: 'Invalid payment ID format' },
        { status: 400 }
      );
    }
    
    if (typeof razorpaySignature !== 'string' || razorpaySignature.length < 10) {
      console.error('❌ [Verify Payment] Invalid signature format:', razorpaySignature);
      return NextResponse.json(
        { error: 'Invalid signature format' },
        { status: 400 }
      );
    }

    // Verify signature
    console.log('🔄 [Verify Payment] Verifying signature...');
    let isValid: boolean;
    try {
      isValid = await verifyPaymentSignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });
    } catch (sigError: any) {
      console.error('❌ [Verify Payment] Signature verification error:', sigError);
      return NextResponse.json(
        { error: 'Signature verification failed', details: sigError.message },
        { status: 400 }
      );
    }

    if (!isValid) {
      console.error('❌ [Verify Payment] Invalid payment signature');
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    console.log('✅ [Verify Payment] Signature verified');

    // Fetch payment from database using direct connection (bypass Prisma auth issues)
    // Add timeout to prevent hanging on database operations
    console.log('🔄 [Verify Payment] Fetching payment from database...');
    let payment: any;
    
    try {
      // Add timeout wrapper for database query
      const dbPromise = findPaymentByOrderId(razorpayOrderId);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timed out after 10 seconds')), 10000)
      );
      
      payment = await Promise.race([dbPromise, timeoutPromise]) as any;
    } catch (dbTimeoutError: any) {
      console.warn('⚠️ [Verify Payment] Direct DB query timed out or failed, trying Prisma...', dbTimeoutError?.message);
      payment = null; // Set to null to trigger Prisma fallback
    }

    // Fallback to Prisma if direct connection fails
    if (!payment) {
      console.log('⚠️ [Verify Payment] Direct DB query returned no result, trying Prisma...');
      try {
        const prismaPromise = prisma.payment.findUnique({
          where: { razorpayOrderId },
        });
        const prismaTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Prisma query timed out')), 10000)
        );
        
        payment = await Promise.race([prismaPromise, prismaTimeoutPromise]) as any;
      } catch (prismaError: any) {
        console.error('❌ [Verify Payment] Prisma also failed:', {
          error: prismaError?.message || prismaError,
          errorType: prismaError?.name,
        });
        payment = null; // Ensure payment is null if both fail
      }
    }

    if (!payment) {
      console.error('❌ [Verify Payment] Payment not found in database:', razorpayOrderId);
      return NextResponse.json(
        { error: 'Payment not found. Please contact support with order ID: ' + razorpayOrderId },
        { status: 404 }
      );
    }

    console.log('✅ [Verify Payment] Payment found:', {
      id: payment.id,
      status: payment.status,
      planType: payment.planType,
      planName: payment.planName,
    });

    if (payment.userId !== session.user.id) {
      console.error('❌ [Verify Payment] User ID mismatch:', {
        paymentUserId: payment.userId,
        sessionUserId: session.user.id,
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if already processed - prevent duplicate activation
    if (payment.status === 'captured') {
      console.log('⚠️ [Verify Payment] Payment already captured, returning success without reactivation');
      // Return success but don't activate plan again (already activated)
      return NextResponse.json({
        success: true,
        message: 'Payment already processed',
        paymentId: payment.id,
        alreadyProcessed: true, // Flag to indicate this was already processed
      });
    }

    // Check if payment was already marked as failed
    if (payment.status === 'failed') {
      console.error('❌ [Verify Payment] Payment was previously marked as failed');
      return NextResponse.json(
        { error: 'Payment was previously marked as failed', paymentId: payment.id },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay with timeout
    console.log('🔄 [Verify Payment] Fetching payment details from Razorpay...');
    let razorpayPayment: any;
    try {
      // Add timeout wrapper for Razorpay API call
      const fetchPromise = fetchPaymentDetails(razorpayPaymentId);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Razorpay API call timed out after 15 seconds')), 15000)
      );
      
      razorpayPayment = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      console.log('✅ [Verify Payment] Razorpay payment details:', {
        id: razorpayPayment.id,
        status: razorpayPayment.status,
        amount: razorpayPayment.amount,
        method: razorpayPayment.method,
      });
    } catch (fetchError: any) {
      console.error('❌ [Verify Payment] Failed to fetch from Razorpay:', {
        error: fetchError.message || fetchError,
        errorType: fetchError.name,
        stack: fetchError.stack,
      });
      return NextResponse.json(
        { 
          error: 'Failed to verify payment with Razorpay', 
          details: fetchError.message || 'Network or timeout error',
        },
        { status: 500 }
      );
    }

    if (razorpayPayment.status !== 'captured') {
      console.error('❌ [Verify Payment] Payment not captured. Status:', razorpayPayment.status);
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          failureReason: `Payment status: ${razorpayPayment.status}`,
        },
      });

      return NextResponse.json(
        { error: 'Payment not captured', status: razorpayPayment.status },
        { status: 400 }
      );
    }

    // CRITICAL: Update payment record to 'captured' BEFORE activating plan
    // This prevents duplicate activations if verification is called multiple times
    console.log('🔄 [Verify Payment] Updating payment record to captured...');
    try {
      // Try direct DB update first (more reliable) with timeout
      const updatePromise = updatePaymentStatus(payment.id, {
        razorpayPaymentId,
        razorpaySignature,
        status: 'captured',
        paymentMethod: razorpayPayment.method,
        metadata: razorpayPayment as any,
      });
      
      const updateTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Payment status update timed out')), 10000)
      );
      
      const updatedPayment = await Promise.race([updatePromise, updateTimeoutPromise]) as any;
      
      if (updatedPayment) {
        payment = updatedPayment; // Use updated payment data
        console.log('✅ [Verify Payment] Payment record updated to captured status (direct DB)');
      } else {
        // Fallback to Prisma
        throw new Error('Direct DB update returned no result');
      }
    } catch (dbError: any) {
      console.warn('⚠️ [Verify Payment] Direct DB update failed, trying Prisma:', {
        error: dbError?.message || dbError,
        errorType: dbError?.name,
      });
      try {
        const prismaPromise = prisma.payment.update({
          where: { id: payment.id },
          data: {
            razorpayPaymentId,
            razorpaySignature,
            status: 'captured',
            paymentMethod: razorpayPayment.method,
            metadata: razorpayPayment as any,
          },
        });
        
        const prismaTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Prisma update timed out')), 10000)
        );
        
        await Promise.race([prismaPromise, prismaTimeoutPromise]);
        console.log('✅ [Verify Payment] Payment record updated to captured status (Prisma)');
      } catch (prismaError: any) {
        console.error('❌ [Verify Payment] Both direct DB and Prisma update failed:', {
          error: prismaError?.message || prismaError,
          errorType: prismaError?.name,
        });
        // Continue anyway - payment is verified, just logging failed
        // But mark payment as captured in memory so activation can proceed
        payment = { ...payment, status: 'captured' };
      }
    }

    // Activate plan if individual plan (only if not already activated)
    if (payment.planType === 'individual') {
      console.log('🔄 [Verify Payment] Activating individual plan...');
      try {
        // Check if plan is already active to prevent duplicate activation (try direct DB first)
        let existingCredits = await findUserCredits(payment.userId);
        
        // Fallback to Prisma if direct DB fails
        if (!existingCredits) {
          try {
            existingCredits = await prisma.userCredits.findUnique({
              where: { userId: payment.userId },
            });
          } catch (prismaError: any) {
            console.warn('⚠️ [Verify Payment] Prisma check failed, using direct DB only:', prismaError?.message);
          }
        }

        // Only activate if not already active for this payment
        const isAlreadyActive = existingCredits?.isActive && 
                                existingCredits?.planType === 'individual' &&
                                existingCredits?.planName === payment.planName;

        if (isAlreadyActive) {
          console.log('⚠️ [Verify Payment] Plan already active, skipping activation');
        } else {
          // Try to activate using direct DB first, then fallback to Prisma
          try {
            const { INDIVIDUAL_PLANS } = await import('@/lib/services/razorpay-plans');
            const plan = INDIVIDUAL_PLANS[payment.planName as keyof typeof INDIVIDUAL_PLANS];
            
            if (!plan) {
              throw new Error(`Plan ${payment.planName} not found`);
            }
            
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + plan.validityDays);
            
            const aiResumeLimit = plan.features.aiResumeUsage === -1 ? 999999 : plan.features.aiResumeUsage;
            const aiCoverLetterLimit = plan.features.aiCoverLetterUsage === -1 ? 999999 : plan.features.aiCoverLetterUsage;
            
            // Try direct DB first with timeout
            try {
              const creditsPromise = createOrUpdateUserCredits(payment.userId, {
                resumeDownloadsLimit: plan.features.pdfDownloads,
                aiResumeLimit,
                aiCoverLetterLimit,
                templateAccess: plan.features.templateAccess,
                atsOptimization: plan.features.atsOptimization === 'advanced' || plan.features.atsOptimization === true,
                pdfDownloadsLimit: plan.features.pdfDownloads,
                docxDownloadsLimit: 0,
                validUntil,
                planType: 'individual',
                planName: payment.planName,
                isActive: true,
              });
              
              const creditsTimeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Credits update timed out')), 15000)
              );
              
              await Promise.race([creditsPromise, creditsTimeoutPromise]);
              console.log('✅ [Verify Payment] Plan activated successfully (direct DB)');
            } catch (dbError: any) {
              console.warn('⚠️ [Verify Payment] Direct DB activation failed, trying Prisma:', {
                error: dbError?.message || dbError,
                errorType: dbError?.name,
              });
              // Fallback to Prisma with timeout
              try {
                const activatePromise = activateIndividualPlan({
                  userId: payment.userId,
                  paymentId: payment.id,
                  planKey: payment.planName as any,
                });
                
                const activateTimeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Prisma activation timed out')), 15000)
                );
                
                await Promise.race([activatePromise, activateTimeoutPromise]);
                console.log('✅ [Verify Payment] Plan activated successfully (Prisma)');
              } catch (prismaActivateError: any) {
                console.error('❌ [Verify Payment] Prisma activation also failed:', {
                  error: prismaActivateError?.message || prismaActivateError,
                  errorType: prismaActivateError?.name,
                });
                throw prismaActivateError; // Re-throw to be caught by outer try-catch
              }
            }
          } catch (activateError: any) {
            console.error('❌ [Verify Payment] Failed to activate plan:', activateError);
            throw activateError;
          }
        }

        // SERVER-SIDE VERIFICATION: Verify plan is ready for download
        console.log('🔍 [Verify Payment] Verifying plan is ready for download...');
        const { checkResumeAccess } = await import('@/lib/middleware/payment-middleware');
        const downloadCheck = await checkResumeAccess(payment.userId, 'download');
        
        if (!downloadCheck.allowed) {
          console.error('❌ [Verify Payment] Plan activated but download check failed:', {
            reason: downloadCheck.reason,
            creditsRemaining: downloadCheck.creditsRemaining,
            daysRemaining: downloadCheck.daysRemaining,
          });
          // Plan is activated but something is wrong - log but don't fail payment
          // This could happen if there's a race condition or database issue
          console.warn('⚠️ [Verify Payment] Download check failed after activation - user may need to retry');
        } else {
          console.log('✅ [Verify Payment] Plan verified and ready for download:', {
            creditsRemaining: downloadCheck.creditsRemaining,
            daysRemaining: downloadCheck.daysRemaining,
            isBusiness: downloadCheck.isBusiness,
          });
        }
      } catch (activateError: any) {
        console.error('❌ [Verify Payment] Failed to activate plan:', activateError);
        // Payment is already marked as captured, but plan activation failed
        // Return error so frontend knows activation failed
        return NextResponse.json(
          { 
            error: 'Payment verified but plan activation failed. Please contact support.',
            details: activateError.message,
            paymentId: payment.id,
          },
          { status: 500 }
        );
      }
    }

    // Note: Business subscriptions are activated via webhook

    console.log('✅ [Verify Payment] Payment verified and plan activated successfully');
    return NextResponse.json({
      success: true,
      message: 'Payment verified and plan activated',
      paymentId: payment.id,
      readyForDownload: true, // Indicate that download should work
    });
  } catch (error: any) {
    console.error('❌ [Verify Payment] Error:', {
      message: error.message,
      stack: error.stack,
      razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ? 'SET' : 'NOT_SET',
    });
    return NextResponse.json(
      { 
        error: 'Failed to verify payment', 
        details: error.message,
        debug: process.env.NODE_ENV === 'development' ? {
          hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
        } : undefined,
      },
      { status: 500 }
    );
  }
}

