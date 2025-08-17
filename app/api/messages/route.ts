import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth-config';
import { z } from 'zod';

const createMessageSchema = z.object({
  receiverId: z.string().min(1),
  content: z.string().min(1).max(1000),
  conversationId: z.string().optional(),
  messageType: z.enum(['text', 'system', 'notification']).default('text'),
});

const conversationQuerySchema = z.object({
  conversationId: z.string().optional(),
  userId: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
});

interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

async function requireAuth(request: NextRequest): Promise<{ user: AuthenticatedUser | null; response: NextResponse | null }> {
  const session = await getServerSession(authOptions as any);
  if (!session || typeof session !== 'object' || !session.user || typeof session.user !== 'object') {
    return { user: null, response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }
  
  const user = session.user as any;
  if (!user.email) {
    return { user: null, response: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }
  
  return { 
    user: {
      id: user.id || user.email,
      email: user.email,
      name: user.name,
      role: user.role
    }, 
    response: null 
  };
}

function generateConversationId(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `conv_${sorted[0]}_${sorted[1]}`;
}

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth(request);
  if (!user) return response!;

  try {
    const { searchParams } = new URL(request.url);
    const params = conversationQuerySchema.parse(Object.fromEntries(searchParams.entries()));

    if (params.conversationId) {
      // Get messages for specific conversation
      const messages = await prisma.message.findMany({
        where: { conversationId: params.conversationId },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { name: true, image: true, role: true } },
          receiver: { select: { name: true, image: true, role: true } }
        }
      });

      return NextResponse.json({
        success: true,
        messages: messages.map(msg => ({
          id: msg.id,
          conversationId: msg.conversationId,
          content: msg.content,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          senderName: msg.sender.name,
          receiverName: msg.receiver.name,
          messageType: msg.messageType,
          isRead: msg.isRead,
          createdAt: msg.createdAt
        })),
        conversationId: params.conversationId
      });
    }

    // Get user's conversations
    const conversations = await prisma.$queryRaw`
      SELECT DISTINCT 
        m.conversation_id as "conversationId",
        CASE 
          WHEN m.sender_id = ${user.id} THEN m.receiver_id
          ELSE m.sender_id
        END as "participantId",
        u.name as "participantName",
        u.role as "participantRole",
        last_msg.content as "lastMessage",
        last_msg.created_at as "lastMessageTime",
        COUNT(CASE WHEN m.receiver_id = ${user.id} AND m.is_read = false THEN 1 END) as "unreadCount"
      FROM messages m
      JOIN users u ON (
        CASE 
          WHEN m.sender_id = ${user.id} THEN m.receiver_id
          ELSE m.sender_id
        END = u.id
      )
      JOIN LATERAL (
        SELECT content, created_at
        FROM messages
        WHERE conversation_id = m.conversation_id
        ORDER BY created_at DESC
        LIMIT 1
      ) last_msg ON true
      WHERE m.sender_id = ${user.id} OR m.receiver_id = ${user.id}
      GROUP BY m.conversation_id, u.id, u.name, u.role, last_msg.content, last_msg.created_at
      ORDER BY last_msg.created_at DESC
    `;

    return NextResponse.json({
      success: true,
      conversations: conversations.map((conv: any) => ({
        id: conv.conversationId,
        participantId: conv.participantId,
        participantName: conv.participantName,
        participantRole: conv.participantRole,
        lastMessage: conv.lastMessage,
        lastMessageTime: conv.lastMessageTime,
        unreadCount: parseInt(conv.unreadCount)
      }))
    });

  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch messages'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth(request);
  if (!user) return response!;

  try {
    const body = await request.json();
    const data = createMessageSchema.parse(body);

    // Generate conversation ID if not provided
    const conversationId = data.conversationId || generateConversationId(user.id, data.receiverId);

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        content: data.content,
        senderId: user.id,
        receiverId: data.receiverId,
        messageType: data.messageType,
        isRead: false
      },
      include: {
        sender: { select: { name: true, image: true, role: true } },
        receiver: { select: { name: true, image: true, role: true } }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        id: message.id,
        conversationId: message.conversationId,
        content: message.content,
        senderId: message.senderId,
        receiverId: message.receiverId,
        senderName: message.sender.name,
        receiverName: message.receiver.name,
        messageType: message.messageType,
        isRead: message.isRead,
        createdAt: message.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid message data',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Messages POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send message'
    }, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}