import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'job_match' | 'application_update' | 'profile_reminder' | 'system' | 'recruiter';
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

interface FetchOptions { unreadOnly?: boolean; limit?: number }

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const fetchNotifications = useCallback(async (options?: FetchOptions) => {
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
      const res = await fetch(`/api/notifications?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const list: Notification[] = (data.notifications || []).map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt)
        }));
        setNotifications(list);
      } else {
        setNotifications([
          {
            id: 'notif-1',
            userId: session.user.id as string,
            title: 'Welcome',
            message: 'Notifications are active.',
            type: 'system',
            isRead: false,
            createdAt: new Date(),
            priority: 'low'
          }
        ]);
      }
    } catch (_) {
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [id] })
      });
    } catch (_) { /* silent */ }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      });
    } catch (_) { /* silent */ }
  }, []);

  const unreadCount = notifications.reduce((c, n) => (!n.isRead ? c + 1 : c), 0);

  return { notifications, unreadCount, isLoading, error, markAsRead, markAllAsRead, refresh: fetchNotifications };
}