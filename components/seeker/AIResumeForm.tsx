"use client";

import { useState } from "react";
import axios from "axios";
import { safeLength, safeArray, hasItems } from '@/lib/safe-array-utils';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

// Clean, de-duplicated definitions
interface ExperienceItem {
  title: string;
  company: string;
  description: string;
  years: number;
  skills: string[];
  experience?: ExperienceItem[]; // allow nesting optionally
}

interface FormData {
  targetJob: string;
  skills: string[];
  experience: ExperienceItem[];
}

interface ATSScoreBadgeProps {
  score: number;
  className?: string;
}

const ATSScoreBadge = ({ score, className }: ATSScoreBadgeProps) => {
  const getScoreClass = () => {
    if (score >= 80)
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    if (score >= 60)
      return "bg-secondary/20 text-secondary dark:bg-secondary/30 dark:text-secondary-foreground";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  };
  return (
    <Badge className={`${getScoreClass()} ${className || ""}`.trim()}>
      ATS Score: {score}%
    </Badge>
  );
};

export const AIResumeForm = () => {
  const [formData, setFormData] = useState<FormData>({
    targetJob: "",
    skills: [],
    experience: [],
  });
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [resumeContent, setResumeContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSkill, setCurrentSkill] = useState("");

  const addSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, currentSkill.trim()],
      });
      setCurrentSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skillToRemove),
    });
  };

  const generateResume = async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.post("/api/seeker/resume/generate", formData);
      setAtsScore(data.score);
      setResumeContent(data.resume);
      toast({
        title: "Resume Generated",
        description: "Your optimized resume has been generated successfully.",
      });
    } catch (error) {
      console.error("Error generating resume", error);
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
        <p className="text-gray-500 dark:text-gray-400">
          Let AI help you create an ATS-optimized resume for your target job
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Target Job Title</label>
          <Input
            placeholder="e.g., Senior Frontend Developer"
            value={formData.targetJob}
            onChange={(e) =>
              setFormData({ ...formData, targetJob: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Skills</label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="Add a skill"
              value={currentSkill}
              onChange={(e) => setCurrentSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
            />
            <Button type="button" onClick={addSkill} variant="secondary">
              Add
            </Button>
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
        <div className="pt-2 flex flex-col gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              type="button"
              onClick={generateResume}
              disabled={isLoading || !formData.targetJob || !hasItems(formData.skills)}
            >
              {isLoading ? "Generating..." : "Generate Optimized Resume"}
            </Button>
            {atsScore !== null && <ATSScoreBadge score={atsScore} />}
          </div>
          {resumeContent && (
            <div className="mt-2 space-y-2 w-full">
              <h3 className="text-lg font-semibold">Generated Resume</h3>
              <div className="rounded-md border bg-muted/30 p-4 whitespace-pre-wrap text-sm leading-relaxed">
                {resumeContent}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AIResumeForm;
