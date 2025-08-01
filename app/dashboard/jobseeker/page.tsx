'use client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function JobSeekerDashboard() {
  const { data: session } = useSession();

  const stats = [
    { label: 'Applications Sent', value: '12', color: 'bg-blue-500', icon: '📝' },
    { label: 'Profile Views', value: '45', color: 'bg-green-500', icon: '👁️' },
    { label: 'Saved Jobs', value: '8', color: 'bg-purple-500', icon: '❤️' },
    { label: 'Interviews', value: '3', color: 'bg-orange-500', icon: '🎯' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Job Seeker Dashboard</h1>
          <p className="text-gray-600">Welcome back, {session?.user?.name}!</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/jobs" className="block w-full bg-blue-600 text-white text-center py-3 rounded-md hover:bg-blue-700">
                Browse Jobs
              </Link>
              <Link href="/resumes/upload" className="block w-full bg-green-600 text-white text-center py-3 rounded-md hover:bg-green-700">
                📄 Upload Resume
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Applications</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-medium">Frontend Developer</p>
                  <p className="text-sm text-gray-600">Google</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Interview</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recommended Jobs</h3>
            <div className="space-y-3">
              <div className="p-3 border rounded hover:bg-gray-50">
                <p className="font-medium">Software Engineer</p>
                <p className="text-sm text-gray-600">Microsoft • Mumbai</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}