'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface AchievementsStepProps {
  formData: Record<string, any>;
  updateFormData: (updates: Record<string, any>) => void;
}

export default function AchievementsStep({ formData, updateFormData }: AchievementsStepProps) {
  const [newAchievement, setNewAchievement] = useState('');
  const achievements: string[] = Array.isArray(formData.achievements)
    ? formData.achievements
    : [];

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Achievements</h2>
        <p className="text-sm text-gray-600">
          List your notable achievements, awards, and recognitions.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="e.g., Employee of the Year 2023"
            value={newAchievement}
            onChange={(e) => setNewAchievement(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={addAchievement} type="button">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
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

