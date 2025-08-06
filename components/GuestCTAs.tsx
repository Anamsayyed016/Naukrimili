"use client";
import React from "react";
import Link from "next/link";

export default function GuestCTAs() {
  return (
    <div className="mb-4">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Inter' }}>Find Your Dream Job at Naurimili</h1>
      <div className="text-lg text-gray-700 mb-4">500,000+ curated jobs across India</div>
      <Link href="/register">
        <button className="bg-[#2563EB] text-white font-semibold px-6 py-3 rounded transition-transform duration-150 hover:scale-105 focus:scale-105 text-base shadow flex items-center gap-2">
          ✨ Get personalized jobs →
        </button>
      </Link>
    </div>)} 