"use client";
import React from "react";
import Link from "next/link";

export default function SideCTAs() {
  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Resume Upload Card */}
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center gap-3">
        <div className="text-3xl">📄</div>
        <div className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Inter' }}>Post your resume - Get discovered in 2 minutes</div>
        <Link href="/resume-builder">
          <button className="bg-[#10B981] text-white font-semibold px-5 py-2 rounded transition-transform duration-150 hover:scale-105 focus:scale-105 text-base mt-2">Upload Now</button>
        </Link>
      </div>
      {/* Employer Card */}
      <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center gap-3">
        <div className="text-3xl">💼</div>
        <div className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Inter' }}>Hiring? Post jobs for free</div>
        <Link href="/employer/signup">
          <button className="bg-[#2563EB] text-white font-semibold px-5 py-2 rounded transition-transform duration-150 hover:scale-105 focus:scale-105 text-base mt-2">Post a Job</button>
        </Link>
      </div>
    </div>
  );
} 