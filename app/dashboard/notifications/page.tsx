/**
 * Notifications Dashboard Page
 * Comprehensive notification management for all user roles
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useComprehensiveNotifications } from '@/hooks/useComprehensiveNotifications';
import { 
  Bell, 
  Filter, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Star, 
  Calendar, 
  Briefcase, 
  User, 
  Building, 
  Settings,
  Trash2,
  Archive
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

const getNotificationIcon = (type: string) => {
  if (type.includes('APPLICATION')) return <Briefcase className="w-5 h-5" />;
  if (type.includes('JOB')) return <Star className="w-5 h-5" />;
  if (type.includes('INTERVIEW')) return <Calendar className="w-5 h-5" />;
  if (type.includes('COMPANY')) return <Building className="w-5 h-5" />;
  if (type.includes('PROFILE')) return <User className="w-5 h-5" />;
  if (type.includes('SYSTEM') || type.includes('ADMIN')) return <Settings className="w-5 h-5" />;
  if (type.includes('MESSAGE')) return <Bell className="w-5 h-5" />;
  return <Info className="w-5 h-5" />;
};

const getNotificationColor = (type: string) => {
  if (type.includes('SUCCESS') || type.includes('ACCEPTED') || type.includes('APPROVED')) return 'text-green-600 bg-green-50 border-green-200';
  if (type.includes('ERROR') || type.includes('REJECTED') || type.includes('FAILED')) return 'text-red-600 bg-red-50 border-red-200';
  if (type.includes('WARNING') || type.includes('EXPIRED') || type.includes('INCOMPLETE')) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  if (type.includes('URGENT') || type.includes('ALERT')) return 'text-red-600 bg-red-100 border-red-300';
  return 'text-blue-600 bg-blue-50 border-blue-200';
};

const getPriorityBadge = (type: string) => {
  if (type.includes('URGENT') || type.includes('ALERT')) return 'bg-red-500';
  if (type.includes('INTERVIEW') || type.includes('OFFER')) return 'bg-orange-500';
  if (type.includes('APPLICATION') || type.includes('JOB')) return 'bg-blue-500';
  return 'bg-gray-500';
};

export default function NotificationsPage() {
  const { data: session } = useSession();
  const { 
    getNotificationStats, 
    markNotificationsReadByType,
    isLoading 
  } = useComprehensiveNotifications();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<Record<string, { read: number; unread: number }>>({});
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'type'>('newest');

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications?limit=100');
        const data = await response.json();
        
        if (data.success) {
          setNotifications(data.data || []);
        }
      } catch (_error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    const fetchStats = async () => {
      try {
        const stats = await getNotificationStats();
        setStats(stats);
      } catch (_error) {
        console.error('Failed to fetch notification stats:', error);
      }
    };

    if (session?.user?.id) {
      fetchNotifications();
      fetchStats();
    }
  }, [session?.user?.id, getNotificationStats]);

  // Filter and sort notifications
  const filteredNotifications = notifications
    .filter(notification => {
      if (filter === 'all') return true;
      if (filter === 'unread') return !notification.isRead;
      if (filter === 'read') return notification.isRead;
      return notification.type.toLowerCase().includes(filter.toLowerCase());
    })
    .filter(notification => 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        // Refresh stats
        const newStats = await getNotificationStats();
        setStats(newStats);
      }
    } catch (_error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' })
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        // Refresh stats
        const newStats = await getNotificationStats();
        setStats(newStats);
      }
    } catch (_error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleMarkByTypeRead = async (type: string) => {
    try {
      await markNotificationsReadByType(type);
      setNotifications(prev => 
        prev.map(n => n.type === type ? { ...n, isRead: true } : n)
      );
      // Refresh stats
      const newStats = await getNotificationStats();
      setStats(newStats);
    } catch (_error) {
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
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getNotificationTypeCount = (type: string) => {
    return stats[type]?.unread || 0;
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please sign in to view your notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">Manage your notifications and stay updated</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications ? notifications.filter(n => !n.isRead).length : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Read</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications ? notifications.filter(n => n.isRead).length : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.filter(n => 
                    new Date(n.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Notifications</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="application">Applications</option>
                <option value="job">Jobs</option>
                <option value="system">System</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="type">By Type</option>
              </select>

              <button
                onClick={handleMarkAllRead}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Mark All Read
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-600">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow border-l-4 ${
                  !notification.isRead ? 'border-l-blue-500' : 'border-l-gray-200'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-full ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {!notification.isRead && (
                            <div className={`w-3 h-3 rounded-full ${getPriorityBadge(notification.type)}`} />
                          )}
                          <span className="text-sm text-gray-500">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mt-2">{notification.message}</p>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">
                            Type: {notification.type}
                          </span>
                          {getNotificationTypeCount(notification.type) > 0 && (
                            <span className="text-sm text-blue-600">
                              {getNotificationTypeCount(notification.type)} unread of this type
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Mark as read
                            </button>
                          )}
                          
                          {getNotificationTypeCount(notification.type) > 1 && (
                            <button
                              onClick={() => handleMarkByTypeRead(notification.type)}
                              className="text-sm text-gray-600 hover:text-gray-800"
                            >
                              Mark all {notification.type} as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
