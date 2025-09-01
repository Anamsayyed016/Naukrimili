"use client";

import { useState } from 'react';
import Link from 'next/link';
import { User, Building2, ArrowRight, Sparkles, Briefcase } from 'lucide-react';

interface RoleSelectionProps {
  onRoleSelect: (role: 'jobseeker' | 'employer') => void;
}

export default function RoleSelection({ onRoleSelect }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<'jobseeker' | 'employer' | null>(null);

  const handleRoleSelect = (role: 'jobseeker' | 'employer') => {
    setSelectedRole(role);
    onRoleSelect(role);
  };

  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium text-gray-700 mb-6 shadow-lg">
          <Sparkles className="w-4 h-4 text-blue-600" />
          Choose Your Path
        </div>
      </div>
      
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
        How would you like to use NaukriMili?
      </h2>
      
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Select your role to get started with the right features and tools
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Job Seeker Card */}
        <div 
          className={`group cursor-pointer p-8 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
            selectedRole === 'jobseeker' 
              ? 'border-blue-500 bg-blue-50 shadow-lg' 
              : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
          }`}
          onClick={() => handleRoleSelect('jobseeker')}
        >
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">I'm a Job Seeker</h3>
          <p className="text-gray-600 mb-6">
            Find your dream job, upload your resume, and get matched with opportunities
          </p>
          <ul className="text-sm text-gray-600 space-y-2 mb-6 text-left">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              AI-powered job matching
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Resume upload & analysis
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Track applications
            </li>
          </ul>
          <div className="flex items-center justify-center gap-2 text-blue-600 font-medium">
            Get Started <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Employer Card */}
        <div 
          className={`group cursor-pointer p-8 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
            selectedRole === 'employer' 
              ? 'border-green-500 bg-green-50 shadow-lg' 
              : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-lg'
          }`}
          onClick={() => handleRoleSelect('employer')}
        >
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
            <Building2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">I'm an Employer</h3>
          <p className="text-gray-600 mb-6">
            Post jobs, find talent, and manage your hiring process efficiently
          </p>
          <ul className="text-sm text-gray-600 space-y-2 mb-6 text-left">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Post job openings
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Review applications
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Manage company profile
            </li>
          </ul>
          <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
            Get Started <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
