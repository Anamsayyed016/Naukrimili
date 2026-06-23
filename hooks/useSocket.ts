/**
 * React Hook for Socket.io Client
 * Handles authentication and real-time notifications
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import type { Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { useMobileNotifications } from '@/hooks/useMobileNotifications';
import { safeLength, safeArray } from '@/lib/safe-array-utils';

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
  const { showMobileNotification, isMobile } = useMobileNotifications();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Desktop notification function with browser permission handling
  const showDesktopNotification = useCallback((options: {
    title: string;
    body: string;
    icon?: string;
    tag?: string;
    role?: string;
  }) => {
    // Check if browser notifications are supported
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    // Check permission and request if needed
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          showDesktopNotification(options);
        }
      });
      return false;
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permission denied');
      return false;
    }

    try {
      // Create desktop notification with role-specific styling
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon',
        tag: options.tag,
        requireInteraction: false,
        silent: false
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Navigate to relevant page based on notification type
        if (options.role === 'employer') {
          window.location.href = '/employer/dashboard';
        } else if (options.role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else {
          window.location.href = '/dashboard';
        }
      };

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      console.log('✅ Desktop notification shown:', options.title);
      return true;
    } catch (error) {
      console.error('Failed to show desktop notification:', error);
      return false;
    }
  }, []);

  // Calculate unread count with additional safety checks
  const unreadCount = useMemo(() => {
    const safeNotifications = safeArray(notifications);
    return safeNotifications.filter((n: any) => n && !n.isRead).length;
  }, [notifications]);

  // Initialize socket connection
  useEffect(() => {
    // Prevent multiple initializations
    if (socket) {
      return;
    }
    
    if (status === 'authenticated' && session?.user) {
      console.log('🔌 Initializing socket connection for:', session.user.email);

      // Create socket connection with authentication
      // Use canonical base URL - single source of truth
      const getSocketUrl = async () => {
        if (process.env.NEXT_PUBLIC_SOCKET_URL) {
          return process.env.NEXT_PUBLIC_SOCKET_URL;
        }
        const { getBaseUrl } = await import('@/lib/url-utils');
        const baseUrl = getBaseUrl();
        // Socket.io automatically appends /socket.io/ path, so just return base URL
        return baseUrl;
      };
      
      getSocketUrl().then(async (socketUrl) => {
        if (!socketUrl) {
          console.log('⚠️ Skipping socket connection (no socket URL available)');
          return;
        }
        
        console.log('🔌 Connecting to socket server:', socketUrl);
        
        // Skip socket connection only if we detect we're in a standalone build (no socket server available)
        // In production, always attempt connection (server.cjs initializes socket server)
        const isStandalone = typeof window !== 'undefined' && 
                            window.location.href.includes('/standalone');
        
        // Only skip in development if explicitly configured to skip
        // In production, server.cjs always initializes socket server, so always attempt connection
        const isDevelopment = process.env.NODE_ENV === 'development';
        const shouldSkip = isStandalone || (isDevelopment && process.env.NEXT_PUBLIC_SKIP_SOCKET === 'true');
        
        if (shouldSkip) {
          console.log('⚠️ Skipping socket connection (no socket server configured)');
          return;
        }

        const { default: io } = await import('socket.io-client');
        
        const newSocket = io(socketUrl, {
          path: '/socket.io/', // Explicit socket path for consistency
          auth: {
          // Try multiple token sources for better compatibility
          token: (session as any).accessToken || 
                 (session as any).jwt || 
                 session.user.id
        },
        transports: ['polling', 'websocket'], // Prefer polling first for better compatibility
        autoConnect: true,
        forceNew: true, // Force new connection to prevent reconnection issues
        timeout: 5000, // Reduced timeout to fail faster
        reconnection: false, // Disable reconnection to prevent repeated connection attempts
        reconnectionAttempts: 0, // No reconnection attempts
      });

      // Store original console methods and error handlers for restoration
      const originalError = console.error;
      const originalWarn = console.warn;
      const originalErrorHandler = window.onerror;
      const originalUnhandledRejection = window.onunhandledrejection;
      
      // Suppress WebSocket connection errors and Socket.IO 404 errors
      const suppressSocketErrors = () => {
        // Intercept XMLHttpRequest to suppress Socket.IO 404 errors
        if (window.XMLHttpRequest) {
          const originalOpen = XMLHttpRequest.prototype.open;
          const originalSend = XMLHttpRequest.prototype.send;
          
          XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...rest: any[]) {
            this._url = url.toString();
            return originalOpen.apply(this, [method, url, ...rest] as any);
          };
          
          XMLHttpRequest.prototype.send = function(...args: any[]) {
            const url = this._url || '';
            if (url.includes('/socket.io/')) {
              // Suppress errors for socket.io requests
              this.addEventListener('error', (e) => {
                e.stopPropagation();
              }, true);
              this.addEventListener('load', function() {
                if (this.status === 404) {
                  // Silently ignore 404s for socket.io
                  return;
                }
              });
            }
            return originalSend.apply(this, args);
          };
        }
        
        // Intercept fetch to suppress Socket.IO 404s
        const originalFetch = window.fetch;
        window.fetch = async (...args: any[]) => {
          const url = args[0]?.toString() || '';
          if (url.includes('/socket.io/')) {
            try {
              const response = await originalFetch.apply(window, args);
              // Don't log 404s for socket.io
              if (response.status === 404) {
                return response; // Return silently
              }
              return response;
            } catch (err) {
              // Silently ignore Socket.IO connection errors
              throw err;
            }
          }
          return originalFetch.apply(window, args);
        };
        
        // Suppress console errors for socket.io
        console.error = (...args: any[]) => {
          const message = args[0]?.toString() || '';
          // Suppress WebSocket connection errors and Socket.IO transport errors
          if (
            message.includes('WebSocket connection') && 
            (message.includes('failed') || message.includes('error'))
          ) {
            return; // Don't log WebSocket connection failures
          }
          // Suppress socket.io 404 errors
          if (
            message.includes('socket.io') || 
            message.includes('/socket.io/') || 
            (message.includes('GET') && message.includes('404') && message.includes('socket.io')) ||
            (message.includes('404') && message.includes('Not Found') && message.includes('socket.io'))
          ) {
            return; // Don't log Socket.IO errors (404s are expected if server isn't running)
          }
          originalError.apply(console, args);
        };
        
        // Add global error handler to suppress socket.io network errors
        window.onerror = function(message, source, lineno, colno, error) {
          const msg = String(message || '');
          if (msg.includes('socket.io') || msg.includes('/socket.io/') || (msg.includes('404') && msg.includes('socket.io'))) {
            return true; // Suppress error
          }
          if (originalErrorHandler) {
            return originalErrorHandler.apply(window, arguments as any);
          }
          return false;
        };
        
        // Suppress unhandled promise rejections for socket.io
        window.onunhandledrejection = function(event) {
          const reason = String(event.reason || '');
          if (reason.includes('socket.io') || reason.includes('/socket.io/') || (reason.includes('404') && reason.includes('socket.io'))) {
            event.preventDefault();
            return true; // Suppress rejection
          }
          if (originalUnhandledRejection) {
            return originalUnhandledRejection.apply(window, arguments as any);
          }
          return false;
        };
        
        console.warn = (...args: any[]) => {
          const message = args[0]?.toString() || '';
          // Suppress Socket.IO connection warnings
          if (message.includes('socket.io') || message.includes('/socket.io/')) {
            return;
          }
          originalWarn.apply(console, args);
        };
      };

      // Suppress errors immediately
      suppressSocketErrors();

      // Connection events
      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        setIsConnected(true);
        // Restore original console methods after successful connection
        console.error = originalError;
        console.warn = originalWarn;
      });

      newSocket.on('disconnect', (reason) => {
        // Only log disconnect if it's not a normal transport close
        if (reason !== 'transport close' && reason !== 'io server disconnect') {
          console.log('❌ Socket disconnected:', reason);
        }
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        // Suppress connection error logs - they're expected if socket server isn't running
        setIsConnected(false);
        // Close socket connection to prevent repeated attempts
        newSocket.close();
        // Keep error suppression active
      });

      newSocket.on('connected', (data) => {
        console.log('🎯 Socket authenticated:', data);
      });

      // Handle authentication errors
      newSocket.on('auth_error', (error) => {
        console.error('❌ Socket authentication failed:', error);
        setIsConnected(false);
      });

      // Role-based notification events
      newSocket.on('notification:jobseeker', (notification: any) => {
        console.log('🔔 Jobseeker notification received:', notification);
        handleRoleBasedNotification(notification, 'jobseeker');
      });

      newSocket.on('notification:employer', (notification: any) => {
        console.log('🔔 Employer notification received:', notification);
        handleRoleBasedNotification(notification, 'employer');
      });

      newSocket.on('notification:admin', (notification: any) => {
        console.log('🔔 Admin notification received:', notification);
        handleRoleBasedNotification(notification, 'admin');
      });

      // Generic notification events (for backward compatibility)
      newSocket.on('new_notification', (notification: Notification) => {
        console.log('🔔 New notification received:', notification);
        
        // Validate notification data
        if (!notification || !notification.id || !notification.title || !notification.message) {
          console.error('❌ Invalid notification received:', notification);
          return;
        }
        
        setNotifications(prev => {
          // Prevent duplicate notifications
          const exists = prev.some(n => n.id === notification.id);
          if (exists) {
            console.log('⚠️ Duplicate notification ignored:', notification.id);
            return prev;
          }
          return [notification, ...prev];
        });
        
        // Show notification with mobile compatibility
        showMobileNotification({
          title: notification.title,
          body: notification.message,
          icon: '/icon',
          tag: notification.id
        });
      });

      // Helper function to handle role-based notifications
      const handleRoleBasedNotification = (notification: any, role: string) => {
        // Validate notification data
        if (!notification || !notification.title || !notification.message) {
          console.error(`❌ Invalid ${role} notification received:`, notification);
          return;
        }

        // Create a notification object with proper structure
        const formattedNotification: Notification = {
          id: notification.id || `role_${role}_${Date.now()}`,
          userId: session.user.id,
          type: notification.type || 'SYSTEM',
          title: notification.title,
          message: notification.message,
          isRead: false,
          data: notification.data || {},
          createdAt: notification.timestamp || new Date().toISOString(),
          timestamp: notification.timestamp
        };

        setNotifications(prev => {
          // Prevent duplicate notifications
          const exists = prev.some(n => n.id === formattedNotification.id);
          if (exists) {
            console.log('⚠️ Duplicate role notification ignored:', formattedNotification.id);
            return prev;
          }
          return [formattedNotification, ...prev];
        });

        // Show desktop notification with role-specific styling
        showDesktopNotification({
          title: `${role.charAt(0).toUpperCase() + role.slice(1)}: ${notification.title}`,
          body: notification.message,
          icon: '/icon',
          tag: formattedNotification.id,
          role: role
        });
      };

      // Job creation events
      newSocket.on('job_created', (data: any) => {
        console.log('🎉 Job created event received:', data);
        
        // Show notification for job creation
        showMobileNotification({
          title: 'New Job Posted! 🎉',
          body: `A new job "${data.jobTitle}" has been posted by ${data.company}`,
          icon: '/icon',
          tag: `job_created_${data.jobId}`
        });
      });

      // Handle unread count updates
      newSocket.on('notification_count', (data: { count: number; userId: string }) => {
        console.log('📊 Unread count updated:', data);
        // Force a re-render to update unread count display
        setNotifications(prev => [...prev]);
      });

      newSocket.on('broadcast_notification', (notification: Notification) => {
        console.log('📢 Broadcast notification received:', notification);
        
        // Validate notification data
        if (!notification || !notification.id || !notification.title || !notification.message) {
          console.error('❌ Invalid broadcast notification received:', notification);
          return;
        }
        
        setNotifications(prev => {
          // Prevent duplicate notifications
          const exists = prev.some(n => n.id === notification.id);
          if (exists) {
            console.log('⚠️ Duplicate broadcast notification ignored:', notification.id);
            return prev;
          }
          return [notification, ...prev];
        });
        
        // Show notification with mobile compatibility
        showMobileNotification({
          title: notification.title,
          body: notification.message,
          icon: '/icon',
          tag: notification.id
        });
      });

      // Typing indicators
      newSocket.on('user_typing', (data) => {
        console.log('⌨️ User typing:', data);
        // Handle typing indicators in chat components
      });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
          // Restore original console methods and error handlers before cleanup
          console.error = originalError;
          console.warn = originalWarn;
          if (originalErrorHandler) {
            window.onerror = originalErrorHandler;
          }
          if (originalUnhandledRejection) {
            window.onunhandledrejection = originalUnhandledRejection;
          }
          console.log('🧹 Cleaning up socket connection');
          newSocket.close();
        };
      }).catch((error) => {
        console.error('❌ Failed to get socket URL:', error);
      });
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

  // Mobile notification initialization is handled by useMobileNotifications hook

  // Fetch initial notifications when connected
  useEffect(() => {
    if (isConnected && socket) {
      const fetchInitialNotifications = async () => {
        try {
          const response = await fetch('/api/notifications?limit=50');
          const data = await response.json();
          
          console.log('📊 Fetched initial notifications:', data);
          
          if (data.success && Array.isArray(data.data)) {
            // Ensure all notifications have required properties
            const validNotifications = data.data.filter(notification => 
              notification && 
              notification.id && 
              notification.title && 
              notification.message
            );
            setNotifications(validNotifications);
            console.log('✅ Set initial notifications:', safeLength(validNotifications));
          } else {
            console.log('⚠️ Invalid notification data structure:', data);
            setNotifications([]);
          }
        } catch (error) {
          console.error('❌ Failed to fetch initial notifications:', error);
          setNotifications([]);
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
