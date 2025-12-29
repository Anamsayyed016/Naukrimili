'use client';

import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';

interface LanguagesStepProps {
  formData: Record<string, unknown>;
  updateFormData: (updates: Record<string, unknown>) => void;
}

interface Language {
  language?: string;
  proficiency?: string;
}

export default function LanguagesStep({ formData, updateFormData }: LanguagesStepProps) {
  const languages: Language[] = Array.isArray(formData.languages)
    ? formData.languages
    : [];
  const [aiSuggestions, setAiSuggestions] = useState<{ [key: number]: string[] }>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<{ [key: number]: boolean }>({});
  const debounceTimers = useRef<{ [key: number]: NodeJS.Timeout }>({});

  const addLanguage = () => {
    const newLang: Language = {
      language: '',
      proficiency: 'Intermediate',
    };
    updateFormData({
      languages: [...languages, newLang],
    });
  };

  const updateLanguage = (index: number, field: keyof Language, value: string) => {
    const updated = [...languages];
    updated[index] = { ...updated[index], [field]: value };
    updateFormData({ languages: updated });
  };

  const removeLanguage = (index: number) => {
    const updated = languages.filter((_, i) => i !== index);
    updateFormData({ languages: updated });
    setAiSuggestions(prev => {
      const newSuggestions = { ...prev };
      delete newSuggestions[index];
      return newSuggestions;
    });
  };

  const fetchAISuggestions = async (index: number, value: string) => {
    if (!value || value.trim().length < 1) {
      setAiSuggestions(prev => ({ ...prev, [index]: [] }));
      return;
    }

    if (debounceTimers.current[index]) {
      clearTimeout(debounceTimers.current[index]);
    }

    debounceTimers.current[index] = setTimeout(async () => {
      setLoadingSuggestions(prev => ({ ...prev, [index]: true }));

      try {
        const response = await fetch('/api/ai/form-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field: 'language',
            value,
            context: {
              jobTitle: formData.jobTitle || '',
              skills: Array.isArray(formData.skills) ? formData.skills : []
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.suggestions) {
            setAiSuggestions(prev => ({ ...prev, [index]: data.suggestions }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch AI suggestions:', error);
      } finally {
        setLoadingSuggestions(prev => ({ ...prev, [index]: false }));
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Languages</h2>
        <p className="text-sm text-gray-600">
          List the languages you speak and your proficiency level.
        </p>
      </div>

      <div className="space-y-4">
        {languages.map((lang, index) => (
          <div
            key={index}
            className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex items-center gap-4"
          >
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900">Language</Label>
                <Input
                  placeholder="English"
                  value={lang.language || ''}
                  onChange={(e) => {
                    updateLanguage(index, 'language', e.target.value);
                    fetchAISuggestions(index, e.target.value);
                  }}
                  className="w-full"
                />
                {aiSuggestions[index] && aiSuggestions[index].length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Sparkles className="w-3 h-3" />
                      <span>AI Suggestions:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions[index].slice(0, 3).map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => updateLanguage(index, 'language', suggestion)}
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {loadingSuggestions[index] && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Getting AI suggestions...</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-900">Proficiency</Label>
                <select
                  value={lang.proficiency || 'Intermediate'}
                  onChange={(e) => updateLanguage(index, 'proficiency', e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Native">Native</option>
                  <option value="Fluent">Fluent</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Basic">Basic</option>
                </select>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeLanguage(index)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}

        <Button
          variant="outline"
          onClick={addLanguage}
          className="w-full border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Language
        </Button>
      </div>

      {languages.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-4">No languages added yet.</p>
          <Button variant="outline" onClick={addLanguage}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Language
          </Button>
        </div>
      )}
    </div>
  );
}

