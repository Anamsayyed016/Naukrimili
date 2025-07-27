'use client';
import { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    jobAlerts: true,
    profileVisibility: 'public',
    twoFactor: false
  });

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Account Settings</h1>
        
        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-md border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600">📧</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Email Notifications</h3>
                    <p className="text-sm text-gray-600">Receive updates via email</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('emailNotifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border-2 ${
                    settings.emailNotifications ? 'bg-blue-600 border-blue-600' : 'bg-gray-200 border-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                      settings.emailNotifications ? 'bg-white translate-x-5' : 'bg-gray-500 translate-x-0'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-green-600">🔔</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Job Alerts</h3>
                    <p className="text-sm text-gray-600">Get notified about new job matches</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('jobAlerts')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border-2 ${
                    settings.jobAlerts ? 'bg-blue-600 border-blue-600' : 'bg-gray-200 border-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                      settings.jobAlerts ? 'bg-white translate-x-5' : 'bg-gray-500 translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white rounded-lg shadow-md border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Visibility
                </label>
                <select
                  value={settings.profileVisibility}
                  onChange={(e) => setSettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="recruiters">Recruiters Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-lg shadow-md border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Security</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-red-600">🔒</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600">Add extra security to your account</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('twoFactor')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors border-2 ${
                    settings.twoFactor ? 'bg-blue-600 border-blue-600' : 'bg-gray-200 border-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                      settings.twoFactor ? 'bg-white translate-x-5' : 'bg-gray-500 translate-x-0'
                    }`}
                  />
                </button>
              </div>
              
              <button className="w-full text-left px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50">
                Change Password
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={() => alert('Settings saved!')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}