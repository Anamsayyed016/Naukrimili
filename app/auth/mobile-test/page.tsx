import MobileAuthTest from '@/components/auth/MobileAuthTest';

export default function MobileAuthTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mobile Authentication Test
          </h1>
          <p className="text-gray-600">
            Test and debug mobile authentication functionality
          </p>
        </div>
        
        <MobileAuthTest />
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Use this page to test mobile authentication on various devices and browsers.
          </p>
          <p className="mt-2">
            Check the console for detailed authentication logs and error information.
          </p>
        </div>
      </div>
    </div>
  );
}
