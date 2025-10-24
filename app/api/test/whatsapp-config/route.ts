/**
 * WhatsApp Configuration Test API
 * Tests WhatsApp API configuration and connectivity
 */

import { NextRequest, NextResponse } from 'next/server';
import { whatsappAPI } from '@/lib/services/whatsapp-api-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing WhatsApp API configuration...');

    // Test WhatsApp API configuration
    const configResult = await whatsappAPI.verifyConfiguration();

    if (configResult.valid) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp API configuration is valid',
        data: {
          configured: true,
          baseUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
          hasToken: !!process.env.WHATSAPP_API_TOKEN,
          environment: process.env.NODE_ENV || 'development'
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'WhatsApp API configuration is invalid',
        error: configResult.error,
        data: {
          configured: false,
          baseUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
          hasToken: !!process.env.WHATSAPP_API_TOKEN,
          environment: process.env.NODE_ENV || 'development'
        }
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ WhatsApp config test error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to test WhatsApp configuration',
      error: error.message,
      data: {
        configured: false,
        baseUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
        hasToken: !!process.env.WHATSAPP_API_TOKEN,
        environment: process.env.NODE_ENV || 'development'
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing WhatsApp API with sample message...');

    const body = await request.json();
    const { phoneNumber, message } = body;

    if (!phoneNumber) {
      return NextResponse.json({
        success: false,
        error: 'Phone number is required for testing'
      }, { status: 400 });
    }

    // Test sending a sample message
    const testMessage = message || 'This is a test message from NaukriMili OTP system.';
    const result = await whatsappAPI.sendNotification(phoneNumber, testMessage);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test message sent successfully',
        data: {
          phoneNumber,
          messageId: result.messageId,
          details: result.details
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send test message',
        error: result.error,
        details: result.details
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('❌ WhatsApp test message error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to send test message',
      error: error.message
    }, { status: 500 });
  }
}
