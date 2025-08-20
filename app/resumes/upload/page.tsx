import ResumeUpload from '@/components/resume/ResumeUpload';

export default function ResumeUploadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Upload Your Resume
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your resume and we'll automatically fill your profile with AI-powered analysis
          </p>
        </div>
        
        <ResumeUpload />
      </div>
    </div>
  );
}
