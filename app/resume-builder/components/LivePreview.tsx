'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResumeBuilderData } from '../types';
import TemplatePreview from './TemplatePreview';
import { cn } from '@/lib/utils';

interface LivePreviewProps {
  data: ResumeBuilderData;
  className?: string;
}

export default function LivePreview({ data, className }: LivePreviewProps) {
  // Convert ResumeBuilderData to TemplatePreview data format
  const previewData = {
    fullName: data.personalInfo.fullName || 'Your Name',
    jobTitle: data.experience.length > 0 ? data.experience[0].position : 'Your Title',
    email: data.personalInfo.email || '',
    phone: data.personalInfo.phone || '',
    location: data.personalInfo.location || '',
    summary: data.personalInfo.summary || '',
    skills: data.skills.map(s => s.name),
    experience: data.experience.map(exp => ({
      position: exp.position,
      company: exp.company,
      location: exp.location || '',
      startDate: exp.startDate,
      endDate: exp.endDate || 'Present',
      current: exp.current,
      bullets: exp.description ? [exp.description] : (exp.achievements || []),
    })),
    education: data.education.map(edu => ({
      degree: edu.degree,
      field: edu.field,
      institution: edu.institution,
      location: '',
      date: `${edu.startDate} - ${edu.endDate || 'Present'}`,
    })),
  };

  const colorClasses = {
    blue: 'text-blue-600 border-blue-600',
    green: 'text-green-600 border-green-600',
    purple: 'text-purple-600 border-purple-600',
    gray: 'text-gray-600 border-gray-600',
    navy: 'text-blue-800 border-blue-800',
    teal: 'text-teal-600 border-teal-600',
  };

  const colorClass = colorClasses[data.template.colorScheme as keyof typeof colorClasses] || colorClasses.blue;

  // Use TemplatePreview for actual template rendering, or fallback to simple preview
  if (data.template.style) {
    return (
      <div className={cn('w-full', className)}>
        <TemplatePreview
          template={data.template.style}
          data={previewData}
          colorScheme={data.template.colorScheme}
        />
      </div>
    );
  }

  // Fallback to simple preview if no template selected
  return (
    <Card className={cn('bg-white shadow-lg print:shadow-none', className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center border-b pb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {data.personalInfo.fullName || 'Your Name'}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-600">
              {data.personalInfo.email && <span>{data.personalInfo.email}</span>}
              {data.personalInfo.phone && (
                <>
                  <span>•</span>
                  <span>{data.personalInfo.phone}</span>
                </>
              )}
              {data.personalInfo.location && (
                <>
                  <span>•</span>
                  <span>{data.personalInfo.location}</span>
                </>
              )}
              {data.personalInfo.linkedin && (
                <>
                  <span>•</span>
                  <span className="text-blue-600">{data.personalInfo.linkedin}</span>
                </>
              )}
            </div>
          </div>

          {/* Summary */}
          {data.personalInfo.summary && (
            <div>
              <h2 className={cn('text-lg font-semibold mb-2 border-b pb-1', colorClass)}>
                Professional Summary
              </h2>
              <p className="text-gray-700 text-sm leading-relaxed">{data.personalInfo.summary}</p>
            </div>
          )}

          {/* Skills */}
          {data.skills.length > 0 && (
            <div>
              <h2 className={cn('text-lg font-semibold mb-2 border-b pb-1', colorClass)}>
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill) => (
                  <Badge key={skill.id} variant="outline" className="text-xs">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {data.experience.length > 0 && (
            <div>
              <h2 className={cn('text-lg font-semibold mb-3 border-b pb-1', colorClass)}>
                Professional Experience
              </h2>
              <div className="space-y-4">
                {data.experience.map((exp) => (
                  <div key={exp.id} className="border-l-4 border-gray-200 pl-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                        <p className="text-gray-600 font-medium">{exp.company}</p>
                        {exp.location && <p className="text-sm text-gray-500">{exp.location}</p>}
                      </div>
                      <p className="text-sm text-gray-500 whitespace-nowrap">
                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate || 'Present'}
                      </p>
                    </div>
                    {exp.description && (
                      <p className="text-gray-700 text-sm leading-relaxed">{exp.description}</p>
                    )}
                    {exp.achievements.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {exp.achievements.map((achievement, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start">
                            <span className={cn('mr-2 mt-1', colorClass)}>•</span>
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
          {data.education.length > 0 && (
            <div>
              <h2 className={cn('text-lg font-semibold mb-3 border-b pb-1', colorClass)}>
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
                        {edu.gpa && <p className="text-sm text-gray-500">GPA: {edu.gpa}</p>}
                      </div>
                      <p className="text-sm text-gray-500 whitespace-nowrap">
                        {edu.startDate} - {edu.endDate || 'Present'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {data.projects.length > 0 && (
            <div>
              <h2 className={cn('text-lg font-semibold mb-3 border-b pb-1', colorClass)}>
                Projects
              </h2>
              <div className="space-y-3">
                {data.projects.map((project) => (
                  <div key={project.id} className="border-l-4 border-gray-200 pl-4">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      {(project.startDate || project.endDate) && (
                        <p className="text-sm text-gray-500">
                          {project.startDate} - {project.endDate || 'Present'}
                        </p>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm mb-2">{project.description}</p>
                    {project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.map((tech, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {data.certifications.length > 0 && (
            <div>
              <h2 className={cn('text-lg font-semibold mb-3 border-b pb-1', colorClass)}>
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

