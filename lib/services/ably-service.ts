/**
 * Ably Pub/Sub Service for Real-time AI Suggestions
 * Minimal integration - does not disturb existing code
 */

import * as Ably from 'ably';

let ablyClient: Ably.Realtime | null = null;
let ablyChannel: Ably.RealtimeChannel | null = null;

/**
 * Initialize Ably client (client-side only)
 */
export function initAblyClient(): Ably.Realtime | null {
  if (typeof window === 'undefined') return null;
  
  const apiKey = process.env.NEXT_PUBLIC_ABLY_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ Ably API key not found, real-time suggestions disabled');
    return null;
  }

  try {
    if (!ablyClient) {
      ablyClient = new Ably.Realtime({ key: apiKey });
      console.log('✅ Ably client initialized');
    }
    return ablyClient;
  } catch (error) {
    console.error('❌ Failed to initialize Ably:', error);
    return null;
  }
}

/**
 * Get or create Ably channel
 */
export function getAblyChannel(channelName: string = 'resume-suggestions'): Ably.RealtimeChannel | null {
  if (typeof window === 'undefined') return null;
  
  const client = initAblyClient();
  if (!client) return null;

  if (!ablyChannel || ablyChannel.name !== channelName) {
    ablyChannel = client.channels.get(channelName);
  }
  
  return ablyChannel;
}

/**
 * Publish query to Ably channel
 */
export function publishQuery(data: {
  field: string;
  searchValue: string;
  formData: Record<string, any>;
  requestId: string;
}): void {
  try {
    const channel = getAblyChannel();
    if (!channel) return;

    channel.publish('query', data);
    console.log('📤 Published query to Ably:', data.requestId);
  } catch (error) {
    console.error('❌ Failed to publish to Ably:', error);
  }
}

/**
 * Subscribe to Ably results
 */
export function subscribeToResults(
  callback: (data: any) => void,
  requestId: string
): (() => void) | null {
  try {
    const channel = getAblyChannel();
    if (!channel) return null;

    const handler = (message: Ably.Message) => {
      if (message.data?.requestId === requestId) {
        callback(message.data);
      }
    };

    channel.subscribe('result', handler);
    console.log('👂 Subscribed to Ably results:', requestId);

    // Return unsubscribe function
    return () => {
      channel.unsubscribe('result', handler);
    };
  } catch (error) {
    console.error('❌ Failed to subscribe to Ably:', error);
    return null;
  }
}

