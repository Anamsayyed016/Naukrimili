/**
 * Ably Pub/Sub Handler for Real-time AI Suggestions
 * Listens to "query" events and publishes "result" events
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Ably from 'ably';
import { ATSSuggestionEngine } from '@/lib/resume-builder/ats-suggestion-engine';

const engine = new ATSSuggestionEngine();
let ablyClient: Ably.Realtime | null = null;
let ablyChannel: Ably.RealtimeChannel | null = null;

// Initialize Ably client (server-side)
function initAbly() {
  if (ablyClient) {
    console.log('✅ Ably client already initialized');
    return ablyClient;
  }

  const apiKey = process.env.ABLY_API_KEY || process.env.NEXT_PUBLIC_ABLY_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ Ably API key not found. Set ABLY_API_KEY or NEXT_PUBLIC_ABLY_API_KEY');
    return null;
  }

  try {
    console.log('🔄 Initializing Ably client...');
    ablyClient = new Ably.Realtime({ key: apiKey });
    ablyChannel = ablyClient.channels.get('resume-suggestions');
    
    // Wait for connection
    ablyClient.connection.on('connected', () => {
      console.log('✅ Ably connected successfully');
    });

    ablyClient.connection.on('failed', () => {
      console.error('❌ Ably connection failed');
    });
    
    // Subscribe to query events
    ablyChannel.subscribe('query', async (message: Ably.Message) => {
      try {
        const { field, searchValue, formData, requestId } = message.data as any;
        
        console.log('📥 Received Ably query:', { field, requestId, hasFormData: !!formData });

        // Generate suggestions using existing engine
        const suggestions = await engine.generateSuggestions({
          job_title: formData?.jobTitle || formData?.title || '',
          industry: formData?.industry || '',
          experience_level: formData?.experienceLevel || 'experienced',
          summary_input: formData?.summary_input || '',
          skills_input: formData?.skills_input || '',
          experience_input: formData?.experience_input || '',
          education_input: formData?.education_input || '',
        });

        // Publish result back
        if (ablyChannel) {
          ablyChannel.publish('result', {
            requestId,
            data: suggestions,
            field,
          });
          console.log('📤 Published Ably result:', requestId);
        }
      } catch (error: any) {
        console.error('❌ Error processing Ably query:', error);
        // Publish error result
        if (ablyChannel) {
          ablyChannel.publish('result', {
            requestId: (message.data as any)?.requestId || 'unknown',
            error: error.message || 'Failed to generate suggestions',
          });
        }
      }
    });

    console.log('✅ Ably handler initialized and subscribed to "query" events');
    return ablyClient;
  } catch (error: any) {
    console.error('❌ Failed to initialize Ably:', error.message || error);
    return null;
  }
}

// Initialize Ably on first request (works better with serverless)
let initAttempted = false;

function ensureAblyInitialized() {
  if (!initAttempted) {
    initAttempted = true;
    initAbly();
  }
  return ablyClient;
}

export async function GET(request: NextRequest) {
  ensureAblyInitialized();
  return NextResponse.json({ 
    status: 'ok', 
    ablyConnected: !!ablyClient,
    ablyChannel: ablyChannel ? ablyChannel.name : null,
    message: 'Ably suggestions handler is running' 
  });
}

export async function POST(request: NextRequest) {
  // Ensure Ably is initialized
  ensureAblyInitialized();
  
  // This endpoint can be used for webhook-based Ably integration if needed
  // Or to manually trigger initialization
  return NextResponse.json({ 
    status: 'ok',
    ablyConnected: !!ablyClient,
    ablyChannel: ablyChannel ? ablyChannel.name : null
  });
}

