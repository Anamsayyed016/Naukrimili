import React from 'react';
import { CircularProgress, Tooltip } from '@/components/ui';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ATSFeedbackProps {
  analysis: {
    match_score: number;
    keyword_analysis: {
      matched_keywords: string[];
      missing_keywords: string[];
      keyword_match_score: number;
    };
    experience_analysis: {
      total_years: number;
      experience_count: number;
    };
    education_analysis: {
      education_level: string[];
      has_education: boolean;
    };
    soft_skills: {
      found: string[];
      score: number;
    };
    format_analysis: {
      length: {
        words: number;
        lines: number;
        is_appropriate_length: boolean;
      };
      has_bullets: boolean;
      sections_found: number;
    };
    recommendations: string[];
  };
}

const ScoreIndicator = ({ score }: { score: number }) => {
  const color = score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500';
  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <CircularProgress 
        value={score} 
        maxValue={100}
        className={`w-full h-full ${color}`}
        strokeWidth={8}
      />
      <div className="absolute flex flex-col items-center">
        <span className={`text-2xl font-bold ${color}`}>{score}%</span>
        <span className="text-sm text-gray-600">ATS Score</span>
      </div>
    </div>
  );
};

const SectionScore = ({ 
  title, 
  score, 
  icon 
}: { 
  title: string; 
  score: number; 
  icon: React.ReactNode;
}) => (
  <Tooltip content={`${score}% match`}>
    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
      <div className={score >= 70 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500'}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <div className="w-full h-2 mt-1 rounded-full bg-gray-200">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  </Tooltip>
);

const ResumeATSFeedback = ({ analysis }: ATSFeedbackProps) => {
  const {
    match_score,
    keyword_analysis,
    soft_skills,
    format_analysis,
    recommendations
  } = analysis;

  return (
    <div className="space-y-6 p-6 bg-white rounded-xl shadow-sm">
      {/* Overall Score */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">ATS Compatibility Score</h3>
          <p className="text-sm text-gray-600">
            How well your resume matches the job requirements
          </p>
        </div>
        <ScoreIndicator score={match_score} />
      </div>

      {/* Detailed Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SectionScore
          title="Keywords Match"
          score={keyword_analysis.keyword_match_score}
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <SectionScore
          title="Soft Skills"
          score={soft_skills.score}
          icon={<AlertCircle className="w-5 h-5" />}
        />
        <SectionScore
          title="Format Score"
          score={format_analysis.is_appropriate_length ? 100 : 60}
          icon={<CheckCircle className="w-5 h-5" />}
        />
      </div>

      {/* Keyword Analysis */}
      <div className="space-y-4">
        <h4 className="font-medium">Keyword Analysis</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h5 className="text-sm font-medium text-green-700 mb-2">
              Matched Keywords ({keyword_analysis.matched_keywords.length})
            </h5>
            <div className="flex flex-wrap gap-2">
              {keyword_analysis.matched_keywords.map((keyword, i) => (
                <span 
                  key={i}
                  className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <h5 className="text-sm font-medium text-red-700 mb-2">
              Missing Keywords ({keyword_analysis.missing_keywords.length})
            </h5>
            <div className="flex flex-wrap gap-2">
              {keyword_analysis.missing_keywords.map((keyword, i) => (
                <span 
                  key={i}
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        <h4 className="font-medium">Recommendations</h4>
        <ul className="space-y-2">
          {recommendations.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ResumeATSFeedback;
