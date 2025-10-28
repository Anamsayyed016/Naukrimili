/**
 * Message Bell Component with Real-time Updates
 * Integrates with Socket.io for live messaging
 */

'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, MessageSquareMore, X, Check } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { safeLength } from '@/lib/safe-array-utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ScrollArea,
} from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  messageType: 'text' | 'interview_request' | 'application_update';
}

export function MessageBell() {
  const { socket, isConnected } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch messages from API
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/messages?limit=20');
        const data = await response.json();
        
        if (data.success) {
          setMessages(data.data || []);
          setUnreadCount(safeLength((data.data || []).filter((m: Message) => !m.isRead)) || 0);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isConnected) {
      fetchMessages();
    }
  }, [isConnected]);

  // Listen for new messages via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      setMessages(prev => [message, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`New message from ${message.senderName}`, {
          body: message.content,
          icon: '/favicon.ico'
        });
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket]);

  const handleMessageClick = async (message: Message) => {
    if (!message.isRead) {
      // Mark message as read
      try {
        await fetch(`/api/messages/${message.id}/read`, {
          method: 'POST'
        });
        setMessages(prev => 
          prev.map(m => m.id === message.id ? { ...m, isRead: true } : m)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark message as read:', error);
      }
    }
    
    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/messages/mark-all-read', {
        method: 'POST'
      });
      setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all messages as read:', error);
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'interview_request':
        return '📅';
      case 'application_update':
        return '📋';
      default:
        return '💬';
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'interview_request':
        return 'text-purple-600';
      case 'application_update':
        return 'text-blue-600';
      default:
        return 'text-gray-900';
    }
  };

  return (
    <div className="relative">
      {/* Connection Status Indicator */}
      {isConnected && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      )}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative touch-manipulation min-h-[44px] min-w-[44px] p-2"
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale'
            }}
          >
            {unreadCount > 0 ? (
              <MessageSquareMore className="h-5 w-5 text-blue-500" />
            ) : (
              <MessageSquare className="h-5 w-5" />
            )}
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale'
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-[calc(100vw-1rem)] sm:w-80 md:w-96 p-0 mx-2 sm:mx-0 shadow-2xl border border-gray-200 rounded-xl z-[9999]" 
          align="end"
          side="bottom"
          sideOffset={12}
          avoidCollisions={true}
          collisionPadding={24}
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            maxHeight: 'calc(100vh - 6rem)',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            transform: 'translateZ(0)',
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden'
          }}
        >
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Messages</h3>
                  <p className="text-sm text-gray-500">{unreadCount} unread</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {safeLength(messages) > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllRead}
                    className="text-xs bg-white hover:bg-gray-50 border-gray-200"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <ScrollArea className="h-80 max-h-[50vh]">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Loading messages...
              </div>
            ) : safeLength(messages) === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No messages yet</p>
                <p className="text-sm leading-relaxed">Start a conversation to see messages here</p>
              </div>
            ) : (
              <div className="divide-y">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors touch-manipulation"
                    onClick={() => handleMessageClick(message)}
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      WebkitFontSmoothing: 'antialiased',
                      MozOsxFontSmoothing: 'grayscale'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-lg flex-shrink-0">
                        {getMessageIcon(message.messageType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-medium leading-tight ${getMessageColor(message.messageType)}`}>
                            {message.senderName}
                          </h4>
                          {!message.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                          {message.content}
                        </p>
                        <p className="text-xs text-gray-400 mt-2 font-medium">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {safeLength(messages) > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => window.open('/messages', '_blank')}
              >
                View all messages
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
