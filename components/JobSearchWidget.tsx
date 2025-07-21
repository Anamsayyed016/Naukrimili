"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const experienceLevels = ["Any", "Fresher", "1-3 Years", "3-5 Years", "5+ Years"];

interface JobSearchWidgetProps {
  location?: string;
  onSearch?: (params: { what: string; where: string; experience: string }) => void;
}

export default function JobSearchWidget({ location, onSearch }: JobSearchWidgetProps) {
  const [title, setTitle] = useState("");
  const [loc, setLoc] = useState(location || "Delhi");
  const [exp, setExp] = useState(experienceLevels[0]);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const searchParams = {
      what: title,
      where: loc,
      experience: exp
    };

    if (onSearch) {
      onSearch(searchParams);
    } else {
      // Navigate to jobs page with search parameters
      const params = new URLSearchParams();
      if (title) params.append('what', title);
      if (loc) params.append('where', loc);
      if (exp !== 'Any') params.append('experience', exp);
      
      router.push(`/jobs?${params.toString()}`);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="flex flex-col md:flex-row gap-3 md:gap-4 items-stretch bg-white rounded-xl shadow p-4 md:p-6" 
      style={{ fontFamily: 'Inter' }}
    >
      <input
        type="text"
        className="flex-1 px-4 py-3 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-base"
        placeholder="🔍 Job title, skills, or company"
        value={title}
        onChange={e => setTitle(e.target.value)}
        aria-label="Job title, skills, or company"
      />
      <input
        type="text"
        className="flex-1 px-4 py-3 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-base"
        placeholder="📍 Location"
        value={loc}
        onChange={e => setLoc(e.target.value)}
        aria-label="Location"
      />
      <select
        className="flex-1 px-4 py-3 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-base"
        value={exp}
        onChange={e => setExp(e.target.value)}
        aria-label="Experience Level"
      >
        {experienceLevels.map(level => <option key={level} value={level}>{level}</option>)}
      </select>
      <button
        type="submit"
        className="bg-[#2563EB] text-white font-semibold px-6 py-3 rounded transition-transform duration-150 hover:scale-105 focus:scale-105 text-base shadow"
        style={{ minWidth: 140 }}
      >
        Search Jobs
      </button>
    </form>
  );
}
