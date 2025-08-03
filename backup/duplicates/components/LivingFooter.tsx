"use client";
import React, { useEffect, useState } from "react";

const trendingResources = [
  { icon: "📈", label: "Trending Today", content: "Remote Work Policies", link: "#" },
  { icon: "🔥", label: "Hot Debate", content: "4-Day Workweek: Yay/Nay?", link: "#" },
];

export default function LivingFooter() {
  const [active, setActive] = useState(0);
  const [ctaType, setCtaType] = useState("jobseeker"); // or 'employer'

  // Auto-rotate resource hub
  useEffect(() => {
    const interval = setInterval(() => setActive(a => (a + 1) % trendingResources.length), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="relative w-full bg-[#181A2A] text-white pt-12 pb-6 mt-16" style={{ fontFamily: 'Inter' }}>
      {/* Animated Background */}
      <div className="absolute inset-0 w-full h-40 pointer-events-none z-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 animate-pulse" aria-hidden />
      <div className="relative z-10 max-w-7xl mx-auto px-4 flex flex-col md:flex-row gap-8 md:gap-16 items-start justify-between">
        {/* Smart Resource Hub */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-[#23244A] rounded-xl p-4 shadow flex items-center gap-4 animate-fade-in">
            <span className="text-2xl" aria-hidden>{trendingResources[active].icon}</span>
            <div>
              <div className="font-semibold text-lg mb-1">{trendingResources[active].label}</div>
              <a href={trendingResources[active].link} className="text-[#00F5A0] hover:underline">{trendingResources[active].content}</a>
            </div>
          </div>
        </div>
        {/* Contextual CTA Ribbon */}
        <div className="flex-1 flex flex-col gap-4 items-center md:items-end">
          <div className="bg-[#7B4EFF] rounded-full px-6 py-3 font-semibold text-lg shadow flex items-center gap-3 animate-fade-in">
            {ctaType === "jobseeker" ? (
              <>
                <span role="img" aria-label="Rocket">🚀</span> Get Career Coaching
              </>
            ) : (
              <>
                <span role="img" aria-label="Megaphone">📢</span> Post Jobs in 30s
              </>
            )}
          </div>
        </div>
      </div>
      {/* Company Logos & Careerscope Mini-Game Placeholder */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 mt-8 flex flex-col md:flex-row gap-8 md:gap-16 items-center justify-between">
        <div className="flex-1 flex flex-row gap-4 items-center">
          {/* Company logos */}
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl shadow">🏢</div>
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl shadow">🏥</div>
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl shadow">💻</div>
          <span className="ml-4 text-gray-300 text-sm">Hover to see openings (coming soon)</span>
        </div>
        <div className="flex-1 flex flex-col items-center md:items-end">
          <div className="bg-[#23244A] rounded-xl p-4 shadow text-center w-64 animate-fade-in">
            <div className="font-semibold mb-2">Careerscope Mini-Game</div>
            <div className="text-gray-400 text-sm mb-2">Drag skills → see matching companies light up (coming soon)</div>
            <div className="flex flex-row gap-2 justify-center">
              <span className="bg-[#00F5A0] text-[#181A2A] px-2 py-1 rounded-full text-xs">React</span>
              <span className="bg-[#FF3860] text-white px-2 py-1 rounded-full text-xs">AI</span>
              <span className="bg-[#7B4EFF] text-white px-2 py-1 rounded-full text-xs">Design</span>
            </div>
          </div>
        </div>
      </div>
      {/* Footer Bottom */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 mt-10 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
        <div>&copy; {new Date().getFullYear()} Naukrimili. All rights reserved.</div>
        <div className="flex gap-4 mt-2 md:mt-0">
          <a href="#" className="hover:text-[#00F5A0]">Privacy Policy</a>
          <a href="#" className="hover:text-[#00F5A0]">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
} 