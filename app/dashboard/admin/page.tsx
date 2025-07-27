'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'job_post', message: 'Google posted a new job: Senior Developer', time: '2 min ago', read: false },
    { id: 2, type: 'application', message: '5 new applications received', time: '10 min ago', read: false },
    { id: 3, type: 'company', message: 'Microsoft wants to verify their profile', time: '1 hour ago', read: true }
  ]);

  const stats = [
    { label: 'Total Users', value: '2,456', color: 'bg-blue-500', icon: '👥' },
    { label: 'Active Jobs', value: '189', color: 'bg-green-500', icon: '💼' },
    { label: 'Companies', value: '67', color: 'bg-purple-500', icon: '🏢' },
    { label: 'Applications', value: '1,234', color: 'bg-orange-500', icon: '📋' }
  ];

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session?.user?.name}! System Overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                  {stat.icon}
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notifications Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Notifications</h3>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                {notifications.filter(n => !n.read).length} New
              </span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    notif.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                  }`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className={`text-sm ${notif.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Admin Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <div className="text-2xl mb-2">👥</div>
                <div className="text-sm font-medium">Manage Users</div>
              </button>
              <button className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <div className="text-2xl mb-2">🏢</div>
                <div className="text-sm font-medium">Verify Companies</div>
              </button>
              <button className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <div className="text-2xl mb-2">💼</div>
                <div className="text-sm font-medium">Review Jobs</div>
              </button>
              <button className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-sm font-medium">Analytics</div>
              </button>
              <button className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <div className="text-2xl mb-2">⚙️</div>
                <div className="text-sm font-medium">System Settings</div>
              </button>
              <button className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                <div className="text-2xl mb-2">🚨</div>
                <div className="text-sm font-medium">Reports</div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Platform Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-blue-50">
              <div>
                <p className="font-medium">New Company Registration</p>
                <p className="text-sm text-gray-600">TechCorp India registered and awaiting verification</p>
              </div>
              <span className="text-xs text-gray-500">5 min ago</span>
            </div>
            <div className="flex items-center justify-between p-3 border-l-4 border-green-500 bg-green-50">
              <div>
                <p className="font-medium">Job Application Surge</p>
                <p className="text-sm text-gray-600">Frontend Developer position received 50+ applications</p>
              </div>
              <span className="text-xs text-gray-500">15 min ago</span>
            </div>
            <div className="flex items-center justify-between p-3 border-l-4 border-orange-500 bg-orange-50">
              <div>
                <p className="font-medium">System Alert</p>
                <p className="text-sm text-gray-600">High server load detected - monitoring required</p>
              </div>
              <span className="text-xs text-gray-500">30 min ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}