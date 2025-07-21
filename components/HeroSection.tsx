"use client";
import React, { useEffect, useState } from "react";
import HolographicSearchBar from "./HolographicSearchBar";
import AICompanion from "./AICompanion";
import JobSearchWidget from "./JobSearchWidget";
import UserWelcome from "./UserWelcome";
import GuestCTAs from "./GuestCTAs";
import SideCTAs from "./SideCTAs";

export default function HeroSection() {
  const [user, setUser] = useState({ isLoggedIn: false, location: "Delhi", name: "Guest", matches: 0, profileStrength: 0 });
  useEffect(() => {
    fetch("/api/user/status").then(res => res.json()).then(setUser);
  }, []);
  return (
    <section className="w-full bg-[#F8FAFC] py-12 md:py-20" style={{ fontFamily: 'Inter' }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 md:gap-12 px-4">
        {/* Left: Main Content */}
        <div className="flex-1 md:w-3/5 flex flex-col justify-center gap-8">
          <HolographicSearchBar />
          {user.isLoggedIn ? <UserWelcome name={user.name} matches={user.matches} profileStrength={user.profileStrength} /> : <GuestCTAs />}
        </div>
        {/* Right: Side CTAs */}
        <div className="flex-1 md:w-2/5 flex flex-col gap-6 items-center md:items-stretch">
          <AICompanion />
          <SideCTAs />
        </div>
      </div>
    </section>
  );
} 