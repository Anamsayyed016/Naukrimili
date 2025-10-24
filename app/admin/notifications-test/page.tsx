/**
 * Admin Notifications Test Page
 * For testing real-time notifications
 */

'use client';

import React from 'react';
import { NotificationTestPanel } from '@/components/NotificationTestPanel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/hooks/useSocket';
import { Bell, Wifi, WifiOff } from 'lucide-react';

export default function NotificationsTestPage() {
  const { isConnected, socket } = useSocket();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Real-time Notifications Test</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Test the dynamic Socket.io real-time notification system for different user roles. 
            Send notifications to jobseekers, employers, and admins with desktop notifications.
          </p>
        </div>

        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              Socket Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge 
                variant={isConnected ? "default" : "destructive"}
                className={isConnected ? "bg-green-500" : "bg-red-500"}
              >
                {isConnected ? "Connected" : "Disconnected"}
              </Badge>
              <span className="text-sm text-gray-600">
                {isConnected 
                  ? "Real-time notifications are active" 
                  : "Real-time notifications are not available"
                }
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Test Panel */}
        <NotificationTestPanel />

        {/* Features Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              System Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">🔔 Real-time Notifications</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Instant delivery via Socket.io</li>
                  <li>• Role-based targeting (Jobseeker/Employer/Admin)</li>
                  <li>• Desktop browser notifications</li>
                  <li>• Mobile-optimized fallbacks</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">🎯 Dynamic Events</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Job posting notifications</li>
                  <li>• Application status updates</li>
                  <li>• Interview scheduling alerts</li>
                  <li>• System announcements</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
