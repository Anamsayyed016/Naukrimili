import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

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
    size: number}[]}

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const fetchMessages = async (options?: { unreadOnly?: boolean; limit?: number; type?: string }) => {
    if (!session?.user) {
      setIsLoading(false);
      return}

    try {
      const params = new URLSearchParams();
      if (options?.unreadOnly) params.append('unreadOnly', 'true');
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.type) params.append('type', options.type);

      const response = await fetch(`/api/messages?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages')}

      const data = await response.json();
      
      // Convert date strings back to Date objects
      const processedMessages = data.messages.map((message: Record<string, unknown>) => ({
        ...message,
        createdAt: new Date(message.createdAt),
        updatedAt: new Date(message.updatedAt)
      }));

      setMessages(processedMessages);
      setError(null)} catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Fallback to mock data on error
      const mockMessages: Message[] = [
        {
          id: '1',
          senderId: 'recruiter_1',
          receiverId: session.user.id,
          senderName: 'Sarah Johnson',
          senderAvatar: '/avatars/recruiter1.jpg',
          senderRole: 'recruiter',
          subject: 'Interview Invitation - Software Developer Role',
          content: 'Hi! We would like to invite you for an interview for the Software Developer position...',
          preview: 'Hi! We would like to invite you for an interview for the Software Developer position...',
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
          receiverId: session.user.id,
          senderName: 'Tech Solutions HR',
          senderAvatar: '/avatars/company1.jpg',
          senderRole: 'recruiter',
          subject: 'Follow up on your application',
          content: 'Thank you for your interest in our company. We wanted to follow up...',
          preview: 'Thank you for your interest in our company. We wanted to follow up...',
          isRead: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: 'application',
          priority: 'medium',
          threadId: 'thread_2'
        }
      ];
      setMessages(mockMessages)} finally {
      setIsLoading(false)}
  };

  useEffect(() => {
    fetchMessages()}, [session]);

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'markAsRead',
          messageIds: [messageId]
        }),
      });

      if (response.ok) {
        setMessages(prev => 
          prev.map(message => 
            message.id === messageId 
              ? { ...message, isRead: true, updatedAt: new Date() }
              : message
          )
        )}
    } catch (err) {
      console.error('Error marking message as read:', err)}
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'markAsRead',
          markAllAsRead: true
        }),
      });

      if (response.ok) {
        setMessages(prev => 
          prev.map(message => ({ 
            ...message, 
            isRead: true, 
            updatedAt: new Date() 
          }))
        )}
    } catch (err) {
      console.error('Error marking all messages as read:', err)}
  };

  const sendMessage = async (newMessage: {
    receiverId: string;
    subject: string;
    content: string;
    threadId?: string}) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send',
          newMessage
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh messages to get the latest state
        await fetchMessages();
        return data.message}
    } catch (err) {
      console.error('Error sending message:', err);
      throw err}
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  return {
    messages,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    sendMessage,
    refresh: fetchMessages}}
