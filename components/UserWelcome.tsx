"use client";
import React from 'react';

interface UserWelcomeProps {
  name?: string;
  matches?: number;
  profileStrength?: number; // 0-100
}

export default function UserWelcome({ name = 'User', matches = 0, profileStrength = 0 }: UserWelcomeProps) {
  const pct = Math.max(0, Math.min(100, profileStrength));
  return (
    <div className="mb-4">
  <h1 className="text-4xl font-bold text-gray-900 mb-2 font-inter">Welcome back, {name}!</h1>
      <div className="text-lg text-gray-700 mb-2">
        You have <span className="font-semibold text-blue-600">{matches}</span> new job matches
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4 mt-2" role="progressbar" aria-label="Profile strength" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="bg-blue-600 h-4 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <div className="text-sm text-gray-600 mt-1">Profile strength: {pct}% complete</div>
    </div>
  );
}