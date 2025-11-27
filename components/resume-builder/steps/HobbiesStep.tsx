'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface HobbiesStepProps {
  formData: Record<string, any>;
  updateFormData: (updates: Record<string, any>) => void;
}

export default function HobbiesStep({ formData, updateFormData }: HobbiesStepProps) {
  const [newHobby, setNewHobby] = useState('');
  const hobbies: string[] = Array.isArray(formData.hobbies)
    ? formData.hobbies
    : [];

  const addHobby = () => {
    if (newHobby.trim() && !hobbies.includes(newHobby.trim())) {
      updateFormData({
        hobbies: [...hobbies, newHobby.trim()],
      });
      setNewHobby('');
    }
  };

  const removeHobby = (index: number) => {
    const updated = hobbies.filter((_, i) => i !== index);
    updateFormData({ hobbies: updated });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addHobby();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Hobbies & Interests</h2>
        <p className="text-sm text-gray-600">
          Share your hobbies and interests to show your personality.
        </p>
      </div>

      <div className="space-y-4">
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

