"use client";
import React, { useEffect, useRef, useState } from "react";

export default function HolographicSearchBar() {
  const [location, setLocation] = useState("Delhi");
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Voice-to-text
  useEffect(() => {
    if (typeof window === "undefined" || !('webkitSpeechRecognition' in window)) return;
    // @ts-ignore
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      setInput(event.results[0][0].transcript);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
  }, []);

  const handleMic = () => {
    if (recognitionRef.current) {
      setListening(true);
      recognitionRef.current.start();
    }
  };

  // Auto-detect location (mock)
  useEffect(() => {
    setLocation("Delhi");
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto" style={{ minHeight: 80 }}>
      <div className="absolute inset-0 z-0 rounded-2xl overflow-hidden pointer-events-none bg-gradient-to-r from-purple-500/5 via-blue-500/5 to-cyan-500/5 animate-pulse" aria-hidden />
      <form className="relative z-10 flex flex-col md:flex-row gap-2 items-stretch p-4" style={{ fontFamily: 'Inter' }}>
        <input
          type="text"
          className="flex-1 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7B4EFF] shadow text-base bg-white/80 backdrop-blur"
          placeholder="💬 Describe your ideal workplace culture..."
          value={input}
          onChange={e => setInput(e.target.value)}
          aria-label="Describe your ideal workplace culture"
        />
        <button
          type="button"
          className={`flex items-center justify-center px-4 py-3 rounded-lg border border-gray-200 bg-white/80 hover:bg-[#F8FAFC] transition focus:outline-none focus:ring-2 focus:ring-[#7B4EFF] ${listening ? 'animate-pulse' : ''}`}
          aria-label="Voice input"
          onClick={handleMic}
        >
          <span role="img" aria-label="Microphone">🎤</span>
        </button>
        <input
          type="text"
          className="w-40 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7B4EFF] shadow text-base bg-white/80 backdrop-blur"
          value={location}
          onChange={e => setLocation(e.target.value)}
          aria-label="Location"
          placeholder="🌐 Location"
        />
        <button
          type="submit"
          className="bg-[#7B4EFF] text-white font-semibold px-6 py-3 rounded-lg transition-transform duration-150 hover:scale-105 focus:scale-105 text-base shadow"
        >
          Search Jobs
        </button>
      </form>
    </div>
  );
} 