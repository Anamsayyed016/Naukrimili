/**
 * React Hook for Socket.io Client
 * Handles authentication and real-time notifications
 */

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

interface SocketUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  socketId: string;
}

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
  timestamp?: string;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  notifications: Notification[];
  unreadCount: number;
  sendNotification: (data: any) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearNotifications: () => void;
  sendTypingIndicator: (receiverId: string, isTyping: boolean) => void;
}

export function useSocket(): UseSocketReturn {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Initialize socket connection
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      console.log('🔌 Initializing socket connection for:', session.user.email);

      // Create socket connection with authentication
      const newSocket = io(process.env.NEXT_PUBLIC_BASE_URL || 'https://aftionix.in', {
        auth: {
          // Try multiple token sources for better compatibility
          token: (session as any).accessToken || 
                 (session as any).jwt || 
                 session.user.id
        },
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setIsConnected(false);
      });

      newSocket.on('connected', (data) => {
        console.log('🎯 Socket authenticated:', data);
      });

      // Notification events
      newSocket.on('new_notification', (notification: Notification) => {
        console.log('🔔 New notification received:', notification);
        setNotifications(prev => {
          // Prevent duplicate notifications
          const exists = prev.some(n => n.id === notification.id);
          if (exists) {
            console.log('⚠️ Duplicate notification ignored:', notification.id);
            return prev;
          }
          return [notification, ...prev];
        });
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id
          });
        }
      });

      // Handle unread count updates
      newSocket.on('notification_count', (data: { count: number; userId: string }) => {
        console.log('📊 Unread count updated:', data);
        // Force a re-render to update unread count display
        setNotifications(prev => [...prev]);
      });

      newSocket.on('broadcast_notification', (notification: Notification) => {
        console.log('📢 Broadcast notification received:', notification);
        setNotifications(prev => {
          // Prevent duplicate notifications
          const exists = prev.some(n => n.id === notification.id);
          if (exists) {
            console.log('⚠️ Duplicate broadcast notification ignored:', notification.id);
            return prev;
          }
          return [notification, ...prev];
        });
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id
          });
        }
      });

      // Typing indicators
      newSocket.on('user_typing', (data) => {
        console.log('⌨️ User typing:', data);
        // Handle typing indicators in chat components
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        console.log('🧹 Cleaning up socket connection');
        newSocket.close();
      };
    } else if (status === 'unauthenticated') {
      // Disconnect socket if user is not authenticated
      if (socket) {
        console.log('🔐 User not authenticated, disconnecting socket');
        socket.close();
        setSocket(null);
        setIsConnected(false);
        setNotifications([]);
      }
    }
  }, [status, session?.user?.email, session?.user?.id]);

  // Request notification permission
  useEffect(() => {
    if (isConnected && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [isConnected]);

  // Fetch initial notifications when connected
  useEffect(() => {
    if (isConnected && socket) {
      const fetchInitialNotifications = async () => {
        try {
          const response = await fetch('/api/notifications?limit=50');
          const data = await response.json();
          
          if (data.success && data.data) {
            setNotifications(data.data);
          }
        } catch (error) {
          console.error('Failed to fetch initial notifications:', error);
        }
      };

      fetchInitialNotifications();
    }
  }, [isConnected, socket]);

  // Send notification acknowledgment
  const markNotificationAsRead = useCallback((notificationId: string) => {
    if (socket && socket.connected) {
      socket.emit('notification_read', { notificationId });
      
      // Update local state immediately for better UX
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      
      console.log('✅ Notification marked as read:', notificationId);
    } else {
      console.warn('⚠️ Cannot mark notification as read: socket not connected');
    }
  }, [socket]);

  // Send typing indicators
  const sendTypingIndicator = useCallback((receiverId: string, isTyping: boolean) => {
    if (socket && socket.connected) {
      socket.emit(isTyping ? 'typing_start' : 'typing_stop', { receiverId });
      console.log(`⌨️ Typing ${isTyping ? 'started' : 'stopped'} for user:`, receiverId);
    } else {
      console.warn('⚠️ Cannot send typing indicator: socket not connected');
    }
  }, [socket]);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Generic send function
  const sendNotification = useCallback((data: any) => {
    if (socket && socket.connected) {
      socket.emit('custom_event', data);
      console.log('📤 Custom event sent:', data);
    } else {
      console.warn('⚠️ Cannot send custom event: socket not connected');
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    notifications,
    unreadCount,
    sendNotification,
    markNotificationAsRead,
    clearNotifications,
    // Additional utilities
    sendTypingIndicator,
  };
}
