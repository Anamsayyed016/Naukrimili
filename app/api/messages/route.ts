import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    
    const skip = (page - 1) * limit;

    if (conversationId) {
      // Get messages for a specific conversation
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: user.id, receiverId: parseInt(conversationId, 10) },
            { senderId: parseInt(conversationId, 10), receiverId: user.id }
          ]
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip
      });

      return NextResponse.json({
        success: true,
        data: messages
      });
    } else {
      // Get all conversations for the user
      const conversations = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: user.id },
            { receiverId: user.id }
          ]
        },
        orderBy: { createdAt: 'desc' },
        distinct: ['senderId', 'receiverId'],
        take: limit,
        skip
      });

      // Get unique conversation partners
      const conversationPartners = new Set<number>();
      conversations.forEach(msg => {
        if (msg.senderId !== user.id) conversationPartners.add(msg.senderId);
        if (msg.receiverId !== user.id) conversationPartners.add(msg.receiverId);
      });

      const partnerIds = Array.from(conversationPartners);
      
      // Get user details for conversation partners
      const partners = await prisma.user.findMany({
        where: { id: { in: partnerIds } },
        select: { id: true, name: true, email: true, profilePicture: true }
      });

      return NextResponse.json({
        success: true,
        data: {
          conversations: partners,
          total: partners.length
        }
      });
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { user } = auth;

  try {
    const body = await request.json();
    const { receiverId, content, messageType = 'text' } = body;

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      );
    }

    // Validate receiver ID
    const receiverIdNum = parseInt(receiverId, 10);
    if (isNaN(receiverIdNum)) {
      return NextResponse.json(
        { error: 'Invalid receiver ID' },
        { status: 400 }
      );
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverIdNum }
    });

    if (!receiver) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        receiverId: receiverIdNum,
        content,
        messageType,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      data: message,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
