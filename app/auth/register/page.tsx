"use client";

import React from 'react';
import Link from 'next/link';
import { UserCheck, Building2, Search, Briefcase, Users, Target, FileText } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-4xl font-extrabold text-gray-900">
            Choose Your Account Type
          </h2>
          <p className="mt-2 text-lg text-gray-600">
            Select the type of account that best fits your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Job Seeker Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Job Seeker</h3>
              <p className="text-gray-600">Find your dream job and grow your career</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <Search className="w-5 h-5 text-blue-500" />
                <span className="text-gray-700">Search and apply to jobs</span>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="text-gray-700">Upload and manage resumes</span>
              </div>
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-blue-500" />
                <span className="text-gray-700">Set job preferences</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-gray-700">Connect with employers</span>
              </div>
            </div>

            <Link
              href="/auth/register/jobseeker"
              className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 transform hover:scale-105"
            >
              Create Job Seeker Account
            </Link>
          </div>

          {/* Employer Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-emerald-100 hover:border-emerald-300 transition-all duration-300 hover:shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Employer</h3>
              <p className="text-gray-600">Post jobs and find the best talent</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <Briefcase className="w-5 h-5 text-emerald-500" />
                <span className="text-gray-700">Post and manage job openings</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-emerald-500" />
                <span className="text-gray-700">Browse candidate profiles</span>
              </div>
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-emerald-500" />
                <span className="text-gray-700">Set hiring requirements</span>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-emerald-500" />
                <span className="text-gray-700">Manage applications</span>
              </div>
            </div>

            <Link
              href="/auth/register/employer"
              className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl text-lg font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200 transform hover:scale-105"
            >
              Create Company Account
            </Link>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        {/* Features Comparison */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-12">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Why Choose NaukriMili?</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Smart Job Matching</h4>
              <p className="text-gray-600">AI-powered job recommendations based on your skills and preferences</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Verified Profiles</h4>
              <p className="text-gray-600">All users and companies are verified for authenticity and quality</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Direct Communication</h4>
              <p className="text-gray-600">Connect directly with employers and candidates without intermediaries</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
