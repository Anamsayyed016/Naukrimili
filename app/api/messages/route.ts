/**
 * Messages API Endpoint
 * Handles real-time messaging between users
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/nextauth-config';
import { prisma } from '@/lib/prisma';
// import { getSocketService } from '@/lib/socket-server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    // Get user's messages (both sent and received)
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.message.count({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id }
        ]
      }
    });

    return NextResponse.json({
      success: true,
      data: messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { receiverId, message, type = 'message' } = body;

    if (!receiverId || !message) {
      return NextResponse.json(
        { error: 'Receiver ID and message are required' },
        { status: 400 }
      );
    }

    // Create message in database
    const newMessage = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content: message,
        messageType: type,
        isRead: false
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true
          }
        }
      }
    });

    // Send real-time notification via socket (optional)
    // try {
    //   const socketService = getSocketService();
    //   if (socketService) {
    //     await socketService.sendNotificationToUser(receiverId, {
    //       type: 'MESSAGE_RECEIVED',
    //       title: `New message from ${newMessage.sender.name}`,
    //       message: message,
    //       data: {
    //         messageId: newMessage.id,
    //         senderId: session.user.id,
    //         type: type
    //       }
    //     });
    //   }
    // } catch (socketError) {
    //   console.warn('⚠️ Socket service not available:', socketError);
    //   // Continue without socket notification
    // }

    return NextResponse.json({
      success: true,
      data: newMessage
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}