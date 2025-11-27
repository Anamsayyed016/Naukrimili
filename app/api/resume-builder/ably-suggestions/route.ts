/**
 * Ably Pub/Sub Handler for Real-time AI Suggestions
 * Listens to "query" events and publishes "result" events
 */

import { NextRequest, NextResponse } from 'next/server';
import Ably from 'ably';
import { ATSSuggestionEngine } from '@/lib/resume-builder/ats-suggestion-engine';

const engine = new ATSSuggestionEngine();
let ablyClient: Ably.Realtime | null = null;
let ablyChannel: Ably.RealtimeChannel | null = null;

// Initialize Ably client (server-side)
function initAbly() {
  if (ablyClient) return ablyClient;

  const apiKey = process.env.ABLY_API_KEY || process.env.NEXT_PUBLIC_ABLY_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ Ably API key not found');
    return null;
  }

  try {
    ablyClient = new Ably.Realtime({ key: apiKey });
    ablyChannel = ablyClient.channels.get('resume-suggestions');
    
    // Subscribe to query events
    ablyChannel.subscribe('query', async (message: Ably.Message) => {
      try {
        const { field, searchValue, formData, requestId } = message.data as any;
        
        console.log('📥 Received Ably query:', { field, requestId });

        // Generate suggestions using existing engine
        const suggestions = await engine.generateSuggestions({
          job_title: formData.jobTitle || '',
          industry: formData.industry || '',
          experience_level: formData.experienceLevel || 'experienced',
          summary_input: formData.summary_input || '',
          skills_input: formData.skills_input || '',
          experience_input: formData.experience_input || '',
          education_input: formData.education_input || '',
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
      } catch (error) {
        console.error('❌ Error processing Ably query:', error);
        // Publish error result
        if (ablyChannel) {
          ablyChannel.publish('result', {
            requestId: (message.data as any).requestId,
            error: 'Failed to generate suggestions',
          });
        }
      }
    });

    console.log('✅ Ably handler initialized');
    return ablyClient;
  } catch (error) {
    console.error('❌ Failed to initialize Ably:', error);
    return null;
  }
}

// Initialize on module load
if (typeof window === 'undefined') {
  initAbly();
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ok', 
    ablyConnected: !!ablyClient,
    message: 'Ably suggestions handler is running' 
  });
}

export async function POST(request: NextRequest) {
  // This endpoint can be used for webhook-based Ably integration if needed
  return NextResponse.json({ status: 'ok' });
}

