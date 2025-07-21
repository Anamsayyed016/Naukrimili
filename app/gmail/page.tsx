import GmailIntegration from '@/components/GmailIntegration';

export default function GmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Gmail Integration
          </h1>
          <p className="text-gray-600 text-lg">
            Seamlessly manage your emails directly from the job portal
          </p>
        </div>
        
        <GmailIntegration />
      </div>
    </div>
  );
} 