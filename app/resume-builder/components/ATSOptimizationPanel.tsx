'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Sparkles, RefreshCw, Lightbulb, TrendingUp } from 'lucide-react';
import { ResumeBuilderData, ATSScore, ExperienceLevel } from '../types';
import { cn } from '@/lib/utils';
import { getMissingKeywords, getKeywordSuggestions, extractKeywords } from '../utils/keywordSuggestions';

interface ATSOptimizationPanelProps {
  data: ResumeBuilderData;
  onRefresh?: () => void;
}

export default function ATSOptimizationPanel({ data, onRefresh }: ATSOptimizationPanelProps) {
  const [atsScore, setAtsScore] = useState<ATSScore | null>(null);
  const [loading, setLoading] = useState(false);
  const experienceLevel = data.experienceLevel || 'mid';

  // Calculate ATS score in real-time
  useEffect(() => {
    calculateATSScore();
  }, [data]);

  const calculateATSScore = async () => {
    setLoading(true);
    try {
      // Call ATS analysis API
      const response = await fetch('/api/resumes/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: {
            fullName: data.personalInfo.fullName,
            contact: {
              email: data.personalInfo.email,
              phone: data.personalInfo.phone,
            },
            summary: data.personalInfo.summary,
            skills: data.skills.map(s => s.name),
            education: data.education.map(edu => ({
              institution: edu.institution,
              degree: edu.degree,
              field: edu.field,
              startDate: edu.startDate,
              endDate: edu.endDate,
            })),
            workExperience: data.experience.map(exp => ({
              jobTitle: exp.position, // API expects 'jobTitle' not 'position'
              company: exp.company,
              startDate: exp.startDate,
              endDate: exp.endDate || (exp.current ? 'Present' : ''),
              responsibilities: exp.description ? [exp.description] : [], // API expects 'responsibilities' array
              achievements: exp.achievements || [],
            })),
            projects: data.projects.map(proj => ({
              name: proj.name,
              description: proj.description, // Removed oneLineDescription - field removed
              technologies: proj.technologies,
              url: proj.url || undefined,
            })),
            certifications: data.certifications.map(cert => ({
              name: cert.name,
              issuer: cert.issuer,
              date: cert.date,
            })),
            languages: data.languages.map(lang => ({
              name: lang.name,
              proficiency: lang.proficiency,
            })),
            achievements: data.achievements.map(ach => ({
              title: ach.title,
              description: ach.description,
              date: ach.date,
            })),
            internships: data.internships.map(int => ({
              company: int.company,
              position: int.position,
              description: int.description,
            })),
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.analysis) {
          // Get missing keywords based on experience level
          const currentSkills = data.skills.map(s => s.name);
          const allText = [
            data.personalInfo.summary,
            ...data.experience.map(e => e.description || ''),
            ...currentSkills,
          ].join(' ');

          const missingKeywords = getMissingKeywords(
            experienceLevel as ExperienceLevel,
            currentSkills,
            allText,
            data.personalInfo.jobTitle // Pass job title for context
          );

          setAtsScore({
            score: result.analysis.atsScore || 0,
            suggestions: result.analysis.suggestions || [],
            missingKeywords: missingKeywords.length > 0 ? missingKeywords : (result.analysis.missingFields || []),
            improvements: result.analysis.suggestions || [],
            actionVerbs: [],
            formattingIssues: result.analysis.issues || [],
          });
        }
      } else {
        // Fallback to calculated score
        setAtsScore(calculateFallbackScore());
      }
    } catch (error) {
      console.error('Error calculating ATS score:', error);
      // Fallback score calculation
      setAtsScore(calculateFallbackScore());
    } finally {
      setLoading(false);
    }
  };

  const calculateFallbackScore = (): ATSScore => {
    let score = 0;
    const suggestions: string[] = [];
    const missingKeywords: string[] = [];

    // Essential fields (50 points)
    if (data.personalInfo.fullName) score += 10;
    if (data.personalInfo.email) score += 10;
    if (data.personalInfo.phone) score += 5;
    if (data.personalInfo.summary && data.personalInfo.summary.length > 50) score += 15;
    if (data.personalInfo.location) score += 5;
    if (data.personalInfo.linkedin) score += 5;

    // Content quality (30 points)
    if (data.skills.length >= 5) score += 15;
    else if (data.skills.length > 0) score += 10;
    if (data.experience.length > 0) score += 8;
    if (data.education.length > 0) score += 4;
    if (data.projects.length > 0) score += 2;
    if (data.certifications.length > 0) score += 1;

    // Keyword optimization (20 points)
    const currentSkills = data.skills.map(s => s.name);
    const allText = [
      data.personalInfo.summary,
      ...data.experience.map(e => e.description || ''),
      ...data.projects.map(p => `${p.name} ${p.description}`),
      ...data.certifications.map(c => `${c.name} ${c.description || ''}`),
      ...data.achievements.map(a => `${a.title} ${a.description || ''}`),
      ...data.internships.map(i => i.description || ''),
      ...currentSkills,
    ].join(' ');

    const extracted = extractKeywords(allText);
    const keywordScore = Math.min(20, (extracted.length / 10) * 20);
    score += keywordScore;

    // Get missing keywords
    const missing = getMissingKeywords(
      experienceLevel as ExperienceLevel,
      currentSkills,
      allText,
      data.personalInfo.jobTitle // Pass job title for context
    );
    missingKeywords.push(...missing);

    // Generate suggestions
    if (data.experience.length === 0) suggestions.push('Add work experience to strengthen your profile');
    if (data.education.length === 0) suggestions.push('Include your educational background');
    if (data.skills.length < 5) suggestions.push(`Add more skills (recommended: 5+). Consider adding ${missing.slice(0, 3).join(', ')}`);
    if (!data.personalInfo.summary || data.personalInfo.summary.length < 50) {
      suggestions.push('Expand your professional summary (aim for 50-200 words)');
    }
    if (data.projects.length === 0 && (data.experienceLevel === 'fresher' || data.experienceLevel === 'entry')) {
      suggestions.push('Add projects to showcase your skills and experience');
    }
    if (data.certifications.length === 0) suggestions.push('Include relevant certifications to boost credibility');
    if (data.languages.length === 0) suggestions.push('Add languages you speak to expand opportunities');
    if (data.achievements.length === 0) suggestions.push('Highlight achievements and awards to stand out');
    if (data.internships.length === 0 && (data.experienceLevel === 'fresher' || data.experienceLevel === 'entry')) {
      suggestions.push('Include internships to demonstrate practical experience');
    }
    if (missingKeywords.length > 0) {
      suggestions.push(`Add industry-relevant keywords: ${missingKeywords.slice(0, 5).join(', ')}`);
    }
    if (!data.personalInfo.linkedin) suggestions.push('Add your LinkedIn profile for better visibility');
    if (!data.personalInfo.phone) suggestions.push('Include your phone number for better contact options');

    return {
      score: Math.min(score, 100),
      suggestions,
      missingKeywords: missingKeywords.slice(0, 10),
      improvements: suggestions,
      actionVerbs: [],
      formattingIssues: [],
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <TrendingUp className="w-5 h-5 text-yellow-600" />;
    return <AlertCircle className="w-5 h-5 text-red-600" />;
  };

  // Get recommended keywords for current experience level
  const recommendedKeywords = useMemo(() => {
    const currentSkills = data.skills.map(s => s.name);
    const allText = [
      data.personalInfo.summary,
      ...data.experience.map(e => e.description || ''),
      ...data.projects.map(p => `${p.name} ${p.description}`),
      ...data.certifications.map(c => `${c.name} ${c.description || ''}`),
      ...data.achievements.map(a => `${a.title} ${a.description || ''}`),
      ...data.internships.map(i => i.description || ''),
      ...currentSkills,
    ].join(' ');

    const missing = getMissingKeywords(
      experienceLevel as ExperienceLevel,
      currentSkills,
      allText
    );

    return getKeywordSuggestions(
      experienceLevel as ExperienceLevel,
      'skill',
      allText,
      8,
      data.personalInfo.jobTitle // Pass job title for context-aware suggestions
    ).filter(k => !currentSkills.includes(k.keyword));
  }, [data, experienceLevel]);

  if (loading && !atsScore) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Analyzing your resume...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!atsScore) {
    return null;
  }

  return (
    <Card className="shadow-lg border-2 border-blue-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            ATS Optimization
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              calculateATSScore();
              onRefresh?.();
            }}
            disabled={loading}
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ATS Score Display */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getScoreIcon(atsScore.score)}
              <span className="text-sm font-medium text-gray-700">ATS Score</span>
            </div>
            <Badge className={cn('font-bold text-base px-3 py-1', getScoreColor(atsScore.score))}>
              {atsScore.score}/100
            </Badge>
          </div>
          <Progress value={atsScore.score} className="h-3 mb-2" />
          <p className="text-xs text-gray-600 mt-2">
            {atsScore.score >= 80
              ? 'Excellent! Your resume is highly ATS-friendly and ready for applications.'
              : atsScore.score >= 60
              ? 'Good foundation, but there\'s room for improvement to maximize your chances.'
              : 'Your resume needs optimization. Follow the suggestions below to improve your ATS score.'}
          </p>
        </div>

        {/* Recommended Keywords */}
        {recommendedKeywords.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Recommended Keywords for {experienceLevel === 'fresher' ? 'Freshers' : experienceLevel === 'entry' ? 'Entry Level' : experienceLevel === 'mid' ? 'Mid-Level' : experienceLevel === 'senior' ? 'Senior' : 'Executive'}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {recommendedKeywords.slice(0, 8).map((keyword, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className={cn(
                    "text-xs cursor-default",
                    keyword.category === 'technical' && "border-blue-200 text-blue-700 bg-blue-50",
                    keyword.category === 'soft' && "border-green-200 text-green-700 bg-green-50"
                  )}
                  title={keyword.description}
                >
                  {keyword.keyword}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Add these keywords to your skills, summary, or experience descriptions to improve ATS matching.
            </p>
          </div>
        )}

        {/* Missing Keywords */}
        {atsScore.missingKeywords.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              Missing Keywords
            </h3>
            <div className="flex flex-wrap gap-2">
              {atsScore.missingKeywords.slice(0, 10).map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs border-orange-200 text-orange-700 bg-orange-50">
                  {keyword}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              These keywords are commonly found in job descriptions for your experience level.
            </p>
          </div>
        )}

        {/* Suggestions */}
        {atsScore.suggestions.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              Suggestions for Improvement
            </h3>
            <ul className="space-y-2">
              {atsScore.suggestions.slice(0, 6).map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strengths */}
        {atsScore.score >= 70 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Your Strengths
            </h3>
            <ul className="space-y-1">
              {data.personalInfo.summary && (
                <li className="text-sm text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Professional summary included
                </li>
              )}
              {data.skills.length >= 5 && (
                <li className="text-sm text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Comprehensive skills section ({data.skills.length} skills)
                </li>
              )}
              {data.experience.length > 0 && (
                <li className="text-sm text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Work experience documented
                </li>
              )}
              {data.education.length > 0 && (
                <li className="text-sm text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Education background included
                </li>
              )}
              {data.projects.length > 0 && (
                <li className="text-sm text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Projects section completed ({data.projects.length} projects)
                </li>
              )}
              {data.certifications.length > 0 && (
                <li className="text-sm text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Certifications added ({data.certifications.length} certifications)
                </li>
              )}
              {data.languages.length > 0 && (
                <li className="text-sm text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Languages included ({data.languages.length} languages)
                </li>
              )}
              {data.achievements.length > 0 && (
                <li className="text-sm text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Achievements highlighted ({data.achievements.length} achievements)
                </li>
              )}
              {data.internships.length > 0 && (
                <li className="text-sm text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Internships documented ({data.internships.length} internships)
                </li>
              )}
              {data.personalInfo.linkedin && (
                <li className="text-sm text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  LinkedIn profile added
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Quick Tips */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            Quick Tips
          </h3>
          <ul className="space-y-1 text-xs text-gray-600">
            <li>• Use industry-standard keywords from job descriptions</li>
            <li>• Quantify achievements with numbers and percentages</li>
            <li>• Keep formatting simple and ATS-friendly</li>
            <li>• Use action verbs to start bullet points</li>
            <li>• Match keywords from job descriptions you're applying to</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
