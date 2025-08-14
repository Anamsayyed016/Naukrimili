import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// In-memory stores
const messages: any[] = [];
// conversationId -> array of messages
const conversations: Record<string, any[]> = {};

// Message creation schema
const createMessageSchema = z.object({
  receiverId: z.string().min(1),
  content: z.string().min(1).max(1000),
  conversationId: z.string().optional(),
  messageType: z.enum(['text', 'system', 'notification']).default('text'),
});

// Conversation query schema
const conversationQuerySchema = z.object({
  conversationId: z.string().optional(),
  userId: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
});

function getUserFromRequest(request: NextRequest): string | null {
  return request.headers.get('x-user-id') || 'guest';
}

function generateConversationId(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `conv_${sorted[0]}_${sorted[1]}`;
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserFromRequest(request);
    if (!userId) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const params = conversationQuerySchema.parse(Object.fromEntries(searchParams.entries()));

    if (params.conversationId) {
      const all = conversations[params.conversationId] || [];
      const offset = (params.page - 1) * params.limit;
      const data = all.slice(offset, offset + params.limit).map(m => ({
        id: m.id,
        conversationId: m.conversationId,
        content: m.content,
        senderId: m.senderId,
        receiverId: m.receiverId,
        messageType: m.messageType,
        isRead: m.isRead,
        createdAt: m.createdAt,
      }));
      return NextResponse.json({ success: true, messages: data, conversationId: params.conversationId, timestamp: new Date().toISOString() });
    }

    // Build conversations list for the user from in-memory store
    const convIds = Object.keys(conversations).filter(cid => cid.includes(userId));
    const transformedConversations = convIds.map(cid => {
      const msgs = conversations[cid] || [];
      const last = msgs[msgs.length - 1];
      const participantId = cid.replace(`conv_`, '').split('_').find(p => p !== userId) || 'unknown';
      return {
        id: cid,
        participantId,
        participantName: participantId,
        participantRole: 'user',
        lastMessage: last?.content || '',
        lastMessageTime: last?.createdAt || new Date().toISOString(),
        unreadCount: msgs.filter(m => m.receiverId === userId && !m.isRead).length,
        isOnline: Math.random() > 0.5,
      };
    });

    return NextResponse.json({ success: true, conversations: transformedConversations, timestamp: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const senderId = getUserFromRequest(request) || 'guest';
    const body = await request.json();
    const data = createMessageSchema.parse(body);

    const conversationId = data.conversationId || generateConversationId(senderId, data.receiverId);

    const message = {
      id: `msg_${Date.now()}`,
      conversationId,
      content: data.content,
      senderId,
      receiverId: data.receiverId,
      messageType: data.messageType,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    messages.push(message);
    if (!conversations[conversationId]) conversations[conversationId] = [];
    conversations[conversationId].push(message);

    return NextResponse.json({ success: true, message: 'Message sent successfully', data: message, timestamp: new Date().toISOString() }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ success: false, error: 'Invalid message data', details: error.errors }, { status: 400 });
    return NextResponse.json({ success: false, error: 'Failed to send message', message: error.message }, { status: 500 });
  }
}