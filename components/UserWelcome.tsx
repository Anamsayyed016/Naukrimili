"use client";
import React from "react";

interface UserWelcomeProps {
  name?: string;
  matches?: number;
  profileStrength?: number}

export default function UserWelcome({ 
  name = "User", 
  matches = 0, 
  profileStrength = 0 
}: UserWelcomeProps) {
  return (
    <div className="mb-4">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Inter' }}>
        Welcome back, {name}!
      </h1>
      <div className="text-lg text-gray-700 mb-2">
        You have <span className="font-semibold text-[#2563EB]">{matches}</span> new job matches
      </div>
      <div 
        className="w-full bg-gray-200 rounded-full h-4 mt-2" 
        aria-label="Profile strength" 
        aria-valuenow={profileStrength} 
        aria-valuemax={100} 
        aria-valuemin={0} 
        role="progressbar"
      >
        <div 
          className="bg-[#2563EB] h-4 rounded-full transition-all duration-300" 
          style={{ width: `${profileStrength}%` }}
        />
      </div>
      <div className="text-sm text-gray-600 mt-1">
        Profile strength: {profileStrength}% complete
      </div>
    </div>)} 