"use client";

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { hasItems } from '@/lib/safe-array-utils';

interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    summary: string;
  };
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa: string;
    description: string;
  }>;
  experience: Array<{
    id: string;
    company: string;
    position: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
  skills: Array<{
    id: string;
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string[];
    url: string;
    startDate: string;
    endDate: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    url: string;
  }>;
}

interface ResumePreviewProps {
  data: ResumeData;
  template: string;
  colorScheme: string;
  className?: string;
}

export default function ResumePreview({ data, template, colorScheme, className = '' }: ResumePreviewProps) {
  const getColorClasses = () => {
    switch (colorScheme) {
      case 'blue':
        return 'text-blue-600 border-blue-600';
      case 'green':
        return 'text-green-600 border-green-600';
      case 'purple':
        return 'text-purple-600 border-purple-600';
      case 'gray':
        return 'text-gray-600 border-gray-600';
      case 'black':
        return 'text-black border-black';
      case 'navy':
        return 'text-blue-800 border-blue-800';
      case 'brown':
        return 'text-amber-700 border-amber-700';
      case 'orange':
        return 'text-orange-600 border-orange-600';
      case 'teal':
        return 'text-teal-600 border-teal-600';
      case 'pink':
        return 'text-pink-600 border-pink-600';
      case 'charcoal':
        return 'text-gray-800 border-gray-800';
      case 'burgundy':
        return 'text-red-800 border-red-800';
      case 'gold':
        return 'text-yellow-600 border-yellow-600';
      default:
        return 'text-blue-600 border-blue-600';
    }
  };

  const colorClasses = getColorClasses();

  return (
    <Card className={`bg-white shadow-lg ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center border-b pb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {data.personalInfo.fullName || 'Your Name'}
            </h1>
            <p className="text-gray-600">
              {data.personalInfo.email || 'email@example.com'}
            </p>
            <p className="text-gray-600">
              {data.personalInfo.phone && `${data.personalInfo.phone} • `}
              {data.personalInfo.location || 'Location'}
            </p>
            {data.personalInfo.linkedin && (
              <p className="text-gray-600">
                {data.personalInfo.linkedin}
              </p>
            )}
          </div>

          {/* Summary */}
          {data.personalInfo.summary && (
            <div>
              <h2 className={`text-lg font-semibold ${colorClasses} mb-2`}>
                Professional Summary
              </h2>
              <p className="text-gray-700 leading-relaxed">{data.personalInfo.summary}</p>
            </div>
          )}

          {/* Experience */}
          {hasItems(data.experience) && (
            <div>
              <h2 className={`text-lg font-semibold ${colorClasses} mb-3`}>
                Professional Experience
              </h2>
              <div className="space-y-4">
                {data.experience.map((exp) => (
                  <div key={exp.id} className="border-l-4 border-gray-200 pl-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                        <p className="text-gray-600 font-medium">{exp.company}</p>
                        {exp.location && (
                          <p className="text-sm text-gray-500">{exp.location}</p>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 whitespace-nowrap">
                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                      </p>
                    </div>
                    {exp.description && (
                      <p className="text-gray-700 text-sm leading-relaxed">{exp.description}</p>
                    )}
                    {hasItems(exp.achievements) && (
                      <ul className="mt-2 space-y-1">
                        {exp.achievements.map((achievement, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {hasItems(data.education) && (
            <div>
              <h2 className={`text-lg font-semibold ${colorClasses} mb-3`}>
                Education
              </h2>
              <div className="space-y-3">
                {data.education.map((edu) => (
                  <div key={edu.id} className="border-l-4 border-gray-200 pl-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {edu.degree} in {edu.field}
                        </h3>
                        <p className="text-gray-600">{edu.institution}</p>
                        {edu.gpa && (
                          <p className="text-sm text-gray-500">GPA: {edu.gpa}</p>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 whitespace-nowrap">
                        {edu.startDate} - {edu.endDate}
                      </p>
                    </div>
                    {edu.description && (
                      <p className="text-gray-700 text-sm mt-1">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {hasItems(data.skills) && (
            <div>
              <h2 className={`text-lg font-semibold ${colorClasses} mb-3`}>
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill) => (
                  <Badge key={skill.id} variant="outline" className="text-sm">
                    {skill.name} ({skill.level})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {hasItems(data.projects) && (
            <div>
              <h2 className={`text-lg font-semibold ${colorClasses} mb-3`}>
                Projects
              </h2>
              <div className="space-y-3">
                {data.projects.map((project) => (
                  <div key={project.id} className="border-l-4 border-gray-200 pl-4">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-500">
                        {project.startDate} - {project.endDate}
                      </p>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">{project.description}</p>
                    {hasItems(project.technologies) && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {project.technologies.map((tech, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {project.url && (
                      <a 
                        href={project.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Project →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {hasItems(data.certifications) && (
            <div>
              <h2 className={`text-lg font-semibold ${colorClasses} mb-3`}>
                Certifications
              </h2>
              <div className="space-y-2">
                {data.certifications.map((cert) => (
                  <div key={cert.id} className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{cert.name}</h3>
                      <p className="text-sm text-gray-600">{cert.issuer}</p>
                    </div>
                    <p className="text-sm text-gray-500">{cert.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
