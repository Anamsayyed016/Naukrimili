'use client';
import { useState } from 'react';

export default function JobSeekerSettings() {
  const [settings, setSettings] = useState({
    jobAlerts: true,
    applicationReminders: true,
    profileVisibility: 'public',
    salaryVisibility: false
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
        <h1 className="text-2xl font-bold text-gray-900 mb-8">🔍 Job Seeker Settings</h1>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">🔔</span>
              Job Preferences
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600">🔔</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Job Alerts</h3>
                    <p className="text-sm text-gray-600">Get notified about matching jobs</p>
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

          <div className="flex justify-end">
            <button
              onClick={() => alert('Job Seeker settings saved!')}
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