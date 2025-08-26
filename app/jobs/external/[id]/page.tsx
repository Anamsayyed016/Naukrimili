import { notFound } from 'next/navigation';
import Link from 'next/link';

interface ExternalJobPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExternalJobPage({ params }: ExternalJobPageProps) {
  const { id } = await params;
  
  if (!id || !id.startsWith('ext-')) {
    notFound();
  }

  // Mock external job data - you can replace this with real external API calls
  const externalJob = {
    id,
    title: "Senior Software Engineer - Full Stack",
    company: "Innovation Tech Solutions",
    location: "Mumbai, India",
    salary: "₹12-25 LPA",
    description: "We are seeking a talented Senior Software Engineer to join our dynamic team. This role involves developing cutting-edge web applications using modern technologies.",
    skills: ["JavaScript", "React", "Node.js", "Python", "AWS", "Docker", "MongoDB", "TypeScript"],
    jobType: "Full-time",
    experienceLevel: "Senior",
    isRemote: true,
    externalUrl: "https://innovationtech.com/careers",
    companyWebsite: "https://innovationtech.com"
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900">{externalJob.title}</h1>
              <div className="text-gray-600 flex items-center gap-4">
                <span>{externalJob.company}</span>
                <span>•</span>
                <span>{externalJob.location}</span>
              </div>
            </div>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              External Job
            </span>
          </div>

          {/* Salary */}
          {externalJob.salary && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-700 font-semibold">
                💰 {externalJob.salary}
              </span>
            </div>
          )}

          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Job Type:</span>
              <span className="font-medium">{externalJob.jobType}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Experience:</span>
              <span className="font-medium">{externalJob.experienceLevel}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Remote:</span>
              <span className="font-medium">{externalJob.isRemote ? "Yes" : "No"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Source:</span>
              <span className="font-medium">External Platform</span>
            </div>
          </div>

          {/* Skills */}
          {externalJob.skills && externalJob.skills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {externalJob.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="prose max-w-none mb-10">
            <p>{externalJob.description}</p>
            <p className="mt-4 text-gray-600">
              This is an external job posting. Please apply directly through the company's website or the provided application link.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <a
              href={externalJob.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Apply on Company Website
            </a>
            
            <a
              href={externalJob.companyWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Visit Company Website
            </a>

            <Link
              href="/jobs"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-gray-700"
            >
              Back to Jobs
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">About This External Job</h4>
            <p className="text-sm text-gray-600">
              This job posting is sourced from an external platform and is not directly managed by NaukriMili. 
              For the most accurate and up-to-date information, please visit the company's official website or 
              contact them directly. NaukriMili serves as a job aggregator to help you discover opportunities 
              across various platforms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
