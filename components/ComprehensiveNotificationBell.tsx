/**
 * Comprehensive Notification Bell Component
 * Enhanced notification system with role-based notifications
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Bell, Check, X, AlertCircle, CheckCircle, Info, Star, Calendar, Briefcase, User, Building, Settings } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useComprehensiveNotifications } from '@/hooks/useComprehensiveNotifications';
import { useSession } from 'next-auth/react';
import { safeLength, safeArray } from '@/lib/safe-array-utils';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
  timestamp?: string;
}

const getNotificationIcon = (type: string) => {
  if (type.includes('APPLICATION')) return <Briefcase className="w-4 h-4" />;
  if (type.includes('JOB')) return <Star className="w-4 h-4" />;
  if (type.includes('INTERVIEW')) return <Calendar className="w-4 h-4" />;
  if (type.includes('COMPANY')) return <Building className="w-4 h-4" />;
  if (type.includes('PROFILE')) return <User className="w-4 h-4" />;
  if (type.includes('SYSTEM') || type.includes('ADMIN')) return <Settings className="w-4 h-4" />;
  if (type.includes('MESSAGE')) return <Bell className="w-4 h-4" />;
  return <Info className="w-4 h-4" />;
};

const getNotificationColor = (type: string) => {
  if (type.includes('SUCCESS') || type.includes('ACCEPTED') || type.includes('APPROVED')) return 'text-green-600 bg-green-50';
  if (type.includes('ERROR') || type.includes('REJECTED') || type.includes('FAILED')) return 'text-red-600 bg-red-50';
  if (type.includes('WARNING') || type.includes('EXPIRED') || type.includes('INCOMPLETE')) return 'text-yellow-600 bg-yellow-50';
  if (type.includes('URGENT') || type.includes('ALERT')) return 'text-red-600 bg-red-100';
  return 'text-blue-600 bg-blue-50';
};

const getPriorityBadge = (type: string) => {
  if (type.includes('URGENT') || type.includes('ALERT')) return 'bg-red-500';
  if (type.includes('INTERVIEW') || type.includes('OFFER')) return 'bg-orange-500';
  if (type.includes('APPLICATION') || type.includes('JOB')) return 'bg-blue-500';
  return 'bg-gray-500';
};

export function ComprehensiveNotificationBell() {
  const { socket, isConnected, notifications, unreadCount, markNotificationAsRead } = useSocket();
  const { getNotificationStats, markNotificationsReadByType } = useComprehensiveNotifications();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationStats, setNotificationStats] = useState<Record<string, { read: number; unread: number }>>({});
  const [filter, setFilter] = useState<string>('all');

  // Fetch notification stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getNotificationStats();
        setNotificationStats(stats);
      } catch (error) {
        console.error('Failed to fetch notification stats:', error);
      }
    };

    if (session?.user?.id) {
      fetchStats();
    }
  }, [session?.user?.id, getNotificationStats]);

  // Filter notifications with additional safety checks
  const filteredNotifications = useMemo(() => {
    const safeNotifications = safeArray(notifications);
    return safeNotifications.filter((notification: Notification) => {
      if (!notification || typeof notification !== 'object') return false;
      if (filter === 'all') return true;
      if (filter === 'unread') return !notification.isRead;
      return notification.type && notification.type.toLowerCase().includes(filter.toLowerCase());
    });
  }, [notifications, filter]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification.id);
    }
    
    // Handle notification action
    if (notification.data?.actionUrl) {
      window.location.href = notification.data.actionUrl as string;
    }
    
    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' })
      });
      
      if (response.ok) {
        // Refresh notifications
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkByTypeRead = async (type: string) => {
    try {
      await markNotificationsReadByType(type);
      // Refresh stats
      const stats = await getNotificationStats();
      setNotificationStats(stats);
    } catch (error) {
      console.error('Failed to mark notifications as read by type:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleMarkAllRead}
                  disabled={isLoading}
                  className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {isLoading ? 'Marking...' : 'Mark all read'}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 mt-3">
              {['all', 'unread', 'application', 'job', 'system'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filter === filterType
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No notifications found</p>
              </div>
            ) : (
              filteredNotifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Icon */}
                    <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {!notification.isRead && (
                            <div className={`w-2 h-2 rounded-full ${getPriorityBadge(notification.type)}`} />
                          )}
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      {/* Action buttons for specific types */}
                      {notification.type.includes('APPLICATION') && !notification.isRead && (
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkByTypeRead(notification.type);
                            }}
                            className="text-xs text-green-600 hover:text-green-800"
                          >
                            Mark as read
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Total: {safeLength(notifications)} notifications</span>
              <a
                href="/dashboard/notifications"
                className="text-blue-600 hover:text-blue-800"
              >
                View all
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
