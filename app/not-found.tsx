import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative text-center px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">N</span>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              NaukriMili
            </span>
          </Link>
        </div>

        {/* 404 Content */}
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md mx-auto border border-gray-100">
          <div className="text-8xl font-bold text-gray-300 mb-4">404</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-8">
            Oops! The page you're looking for seems to have wandered off. 
            Don't worry, let's get you back on track to finding your dream job!
          </p>
          
          {/* Action Buttons */}
          <div className="space-y-4">
            <Link 
              href="/"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 inline-flex items-center justify-center"
            >
              <Home className="mr-2 h-5 w-5" />
              Back to Home
            </Link>
            
            <Link 
              href="/jobs"
              className="w-full border-2 border-blue-600 text-blue-600 py-3 px-6 rounded-xl font-semibold hover:bg-blue-50 transition-all inline-flex items-center justify-center"
            >
              <Search className="mr-2 h-5 w-5" />
              Search Jobs
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Or try one of these popular pages:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/jobs" className="text-blue-600 hover:text-blue-800 font-medium">
              Browse Jobs
            </Link>
            <Link href="/companies" className="text-blue-600 hover:text-blue-800 font-medium">
              Top Companies
            </Link>
            <Link href="/auth/register" className="text-blue-600 hover:text-blue-800 font-medium">
              Create Account
            </Link>
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
