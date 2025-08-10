import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface MessageAttachment {
  id: string; name: string; url: string; type: string; size: number;
}
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
  attachments?: MessageAttachment[];
}

interface FetchOptions { unreadOnly?: boolean; limit?: number; type?: string }

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  // Deserialize raw message object to Message type
  const deserialize = (raw: Record<string, unknown>): Message => ({
    ...raw,
    createdAt: new Date(String(raw.createdAt)),
    updatedAt: new Date(String(raw.updatedAt)),
  } as Message);

  const fetchMessages = useCallback(async (options?: FetchOptions) => {
    if (!session?.user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options?.unreadOnly) params.append('unreadOnly', 'true');
      if (options?.limit) params.append('limit', String(options.limit));
      if (options?.type) params.append('type', options.type);
      const res = await fetch(`/api/messages?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const list: Message[] = (data.messages || []).map(deserialize);
        setMessages(list);
      } else {
        // Fallback mock messages
        setMessages([
          {
            id: 'mock-1',
            senderId: 'recruiter_1',
            receiverId: session.user.id as string,
            senderName: 'Recruiter Jane',
            senderRole: 'recruiter',
            subject: 'Interview Invitation',
            content: 'We would like to invite you for an interview.',
            preview: 'We would like to invite you...',
            isRead: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            type: 'application',
            priority: 'medium'
          }
        ]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const markAsRead = useCallback(async (id: string) => {
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, isRead: true, updatedAt: new Date() } : m)));
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAsRead', messageIds: [id] })
      });
      if (!res.ok) throw new Error(`Mark as read failed: ${res.status} ${res.statusText}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark message as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setMessages(prev => prev.map(m => ({ ...m, isRead: true, updatedAt: new Date() })));
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAsRead', markAllAsRead: true })
      });
      if (!res.ok) throw new Error(`Mark all as read failed: ${res.status} ${res.statusText}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all messages as read');
    }
  }, []);

  const sendMessage = useCallback(async (input: { receiverId: string; subject: string; content: string; threadId?: string }) => {
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', newMessage: input })
      });
      if (!res.ok) throw new Error(`Send message failed: ${res.status} ${res.statusText}`);
      await fetchMessages();
      const data = await res.json();
      return data.message as Message | undefined;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return undefined;
    }
  }, [fetchMessages]);

  const unreadCount = messages.reduce((c, m) => (!m.isRead ? c + 1 : c), 0);

  return { messages, unreadCount, isLoading, error, markAsRead, markAllAsRead, sendMessage, refresh: fetchMessages };
}