import { useState, useRef } from 'react';
import { AiOutlineUpload } from 'react-icons/ai';

interface ParsedResume {
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
  }>;
}

export default function ResumeManager() {
  const [isParsing, setIsParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setIsParsing(true);
    setProgress(10);
    // Simulate parsing progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 80) {
          clearInterval(interval);
          setIsParsing(false);
          return 80;
        }
        return prev + 10;
      });
    }, 200);
    // TODO: Add AI parsing logic
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6 bg-white rounded-lg shadow w-full max-w-xl mx-auto">
      <h2 className="text-lg sm:text-xl font-bold text-job-seeker-700">Resume Upload</h2>
      <div
        className="border-2 border-dashed border-job-seeker-300 flex flex-col items-center justify-center py-8 px-2 sm:px-6 rounded-lg cursor-pointer transition hover:border-job-seeker-500 min-h-[180px] w-full"
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        <AiOutlineUpload className="text-job-seeker-400 text-4xl mb-2" />
        <p className="text-sm sm:text-base text-gray-600 mb-2">Drop resume here or click to upload (PDF/DOCX)</p>
        <input
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <progress
          value={progress}
          max={100}
          className="h-2 w-full mt-4 bg-gray-200 rounded"
        />
        {isParsing && <span className="text-xs text-job-seeker-500 mt-2">Parsing with AI...</span>}
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
        <span className="text-xs text-gray-500">Profile completion:</span>
        <span className="font-semibold text-job-seeker-700">{progress}%</span>
      </div>
    </div>
  );
} 