'use client';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">🚀 NaukriMili Test Page</h1>
          <p className="text-xl mb-8">If you can see this with colors, Tailwind CSS is working!</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold mb-2">✅ CSS Loading</h3>
              <p className="text-sm opacity-90">Tailwind classes are working</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold mb-2">✅ React Working</h3>
              <p className="text-sm opacity-90">Component is rendering</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold mb-2">✅ Next.js Working</h3>
              <p className="text-sm opacity-90">App router is functioning</p>
            </div>
          </div>
          
          <div className="mt-12 space-x-4">
            <a 
              href="/" 
              className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Go to Home Page
            </a>
            <a 
              href="/jobs" 
              className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Browse Jobs
            </a>
          </div>
        </div>
      </div>
    </div>)}
