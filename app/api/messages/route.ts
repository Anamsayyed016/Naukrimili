import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: 'recruiter' | 'employer' | 'admin' | 'user';
  subject: string;
  content: string;
  preview: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  type: 'recruiter' | 'system' | 'user' | 'interview' | 'application';
  priority: 'low' | 'medium' | 'high';
  threadId?: string;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
}

// Mock messages data - replace with actual database calls
const mockMessages: Message[] = [
  {
    id: '1',
    senderId: 'recruiter_1',
    receiverId: '1',
    senderName: 'Sarah Johnson',
    senderAvatar: '/avatars/recruiter1.jpg',
    senderRole: 'recruiter',
    subject: 'Interview Invitation - Senior Software Developer',
    content: 'Hi there! We were impressed with your profile and would like to invite you for an interview for our Senior Software Developer position. The role involves working with React, Node.js, and building scalable web applications. Are you available for a video call this week?',
    preview: 'Hi there! We were impressed with your profile and would like to invite you...',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    type: 'interview',
    priority: 'high',
    threadId: 'thread_1'
  },
  {
    id: '2',
    senderId: 'recruiter_2',
    receiverId: '1',
    senderName: 'Mike Chen',
    senderAvatar: '/avatars/recruiter2.jpg',
    senderRole: 'recruiter',
    subject: 'Follow up on your application - Frontend Developer',
    content: 'Thank you for your interest in our Frontend Developer position. We have reviewed your application and would like to schedule a technical screening call. Please let me know your availability for next week.',
    preview: 'Thank you for your interest in our Frontend Developer position...',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    type: 'application',
    priority: 'medium',
    threadId: 'thread_2'
  },
  {
    id: '3',
    senderId: 'admin',
    receiverId: '1',
    senderName: 'NaukriMili Team',
    senderAvatar: '/avatars/admin.jpg',
    senderRole: 'admin',
    subject: 'Welcome to NaukriMili! Complete your profile',
    content: 'Welcome to NaukriMili! We\'re excited to have you on board. To get the best job recommendations, please complete your profile by adding your skills, experience, and preferences. This will help recruiters find you more easily.',
    preview: 'Welcome to NaukriMili! We\'re excited to have you on board...',
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    type: 'system',
    priority: 'low',
    threadId: 'thread_3'
  },
  {
    id: '4',
    senderId: 'recruiter_3',
    receiverId: '1',
    senderName: 'Emma Wilson',
    senderAvatar: '/avatars/recruiter3.jpg',
    senderRole: 'recruiter',
    subject: 'Exciting opportunity at TechStartup Inc.',
    content: 'Hello! I came across your profile and think you would be a great fit for our Full Stack Developer role at TechStartup Inc. We offer competitive salary, equity, and amazing growth opportunities. Would you be interested in learning more?',
    preview: 'Hello! I came across your profile and think you would be a great fit...',
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    type: 'recruiter',
    priority: 'medium',
    threadId: 'thread_4'
  },
  {
    id: '5',
    senderId: 'recruiter_4',
    receiverId: '1',
    senderName: 'David Park',
    senderAvatar: '/avatars/recruiter4.jpg',
    senderRole: 'recruiter',
    subject: 'Your application status update',
    content: 'Thank you for applying to our React Developer position. We have received your application and our technical team is currently reviewing it. We will get back to you within 5 business days with the next steps.',
    preview: 'Thank you for applying to our React Developer position...',
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    type: 'application',
    priority: 'low',
    threadId: 'thread_5'
  }
];

// GET /api/messages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const type = searchParams.get('type');

    // Filter messages for the current user
    let userMessages = mockMessages.filter(m => m.receiverId === session.user.id);

    if (unreadOnly) {
      userMessages = userMessages.filter(m => !m.isRead);
    }

    if (type) {
      userMessages = userMessages.filter(m => m.type === type);
    }

    // Sort by creation date (newest first)
    userMessages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedMessages = userMessages.slice(startIndex, startIndex + limit);

    const totalCount = userMessages.length;
    const unreadCount = mockMessages.filter(m => m.receiverId === session.user.id && !m.isRead).length;

    return NextResponse.json({
      messages: paginatedMessages,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: startIndex + limit < totalCount
      },
      unreadCount,
      stats: {
        total: totalCount,
        unread: unreadCount,
        byType: {
          recruiter: userMessages.filter(m => m.type === 'recruiter').length,
          application: userMessages.filter(m => m.type === 'application').length,
          interview: userMessages.filter(m => m.type === 'interview').length,
          system: userMessages.filter(m => m.type === 'system').length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/messages (mark as read, send message)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, messageIds, markAllAsRead, newMessage } = body;

    if (action === 'markAsRead') {
      if (markAllAsRead) {
        // Mark all messages as read for this user
        mockMessages.forEach(message => {
          if (message.receiverId === session.user.id) {
            message.isRead = true;
            message.updatedAt = new Date();
          }
        });
      } else if (messageIds && Array.isArray(messageIds)) {
        // Mark specific messages as read
        messageIds.forEach(id => {
          const message = mockMessages.find(m => m.id === id && m.receiverId === session.user.id);
          if (message) {
            message.isRead = true;
            message.updatedAt = new Date();
          }
        });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'send' && newMessage) {
      // Create new message (simplified - in real app, validate recipient exists)
      const message: Message = {
        id: `msg_${Date.now()}`,
        senderId: session.user.id!,
        receiverId: newMessage.receiverId,
        senderName: session.user.name || 'User',
        senderAvatar: session.user.image || undefined,
        senderRole: 'user',
        subject: newMessage.subject,
        content: newMessage.content,
        preview: newMessage.content.substring(0, 100) + (newMessage.content.length > 100 ? '...' : ''),
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        type: 'user',
        priority: 'medium',
        threadId: newMessage.threadId || `thread_${Date.now()}`
      };

      mockMessages.push(message);
      return NextResponse.json({ success: true, message });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error processing messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
