import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

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

// Get user from request
function getUserFromRequest(request: NextRequest): string | null {
  return request.headers.get('x-user-id') || null;
}

// Generate conversation ID
function generateConversationId(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `conv_${sorted[0]}_${sorted[1]}`;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const validatedParams = conversationQuerySchema.parse(
      Object.fromEntries(searchParams.entries())
    );

    if (validatedParams.conversationId) {
      // Get messages for a specific conversation
      const offset = (validatedParams.page - 1) * validatedParams.limit;
      
      const messages = await prisma.message.findMany({
        where: {
          conversationId: validatedParams.conversationId,
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            }
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        take: validatedParams.limit,
        skip: offset,
      });

      // Mark messages as read
      await prisma.message.updateMany({
        where: {
          conversationId: validatedParams.conversationId,
          receiverId: userId,
          isRead: false,
        },
        data: { isRead: true },
      });

      const transformedMessages = messages.map(msg => ({
        id: msg.id,
        conversationId: msg.conversationId,
        content: msg.content,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        senderName: msg.sender.name || 'Unknown',
        receiverName: msg.receiver.name || 'Unknown',
        messageType: msg.messageType,
        isRead: msg.isRead,
        createdAt: msg.createdAt.toISOString(),
      }));

      return NextResponse.json({
        success: true,
        messages: transformedMessages,
        conversationId: validatedParams.conversationId,
        timestamp: new Date().toISOString(),
      });

    } else {
      // Get user's conversations
      const conversations = await prisma.$queryRaw`
        SELECT DISTINCT 
          m."conversationId",
          CASE 
            WHEN m."senderId" = ${userId} THEN m."receiverId"
            ELSE m."senderId"
          END as "participantId",
          u.name as "participantName",
          u.role as "participantRole",
          (
            SELECT content 
            FROM "Message" m2 
            WHERE m2."conversationId" = m."conversationId" 
            ORDER BY m2."createdAt" DESC 
            LIMIT 1
          ) as "lastMessage",
          (
            SELECT "createdAt" 
            FROM "Message" m3 
            WHERE m3."conversationId" = m."conversationId" 
            ORDER BY m3."createdAt" DESC 
            LIMIT 1
          ) as "lastMessageTime",
          (
            SELECT COUNT(*) 
            FROM "Message" m4 
            WHERE m4."conversationId" = m."conversationId" 
            AND m4."receiverId" = ${userId} 
            AND m4."isRead" = false
          ) as "unreadCount"
        FROM "Message" m
        LEFT JOIN "User" u ON (
          CASE 
            WHEN m."senderId" = ${userId} THEN u.id = m."receiverId"
            ELSE u.id = m."senderId"
          END
        )
        WHERE m."senderId" = ${userId} OR m."receiverId" = ${userId}
        ORDER BY "lastMessageTime" DESC
      ` as any[];

      const transformedConversations = conversations.map(conv => ({
        id: conv.conversationId,
        participantId: conv.participantId,
        participantName: conv.participantName || 'Unknown User',
        participantRole: conv.participantRole || 'user',
        lastMessage: conv.lastMessage || '',
        lastMessageTime: conv.lastMessageTime?.toISOString() || new Date().toISOString(),
        unreadCount: parseInt(conv.unreadCount) || 0,
        isOnline: Math.random() > 0.5, // Mock online status
      }));

      return NextResponse.json({
        success: true,
        conversations: transformedConversations,
        timestamp: new Date().toISOString(),
      });
    }

  } catch (error: any) {
    console.error('Messages GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch messages',
      messages: [],
      conversations: [],
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = getUserFromRequest(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createMessageSchema.parse(body);

    // Generate conversation ID if not provided
    const conversationId = validatedData.conversationId || 
      generateConversationId(userId, validatedData.receiverId);

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: validatedData.receiverId },
      select: { id: true, name: true, role: true }
    });

    if (!receiver) {
      return NextResponse.json({
        success: false,
        error: 'Receiver not found',
      }, { status: 404 });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        content: validatedData.content,
        senderId: userId,
        receiverId: validatedData.receiverId,
        messageType: validatedData.messageType,
        isRead: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        }
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
        senderName: message.sender.name || 'Unknown',
        receiverName: message.receiver.name || 'Unknown',
        messageType: message.messageType,
        isRead: message.isRead,
        createdAt: message.createdAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    }, { status: 201 });

  } catch (error: any) {
    console.error('Messages POST error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid message data',
        details: error.errors,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to send message',
      message: error.message,
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}