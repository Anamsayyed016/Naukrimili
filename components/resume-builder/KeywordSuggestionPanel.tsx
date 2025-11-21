'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X, Plus, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface KeywordSuggestionPanelProps {
  jobTitle?: string;
  industry?: string;
  experienceLevel?: string;
  onKeywordsSelect?: (keywords: string[]) => void;
  className?: string;
}

export default function KeywordSuggestionPanel({
  jobTitle = '',
  industry = '',
  experienceLevel = 'experienced',
  onKeywordsSelect,
  className,
}: KeywordSuggestionPanelProps) {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const fetchKeywords = async () => {
    if (!jobTitle && !industry) {
      toast({
        title: "⚠️ Missing Information",
        description: "Please enter a job title or industry to get keyword suggestions",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/resume-builder/ats-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: jobTitle,
          industry: industry,
          experience_level: experienceLevel,
          summary_input: '',
          skills_input: '',
          experience_input: '',
          education_input: '',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ats_keywords && Array.isArray(data.ats_keywords)) {
          const validKeywords = data.ats_keywords.filter((k: string) => k && k.trim().length > 0);
          setKeywords(validKeywords);
          setShowPanel(true);
          toast({
            title: "✨ Keywords Ready",
            description: `Found ${validKeywords.length} ATS keywords for your resume`,
            duration: 3000,
          });
        } else {
          toast({
            title: "No keywords found",
            description: "Try adding more context about your role",
            duration: 3000,
          });
        }
      } else {
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch keywords:', error);
      toast({
        title: "⚠️ Error",
        description: "Unable to fetch keywords. Please try again later.",
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleKeyword = (keyword: string) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(keyword)) {
      newSelected.delete(keyword);
    } else {
      newSelected.add(keyword);
    }
    setSelectedKeywords(newSelected);
  };

  const addSelectedKeywords = () => {
    const selected = Array.from(selectedKeywords);
    if (selected.length > 0 && onKeywordsSelect) {
      onKeywordsSelect(selected);
      toast({
        title: "✅ Keywords Added",
        description: `Added ${selected.length} keyword${selected.length > 1 ? 's' : ''} to your resume`,
        duration: 2000,
      });
      setSelectedKeywords(new Set());
      setShowPanel(false);
    }
  };

  if (!showPanel && keywords.length === 0) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={fetchKeywords}
        disabled={loading}
        className={cn(
          "flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300",
          "transition-all shadow-sm hover:shadow-md",
          loading && "animate-pulse",
          className
        )}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="hidden sm:inline">Loading Keywords...</span>
            <span className="sm:hidden">Loading...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Get ATS Keywords</span>
            <span className="sm:hidden">Keywords</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <div className={cn("space-y-4 p-5 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl border-2 border-blue-200 shadow-lg", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">ATS Keywords</h3>
            <p className="text-xs text-gray-600">{keywords.length} keywords available</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowPanel(false);
            setSelectedKeywords(new Set());
          }}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded-lg border border-gray-200">
        {keywords.map((keyword, index) => {
          const isSelected = selectedKeywords.has(keyword);
          return (
            <Badge
              key={index}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all px-3 py-1.5 text-sm font-medium",
                isSelected
                  ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-md"
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700",
                "flex items-center gap-1.5"
              )}
              onClick={() => toggleKeyword(keyword)}
            >
              {isSelected && <Check className="w-3 h-3" />}
              {keyword}
            </Badge>
          );
        })}
      </div>

      {selectedKeywords.size > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-blue-200">
          <span className="text-sm text-gray-700">
            {selectedKeywords.size} keyword{selectedKeywords.size > 1 ? 's' : ''} selected
          </span>
          <Button
            type="button"
            onClick={addSelectedKeywords}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Selected
          </Button>
        </div>
      )}
    </div>
  );
}

