'use client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

export default function CompanyDashboard() {
  const { data: session } = useSession();
  const [showJobForm, setShowJobForm] = useState(false);

  const stats = [
    { label: 'Active Jobs', value: '8', color: 'bg-blue-500', icon: '💼' },
    { label: 'Applications', value: '156', color: 'bg-green-500', icon: '📋' },
    { label: 'Interviews', value: '23', color: 'bg-purple-500', icon: '🎯' },
    { label: 'Hired', value: '5', color: 'bg-orange-500', icon: '✅' }
  ];

  const handleJobPost = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Job posted successfully!');
    setShowJobForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Company Dashboard</h1>
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
              <button 
                onClick={() => setShowJobForm(true)}
                className="block w-full bg-blue-600 text-white text-center py-3 rounded-md hover:bg-blue-700"
              >
                Post New Job
              </button>
              <Link href="/dashboard/company/applications" className="block w-full border text-center py-3 rounded-md hover:bg-gray-50">
                View Applications
              </Link>
              <Link href="/dashboard/company/jobs" className="block w-full border text-center py-3 rounded-md hover:bg-gray-50">
                Manage Jobs
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Applications</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-sm text-gray-600">Frontend Developer</p>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">New</span>
              </div>
              <div className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-medium">Jane Smith</p>
                  <p className="text-sm text-gray-600">Backend Developer</p>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Reviewed</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Active Jobs</h3>
            <div className="space-y-3">
              <div className="p-3 border rounded">
                <p className="font-medium">Frontend Developer</p>
                <p className="text-sm text-gray-600">25 applications</p>
              </div>
              <div className="p-3 border rounded">
                <p className="font-medium">Backend Developer</p>
                <p className="text-sm text-gray-600">18 applications</p>
              </div>
            </div>
          </div>
        </div>

        {/* Job Posting Modal */}
        {showJobForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Post New Job</h3>
              <form onSubmit={handleJobPost} className="space-y-4">
                <input
                  type="text"
                  placeholder="Job Title"
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
                <textarea
                  placeholder="Job Description"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  required
                />
                <input
                  type="text"
                  placeholder="Location"
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
                <input
                  type="text"
                  placeholder="Salary Range"
                  className="w-full px-3 py-2 border rounded-md"
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                  >
                    Post Job
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowJobForm(false)}
                    className="flex-1 border py-2 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}