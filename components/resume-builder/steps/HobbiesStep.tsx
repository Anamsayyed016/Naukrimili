'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X, Sparkles, Loader2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface HobbiesStepProps {
  formData: Record<string, unknown>;
  updateFormData: (
    updates:
      | Record<string, unknown>
      | ((prev: Record<string, unknown>) => Record<string, unknown>)
  ) => void;
}

export default function HobbiesStep({ formData, updateFormData }: HobbiesStepProps) {
  const [newHobby, setNewHobby] = useState('');
  const hobbies: string[] = Array.isArray(formData.hobbies)
    ? formData.hobbies
    : [];
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const debouncedHobby = useDebounce(newHobby, 300);
  const formDataRef = useRef(formData);
  const fetchGenerationRef = useRef(0);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const addHobby = () => {
    const value = newHobby.trim();
    if (!value) return;
    updateFormData((prev) => {
      const current = Array.isArray(prev.hobbies)
        ? prev.hobbies.filter((h): h is string => typeof h === 'string')
        : [];
      if (current.includes(value)) return {};
      return { hobbies: [...current, value] };
    });
    setNewHobby('');
  };

  const removeHobby = (index: number) => {
    updateFormData((prev) => {
      const current = Array.isArray(prev.hobbies)
        ? prev.hobbies.filter((h): h is string => typeof h === 'string')
        : [];
      return { hobbies: current.filter((_, i) => i !== index) };
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addHobby();
    }
  };

  useEffect(() => {
    const trimmed = debouncedHobby.trim();
    if (!trimmed || trimmed.length < 2) {
      setLoadingSuggestions(false);
      return;
    }

    const generation = ++fetchGenerationRef.current;
    setLoadingSuggestions(true);

    (async () => {
      try {
        const latestFormData = formDataRef.current;
        const response = await fetch('/api/ai/form-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            field: 'hobbies',
            value: trimmed,
            formData: latestFormData,
            context: {
              currentSection: 'hobbies',
              currentField: 'hobbies',
              userInput: trimmed,
            },
          }),
        });

        if (generation !== fetchGenerationRef.current) return;

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Hobbies suggestions received:', {
            count: data.suggestions?.length,
            provider: data.aiProvider,
          });
          if (data.success && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            setAiSuggestions(data.suggestions.slice(0, 8));
          } else {
            console.warn('⚠️ No suggestions in response:', data);
          }
        } else {
          console.error(
            '❌ Failed to fetch hobbies suggestions:',
            response.status,
            response.statusText
          );
        }
      } catch (error) {
        if (generation === fetchGenerationRef.current) {
          console.error('❌ Error fetching AI suggestions:', error);
        }
      } finally {
        if (generation === fetchGenerationRef.current) {
          setLoadingSuggestions(false);
        }
      }
    })();
  }, [debouncedHobby]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Hobbies & Interests</h2>
        <p className="text-sm text-gray-600">
          Share your hobbies and interests to show your personality.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Photography, Reading, Traveling"
              value={newHobby}
              onChange={(e) => setNewHobby(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={addHobby} type="button">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
          {loadingSuggestions && (
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Getting AI suggestions...</span>
            </div>
          )}
          {!loadingSuggestions && aiSuggestions.length > 0 && (
            <div className="space-y-1 mt-2">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Sparkles className="w-3 h-3" />
                <span>AI Suggestions:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {aiSuggestions.slice(0, 5).map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      updateFormData((prev) => {
                        const current = Array.isArray(prev.hobbies)
                          ? prev.hobbies.filter((h): h is string => typeof h === 'string')
                          : [];
                        if (current.includes(suggestion)) return {};
                        return { hobbies: [...current, suggestion] };
                      });
                      setNewHobby('');
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
        </div>

        {hobbies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {hobbies.map((hobby, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-medium"
              >
                <span>{hobby}</span>
                <button
                  onClick={() => removeHobby(index)}
                  className="hover:bg-purple-100 rounded p-0.5 transition-colors"
                  aria-label={`Remove ${hobby}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {hobbies.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No hobbies added yet. Start adding your hobbies above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

