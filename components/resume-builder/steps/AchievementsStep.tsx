'use client';

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X, Sparkles, Loader2 } from 'lucide-react';

interface AchievementsStepProps {
  formData: Record<string, unknown>;
  updateFormData: (updates: Record<string, unknown>) => void;
}

export default function AchievementsStep({ formData, updateFormData }: AchievementsStepProps) {
  const [newAchievement, setNewAchievement] = useState('');
  const achievements: string[] = Array.isArray(formData.achievements)
    ? formData.achievements
    : [];
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const addAchievement = () => {
    if (newAchievement.trim() && !achievements.includes(newAchievement.trim())) {
      updateFormData({
        achievements: [...achievements, newAchievement.trim()],
      });
      setNewAchievement('');
    }
  };

  const removeAchievement = (index: number) => {
    const updated = achievements.filter((_, i) => i !== index);
    updateFormData({ achievements: updated });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAchievement();
    }
  };

  const fetchAISuggestions = async (value: string) => {
    if (!value || value.trim().length < 2) {
      setAiSuggestions([]);
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      setLoadingSuggestions(true);

      try {
        const response = await fetch('/api/ai/form-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field: 'achievement',
            value,
            context: {
              jobTitle: formData.jobTitle || '',
              skills: Array.isArray(formData.skills) ? formData.skills : [],
              experienceLevel: formData.experienceLevel || 'mid-level',
              industry: formData.industry || ''
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.suggestions) {
            setAiSuggestions(data.suggestions);
          }
        }
      } catch (error) {
        console.error('Failed to fetch AI suggestions:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Achievements</h2>
        <p className="text-sm text-gray-600">
          List your notable achievements, awards, and recognitions.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Employee of the Year 2023"
              value={newAchievement}
              onChange={(e) => {
                setNewAchievement(e.target.value);
                fetchAISuggestions(e.target.value);
              }}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={addAchievement} type="button">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
          {aiSuggestions.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Sparkles className="w-3 h-3" />
                <span>AI Suggestions:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {aiSuggestions.slice(0, 4).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setNewAchievement(suggestion);
                      setAiSuggestions([]);
                    }}
                    className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          {loadingSuggestions && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Getting AI suggestions...</span>
            </div>
          )}
        </div>

        {achievements.length > 0 && (
          <div className="space-y-2">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 rounded-lg border border-gray-200 p-3"
              >
                <span className="text-sm text-gray-900">{achievement}</span>
                <button
                  onClick={() => removeAchievement(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-colors"
                  aria-label={`Remove ${achievement}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {achievements.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No achievements added yet. Start adding your achievements above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

