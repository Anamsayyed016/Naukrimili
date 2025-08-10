"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, MapPin, TrendingUp, UploadCloud, Building2, Sparkles, Briefcase, Layers3, ArrowRight } from "lucide-react";

// --- Types ---
interface Suggestion {
  type: "title" | "company" | "skill";
  value: string;
}

interface LandingSectionsProps {
  initialKeyword?: string;
  initialLocation?: string;
  featuredEmployers?: { id: string; name: string; logo: string; slug: string }[];
  trending?: { q: string; location?: string; label?: string }[];
  categories?: { id: string; name: string; icon: string }[];
}

// Demo fallback data (can be replaced with server data)
const DEFAULT_TRENDING: LandingSectionsProps["trending"] = [
  { q: "Frontend Developer", location: "Bangalore" },
  { q: "Data Analyst", location: "Mumbai" },
  { q: "Product Manager", location: "Hyderabad" },
  { q: "UX Designer", location: "Pune" },
];

const DEFAULT_CATEGORIES: LandingSectionsProps["categories"] = [
  { id: "it", name: "IT & Software", icon: "💻" },
  { id: "marketing", name: "Marketing", icon: "📢" },
  { id: "sales", name: "Sales", icon: "📈" },
  { id: "finance", name: "Finance", icon: "💰" },
  { id: "design", name: "Design", icon: "🎨" },
  { id: "hr", name: "HR", icon: "👥" },
  { id: "operations", name: "Operations", icon: "⚙️" },
  { id: "support", name: "Support", icon: "🛎️" },
];

const DEFAULT_EMPLOYERS: NonNullable<LandingSectionsProps["featuredEmployers"]> = [
  { id: "1", name: "Infosys", logo: "/logos/infosys.png", slug: "infosys" },
  { id: "2", name: "TCS", logo: "/logos/tcs.png", slug: "tcs" },
  { id: "3", name: "Flipkart", logo: "/logos/flipkart.png", slug: "flipkart" },
  { id: "4", name: "Swiggy", logo: "/logos/swiggy.png", slug: "swiggy" },
];

export const LandingSections: React.FC<LandingSectionsProps> = ({
  initialKeyword = "",
  initialLocation = "Bangalore",
  featuredEmployers = DEFAULT_EMPLOYERS,
  trending = DEFAULT_TRENDING,
  categories = DEFAULT_CATEGORIES,
}) => {
  const router = useRouter();
  const [keyword, setKeyword] = useState(initialKeyword);
  const [location, setLocation] = useState(initialLocation);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [focusedIdx, setFocusedIdx] = useState<number>(-1);
  const abortRef = useRef<AbortController | null>(null);

  // Location autodetect (HTML5 geolocation -> reverse geocode placeholder)
  useEffect(() => {
    if (initialLocation) return; // Already provided
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        // Placeholder: choose city based on rough lat/long buckets
        let city = "India";
        if (latitude > 12 && latitude < 14 && longitude > 77 && longitude < 78) city = "Bangalore";
        else if (latitude > 18 && latitude < 20 && longitude > 72 && longitude < 73) city = "Mumbai";
        else if (latitude > 28 && latitude < 29 && longitude > 76 && longitude < 78) city = "Delhi";
        setLocation(city);
      } catch {
        // silent fail
      }
    });
  }, [initialLocation]);

  // Fetch suggestions (debounced + abortable)
  useEffect(() => {
    if (!keyword.trim()) {
      setSuggestions([]);
      return;
    }
    const handler = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        // Fake suggestion generation locally (replace with API call)
        const base = keyword.trim();
        const results: Suggestion[] = [
          { type: "title", value: base },
          { type: "company", value: `${base} Pvt Ltd` },
          { type: "skill", value: base.toLowerCase() },
        ];
        setSuggestions(results);
        setFocusedIdx(-1);
      } catch {
        // ignore
      }
    }, 200);
    return () => clearTimeout(handler);
  }, [keyword]);

  const submitSearch = (k = keyword, l = location) => {
    if (!k.trim()) return;
    router.push(`/jobs?query=${encodeURIComponent(k.trim())}&location=${encodeURIComponent(l.trim())}`);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      if (focusedIdx >= 0) {
        setKeyword(suggestions[focusedIdx].value);
        setSuggestions([]);
      } else {
        submitSearch();
      }
    } else if (e.key === "Escape") {
      setSuggestions([]);
    }
  };

  return (
    <div className="space-y-16">
      {/* Enhanced Hero / Search */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-700 to-sky-600 text-white px-4 py-24 shadow-lg">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_25%_25%,white,transparent_60%)]" />
        <div className="relative max-w-4xl mx-auto flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            India’s Multi-Source Job Discovery Platform
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl">
            Search across aggregated job feeds, discover trending roles, and connect with top employers faster.
          </p>
          <div className="w-full bg-white/10 backdrop-blur rounded-2xl p-4 shadow-xl ring-1 ring-white/20">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
                <input
                  className="w-full bg-white/10 border border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/30 rounded-xl py-3 pl-11 pr-4 placeholder-white/50 text-white outline-none transition"
                  placeholder="Job title, company, or skill"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={onKeyDown}
                />
                {suggestions.length > 0 && (
                  <ul className="absolute z-20 mt-2 w-full bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 divide-y">
                    {suggestions.map((s, i) => (
                      <li
                        key={i}
                        className={`px-4 py-2 text-sm cursor-pointer flex items-center gap-2 hover:bg-gray-50 ${i === focusedIdx ? "bg-gray-100" : ""}`}
                        onMouseDown={() => {
                          setKeyword(s.value);
                          setSuggestions([]);
                        }}
                      >
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                          {s.type}
                        </span>
                        <span>{s.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="relative w-full md:w-64">
                <MapPin className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/60" />
                {showLocationInput ? (
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 focus:border-white/40 focus:ring-2 focus:ring-white/30 rounded-xl py-3 pl-11 pr-4 placeholder-white/50 text-white outline-none transition"
                    placeholder="City or State"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowLocationInput(true)}
                    className="w-full text-left bg-white/10 border border-white/20 hover:bg-white/15 rounded-xl py-3 pl-11 pr-4 text-white/90 text-sm"
                  >
                    {location}
                  </button>
                )}
              </div>
              <button
                onClick={() => submitSearch()}
                className="h-12 md:h-auto px-8 py-3 bg-secondary hover:bg-secondary/90 text-white font-semibold rounded-xl shadow flex items-center gap-2 justify-center"
              >
                Search Jobs
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 text-xs text-white/70">
              <span className="font-medium">Quick Search:</span>
              {trending.slice(0,4).map((t, i) => (
                <button
                  key={i}
                  onClick={() => submitSearch(t.q, t.location || location)}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10"
                >
                  {t.q}{t.location ? ` · ${t.location}` : ""}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <Link href="/employers" className="group inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-5 py-3 rounded-full shadow">
              Post a Job
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/upload-resume" className="inline-flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-white font-medium px-5 py-3 rounded-full border border-white/20">
              <UploadCloud className="w-4 h-4" /> Upload Resume
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Jobs */}
      <section className="px-4">
        <div className="max-w-6xl mx-auto">
          <header className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-indigo-600" /> Trending Jobs</h2>
            <Link href="/jobs" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </header>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trending.map((t, i) => (
              <button
                key={i}
                onClick={() => submitSearch(t.q, t.location || location)}
                className="group text-left p-5 rounded-xl bg-white shadow hover:shadow-md border border-gray-100 transition flex flex-col gap-2"
              >
                <span className="text-sm text-indigo-600 font-medium">{t.location || location}</span>
                <span className="font-semibold text-gray-800 group-hover:text-indigo-700">{t.q}</span>
                <span className="text-xs text-gray-500">Tap to search instantly</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4">
        <div className="max-w-6xl mx-auto">
          <header className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Layers3 className="w-5 h-5 text-indigo-600" /> Popular Categories</h2>
            <Link href="/categories" className="text-sm text-indigo-600 hover:underline">Browse all</Link>
          </header>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/jobs?category=${encodeURIComponent(c.id)}`}
                className="group p-5 rounded-xl bg-white shadow hover:shadow-md border border-gray-100 flex flex-col gap-2 transition"
              >
                <span className="text-2xl" aria-hidden>{c.icon}</span>
                <span className="font-semibold text-gray-800 group-hover:text-indigo-700">{c.name}</span>
                <span className="text-xs text-gray-500">Explore roles</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Employers */}
      <section className="px-4">
        <div className="max-w-6xl mx-auto">
          <header className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-600" /> Featured Employers</h2>
            <Link href="/companies" className="text-sm text-indigo-600 hover:underline">View all</Link>
          </header>
          <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {featuredEmployers.map((e) => (
              <Link
                key={e.id}
                href={`/company/${e.slug}`}
                className="group rounded-xl bg-white p-4 border border-gray-100 shadow hover:shadow-md flex flex-col items-center gap-3 transition"
              >
                <div className="relative w-16 h-16">
                  <Image src={e.logo} alt={e.name} fill className="object-contain" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700 text-center line-clamp-2">{e.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Resume Upload Prompt */}
      <section className="px-4">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 p-8 md:p-10 text-white shadow-lg flex flex-col md:flex-row md:items-center gap-8">
            <div className="flex-1">
              <h3 className="text-2xl font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5" /> Get Matched Faster</h3>
              <p className="text-sm text-white/80 max-w-md">Upload your resume and let our matching engine surface roles tailored to your skills and experience.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/upload-resume" className="inline-flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-5 py-2.5 rounded-full shadow">
                  <UploadCloud className="w-4 h-4" /> Upload Resume
                </Link>
                <Link href="/profile" className="inline-flex items-center gap-2 border border-white/30 hover:bg-white/10 text-white font-medium px-5 py-2.5 rounded-full">
                  Build Profile
                </Link>
              </div>
            </div>
            <div className="relative w-full max-w-xs mx-auto h-40 md:h-48">
              <Image src="/illustrations/resume-upload.png" alt="Resume Upload" fill className="object-contain" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingSections;
