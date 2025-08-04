'use client';

export default function SimpleHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800">
      {/* Header */}
      <nav className="bg-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="text-2xl font-bold text-blue-600">NaukriMili</div>
            <div className="space-x-4">
              <a href="/jobs" className="text-gray-700 hover:text-blue-600">Jobs</a>
              <a href="/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded-lg">Login</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 text-white text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-6">
            Find Your Dream Job with 
            <span className="text-yellow-300"> AI Power</span>
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Connect with top employers, get AI-powered job recommendations, 
            and accelerate your career growth with NaukriMili.
          </p>
          
          <div className="space-x-4">
            <a 
              href="/jobs" 
              className="inline-block bg-yellow-400 text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors"
            >
              Browse Jobs
            </a>
            <a 
              href="/auth/register" 
              className="inline-block bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Why Choose NaukriMili?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Matching</h3>
              <p className="text-gray-600">Get personalized job recommendations based on your skills and experience.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏢</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Companies</h3>
              <p className="text-gray-600">All companies are screened and verified for authenticity and quality.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Search</h3>
              <p className="text-gray-600">Find jobs faster with our intelligent search and filtering system.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 NaukriMili. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
