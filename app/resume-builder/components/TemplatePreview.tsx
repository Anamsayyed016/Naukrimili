'use client';

import { TemplateStyle } from '../types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface TemplatePreviewProps {
  template: TemplateStyle;
  data: {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
    skills: string[];
    experience: Array<{
      position: string;
      company: string;
      location: string;
      startDate: string;
      endDate: string;
      current: boolean;
      bullets: string[];
    }>;
    education: Array<{
      degree: string;
      field: string;
      institution: string;
      location: string;
      date: string;
    }>;
  };
  colorScheme: string;
  isRecommended?: boolean;
}

export default function TemplatePreview({
  template,
  data,
  colorScheme,
  isRecommended,
}: TemplatePreviewProps) {
  const colorMap: Record<string, { bg: string; text: string; border: string; hex: string }> = {
    blue: { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600', hex: '#2563eb' },
    green: { bg: 'bg-green-600', text: 'text-green-600', border: 'border-green-600', hex: '#16a34a' },
    purple: { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-600', hex: '#9333ea' },
    gray: { bg: 'bg-gray-600', text: 'text-gray-600', border: 'border-gray-600', hex: '#6b7280' },
    navy: { bg: 'bg-blue-800', text: 'text-blue-800', border: 'border-blue-800', hex: '#1e3a8a' },
    teal: { bg: 'bg-teal-600', text: 'text-teal-600', border: 'border-teal-600', hex: '#14b8a6' },
    black: { bg: 'bg-black', text: 'text-black', border: 'border-black', hex: '#000000' },
    orange: { bg: 'bg-orange-600', text: 'text-orange-600', border: 'border-orange-600', hex: '#ea580c' },
  };

  const colors = colorMap[colorScheme] || colorMap.blue;

  // Two-column template (Creative style with sidebar)
  if (template === 'creative') {
    return (
      <div className="w-full aspect-[3/4] min-h-[320px] sm:min-h-[350px] md:min-h-[380px] lg:min-h-[400px] xl:min-h-[420px] max-h-[450px] p-3 sm:p-4 md:p-5 lg:p-6 bg-white overflow-hidden" style={{ fontSize: 'clamp(8px, 1.4vw, 11px)', lineHeight: '1.4' }}>
        <div className="h-full flex border border-gray-300 rounded overflow-hidden">
          {/* Left Sidebar */}
          <div className={cn('w-1/3 p-3 text-white', colors.bg)}>
            {/* Profile Placeholder */}
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/30" />
            </div>
            <h2 className="text-lg font-bold mb-1 text-center uppercase">{data.fullName}</h2>
            <p className="text-xs text-center mb-4 opacity-90">{data.jobTitle}</p>
            
            <div className="space-y-3 text-xs">
              <div>
                <h3 className="font-bold mb-1 text-sm">CONTACT</h3>
                <p className="opacity-90">{data.location}</p>
                <p className="opacity-90">{data.phone}</p>
                <p className="opacity-90">{data.email}</p>
              </div>
              
              <div>
                <h3 className="font-bold mb-1 text-sm">SKILLS</h3>
                <ul className="space-y-1">
                  {data.skills.slice(0, 4).map((skill, i) => (
                    <li key={i} className="opacity-90">• {skill}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 p-3 bg-white">
            <div className="mb-3">
              <h3 className={cn('font-bold mb-1 text-xs uppercase', colors.text)}>SUMMARY</h3>
              <p className="text-xs text-gray-700 leading-tight">{data.summary.substring(0, 120)}...</p>
            </div>

            <div className="mb-3">
              <h3 className={cn('font-bold mb-1 text-xs uppercase', colors.text)}>EXPERIENCE</h3>
              <div className="mb-2">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="font-semibold text-xs">{data.experience[0].position}</p>
                    <p className="text-xs text-gray-600">{data.experience[0].company}</p>
                  </div>
                  <p className="text-xs text-gray-500">{data.experience[0].startDate} - {data.experience[0].endDate}</p>
                </div>
                <ul className="space-y-0.5 ml-2">
                  {data.experience[0].bullets.slice(0, 2).map((bullet, i) => (
                    <li key={i} className="text-xs text-gray-700">• {bullet.substring(0, 60)}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className={cn('font-bold mb-1 text-xs uppercase', colors.text)}>EDUCATION</h3>
              <p className="text-xs font-semibold">{data.education[0].degree}: {data.education[0].field}</p>
              <p className="text-xs text-gray-600">{data.education[0].institution}</p>
              <p className="text-xs text-gray-500">{data.education[0].date}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Modern/Executive style - Single column with colored header
  if (template === 'modern' || template === 'executive') {
    return (
      <div className="w-full aspect-[3/4] min-h-[320px] sm:min-h-[350px] md:min-h-[380px] lg:min-h-[400px] xl:min-h-[420px] max-h-[450px] p-3 sm:p-4 md:p-5 lg:p-6 bg-white overflow-hidden" style={{ fontSize: 'clamp(8px, 1.4vw, 11px)', lineHeight: '1.4' }}>
        <div className="h-full border border-gray-300 rounded overflow-hidden">
          {/* Colored Header */}
          <div className={cn('p-3 text-white', colors.bg)}>
            <h1 className="text-lg font-bold mb-1 uppercase">{data.fullName}</h1>
            <p className="text-xs opacity-90">{data.jobTitle}</p>
          </div>

          {/* White Content Area */}
          <div className="p-3 bg-white">
            {/* Contact Info */}
            <div className="flex flex-wrap gap-x-2 text-xs text-gray-600 mb-3 pb-2 border-b">
              <span>{data.location}</span>
              <span>•</span>
              <span>{data.phone}</span>
              <span>•</span>
              <span>{data.email}</span>
            </div>

            {/* Summary */}
            <div className="mb-3">
              <h2 className={cn('font-bold mb-1 text-xs uppercase', colors.text)}>SUMMARY</h2>
              <p className="text-xs text-gray-700 leading-tight">{data.summary.substring(0, 120)}...</p>
            </div>

            {/* Skills */}
            <div className="mb-3">
              <h2 className={cn('font-bold mb-1 text-xs uppercase', colors.text)}>SKILLS</h2>
              <div className="flex flex-wrap gap-1">
                {data.skills.slice(0, 5).map((skill, i) => (
                  <span key={i} className="text-xs text-gray-700">• {skill}</span>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="mb-3">
              <h2 className={cn('font-bold mb-1 text-xs uppercase', colors.text)}>EXPERIENCE</h2>
              <div>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <p className="font-semibold text-xs">{data.experience[0].position}</p>
                    <p className="text-xs text-gray-600">{data.experience[0].company}</p>
                  </div>
                  <p className="text-xs text-gray-500">{data.experience[0].startDate} - {data.experience[0].endDate}</p>
                </div>
                <ul className="space-y-0.5 ml-2">
                  {data.experience[0].bullets.slice(0, 2).map((bullet, i) => (
                    <li key={i} className="text-xs text-gray-700">• {bullet.substring(0, 55)}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Education */}
            <div>
              <h2 className={cn('font-bold mb-1 text-xs uppercase', colors.text)}>EDUCATION</h2>
              <p className="text-xs font-semibold">{data.education[0].degree}: {data.education[0].field}</p>
              <p className="text-xs text-gray-600">{data.education[0].institution}</p>
              <p className="text-xs text-gray-500">{data.education[0].date}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Single-column template (Traditional/Corporate/Minimal/Fresher-Friendly style)
  return (
    <div className="w-full aspect-[3/4] min-h-[320px] sm:min-h-[350px] md:min-h-[380px] lg:min-h-[400px] xl:min-h-[420px] max-h-[450px] p-3 sm:p-4 md:p-5 lg:p-6 bg-white overflow-hidden" style={{ fontSize: 'clamp(8px, 1.4vw, 11px)', lineHeight: '1.4' }}>
      <div className="h-full border border-gray-300 rounded p-3">
        {/* Header */}
        <div className="text-center mb-3 border-b pb-2">
          <h1 className="text-xl font-bold mb-1 uppercase">{data.fullName}</h1>
          <p className="text-xs text-gray-600 uppercase">{data.jobTitle}</p>
          <div className="flex flex-wrap justify-center gap-x-2 text-xs text-gray-600 mt-1">
            <span>{data.location}</span>
            <span>•</span>
            <span>{data.phone}</span>
            <span>•</span>
            <span>{data.email}</span>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-3">
          <h2 className={cn('font-bold mb-1 text-xs uppercase border-b pb-0.5', colors.text, colors.border)}>
            PROFESSIONAL SUMMARY
          </h2>
          <p className="text-xs text-gray-700 leading-tight">{data.summary.substring(0, 150)}...</p>
        </div>

        {/* Skills */}
        <div className="mb-3">
          <h2 className={cn('font-bold mb-1 text-xs uppercase border-b pb-0.5', colors.text, colors.border)}>SKILLS</h2>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            {data.skills.slice(0, 6).map((skill, i) => (
              <p key={i} className="text-xs text-gray-700">• {skill}</p>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="mb-3">
          <h2 className={cn('font-bold mb-1 text-xs uppercase border-b pb-0.5', colors.text, colors.border)}>
            WORK HISTORY
          </h2>
          <div>
            <div className="flex justify-between items-start mb-1">
              <div>
                <p className="font-semibold text-xs">{data.experience[0].position} | {data.experience[0].company}</p>
                <p className="text-xs text-gray-600">{data.experience[0].location}</p>
              </div>
              <p className="text-xs text-gray-500">{data.experience[0].startDate} - {data.experience[0].endDate}</p>
            </div>
            <ul className="space-y-0.5 ml-2">
              {data.experience[0].bullets.slice(0, 2).map((bullet, i) => (
                <li key={i} className="text-xs text-gray-700">• {bullet.substring(0, 70)}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Education */}
        <div>
          <h2 className={cn('font-bold mb-1 text-xs uppercase border-b pb-0.5', colors.text, colors.border)}>
            EDUCATION
          </h2>
          <p className="text-xs font-semibold">{data.education[0].degree}: {data.education[0].field}</p>
          <p className="text-xs text-gray-600">{data.education[0].institution} | {data.education[0].location}</p>
          <p className="text-xs text-gray-500">{data.education[0].date}</p>
        </div>
      </div>
    </div>
  );
}

