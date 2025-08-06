'use client';
import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FormData {
  targetJob: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    description: string;
    years: number;
  }[];
}

interface ATSScoreBadgeProps {
  score: number;
  className?: string;
}

const ATSScoreBadge = ({ score, className }: ATSScoreBadgeProps) => {
  const getScoreColor = () => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Badge className={`${getScoreColor()} ${className}`}>
      ATS Score: {score}%
    </Badge>
  );
};

export const AIResumeForm = () => {
  const [formData, setFormData] = useState<FormData>({
    targetJob: '',
    skills: [],
    experience: []
  });
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [resumeContent, setResumeContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSkill, setCurrentSkill] = useState('');

  const addSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, currentSkill.trim()]
      });
      setCurrentSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const generateResume = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.post('/api/seeker/resume/generate', formData);
      setAtsScore(data.score);
      setResumeContent(data.resume);
      toast({
        title: "Resume Generated",
        description: "Your optimized resume has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">AI Resume Optimizer</h2>
        <p className="text-gray-500">
          Let AI help you create an ATS-optimized resume for your target job
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Target Job Title</label>
          <Input
            placeholder="e.g., Senior Frontend Developer"
            value={formData.targetJob}
            onChange={(e) => setFormData({ ...formData, targetJob: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Skills</label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add a skill"
              value={currentSkill}
              onChange={(e) => setCurrentSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSkill()}
            />
            <Button onClick={addSkill}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.skills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => removeSkill(skill)}
              >
                {skill} ×
              </Badge>
            ))}
          </div>
        </div>

        <Button
          className="w-full"
          onClick={generateResume}
          disabled={isLoading || !formData.targetJob || formData.skills.length === 0}
        >
          {isLoading ? 'Generating...' : 'Generate Optimized Resume'}
        </Button>

        {atsScore !== null && (
          <div className="mt-4">
            <ATSScoreBadge score={atsScore} className="text-lg" />
          </div>
        )}

        {resumeContent && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Generated Resume</h3>
            <pre className="whitespace-pre-wrap text-sm">{resumeContent}</pre>
          </div>
        )}
      </div>
    </Card>
  );
};
