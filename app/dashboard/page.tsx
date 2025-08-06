'use client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>)}

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
          <Link href="/auth/login" className="text-blue-600 hover:text-blue-500">
            Go to login
          </Link>
        </div>
      </div>)}

  const stats = [
    { label: 'Applications Sent', value: '12', color: 'bg-blue-500' },
    { label: 'Profile Views', value: '45', color: 'bg-green-500' },
    { label: 'Saved Jobs', value: '8', color: 'bg-purple-500' },
    { label: 'Interviews', value: '3', color: 'bg-orange-500' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session?.user?.name || session?.user?.email}!
          </h1>
          <p className="text-gray-600">Here's your job search overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <span className="text-white font-bold text-lg">{stat.value}</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/jobs" className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700">
                Browse Jobs
              </Link>
              <Link href="/resumes" className="block w-full border border-gray-300 text-gray-700 text-center py-2 px-4 rounded-md hover:bg-gray-50">
                Upload Resume
              </Link>
              <Link href="/companies" className="block w-full border border-gray-300 text-gray-700 text-center py-2 px-4 rounded-md hover:bg-gray-50">
                View Companies
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Applications</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">Frontend Developer</p>
                  <p className="text-sm text-gray-600">Google</p>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Pending</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">React Developer</p>
                  <p className="text-sm text-gray-600">Microsoft</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Interview</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Jobs</h3>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">Software Engineer</p>
                <p className="text-sm text-gray-600">Amazon • Mumbai</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Full Stack Developer</p>
                <p className="text-sm text-gray-600">Flipkart • Bangalore</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>)}