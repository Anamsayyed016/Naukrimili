'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Sparkles, RefreshCw } from 'lucide-react';
import { ResumeBuilderData, ATSScore } from '../types';
import { cn } from '@/lib/utils';

interface ATSOptimizationPanelProps {
  data: ResumeBuilderData;
  onRefresh?: () => void;
}

export default function ATSOptimizationPanel({ data, onRefresh }: ATSOptimizationPanelProps) {
  const [atsScore, setAtsScore] = useState<ATSScore | null>(null);
  const [loading, setLoading] = useState(false);

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
            personalInfo: data.personalInfo,
            experience: data.experience,
            education: data.education,
            skills: data.skills,
            summary: data.personalInfo.summary,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.analysis) {
          setAtsScore({
            score: result.analysis.atsScore || 0,
            suggestions: result.analysis.suggestions || [],
            missingKeywords: result.analysis.missingFields || [],
            improvements: result.analysis.suggestions || [],
            actionVerbs: [],
            formattingIssues: result.analysis.issues || [],
          });
        }
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

    // Basic checks
    if (data.personalInfo.fullName) score += 5;
    if (data.personalInfo.email) score += 5;
    if (data.personalInfo.summary && data.personalInfo.summary.length > 50) score += 10;
    if (data.skills.length > 0) score += 10;
    if (data.experience.length > 0) score += 15;
    if (data.education.length > 0) score += 10;

    // Completeness checks
    if (data.experience.length === 0) suggestions.push('Add work experience');
    if (data.education.length === 0) suggestions.push('Add education details');
    if (data.skills.length < 5) suggestions.push('Add more skills (recommended: 5+)');
    if (!data.personalInfo.summary || data.personalInfo.summary.length < 50) {
      suggestions.push('Expand your professional summary');
    }

    return {
      score: Math.min(score, 100),
      suggestions,
      missingKeywords,
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

  if (!atsScore) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Calculating ATS score...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
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
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">ATS Score</span>
            <Badge className={cn('font-bold', getScoreColor(atsScore.score))}>
              {atsScore.score}/100
            </Badge>
          </div>
          <Progress value={atsScore.score} className="h-2" />
          <p className="text-xs text-gray-500 mt-2">
            {atsScore.score >= 80
              ? 'Excellent! Your resume is highly ATS-friendly.'
              : atsScore.score >= 60
              ? 'Good, but there\'s room for improvement.'
              : 'Your resume needs optimization for ATS systems.'}
          </p>
        </div>

        {/* Suggestions */}
        {atsScore.suggestions.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              Suggestions for Improvement
            </h3>
            <ul className="space-y-2">
              {atsScore.suggestions.slice(0, 5).map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-orange-500 mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Keywords */}
        {atsScore.missingKeywords.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Missing Keywords
            </h3>
            <div className="flex flex-wrap gap-2">
              {atsScore.missingKeywords.slice(0, 8).map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
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
              {data.skills.length > 0 && (
                <li className="text-sm text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Skills section completed
                </li>
              )}
              {data.experience.length > 0 && (
                <li className="text-sm text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  Work experience added
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

