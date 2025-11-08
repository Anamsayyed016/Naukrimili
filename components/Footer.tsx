"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FiFacebook, FiTwitter, FiLinkedin, FiInstagram, FiLoader, FiCheck, FiAlertCircle, FiBriefcase, FiUsers, FiBook, FiMail, FiUser, FiBell, FiArrowRight } from "react-icons/fi";

interface SocialIconProps { href: string; icon: React.ReactNode; label: string; }
const SocialIcon: React.FC<SocialIconProps> = ({ href, icon, label }) => (
  <a 
    href={href} 
    className="group w-12 h-12 bg-white border border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl flex items-center justify-center text-gray-600 hover:text-blue-600 transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-md" 
    target="_blank" 
    rel="noopener noreferrer" 
    aria-label={label}
  >
    {icon}
  </a>
);

const linkGroups = [
  { title: "Quick Links", links: [
    { name: "Browse Jobs", href: "/jobs", icon: <FiBriefcase /> },
    { name: "Companies", href: "/companies", icon: <FiUsers /> },
    { name: "About Us", href: "/about", icon: <FiBook /> },
    { name: "Contact", href: "/contact", icon: <FiMail /> },
  ]},
  { title: "For Job Seekers", links: [
    { name: "Create Profile", href: "/auth/signin", icon: <FiUser /> },
  ]},
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setStatus("success"); setMessage("Successfully subscribed!"); setEmail(""); }
      else { setStatus("error"); setMessage(data.error || "Subscription failed"); }
    } catch { setStatus("error"); setMessage("Network error"); } finally { setTimeout(() => setStatus("idle"), 4000); }
  };

  return (
    <footer className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 border-t border-gray-200/50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <Image 
                  src="https://res.cloudinary.com/dko2hk0yo/image/upload/v1762601336/1naukrilogo_trd6vx.png" 
                  alt="NaukriMili - AI-Powered Job Portal" 
                  className="h-12 w-auto object-contain"
                  width={180}
                  height={48}
                  unoptimized
                />
              </div>
              <p className="text-gray-600 text-base leading-relaxed max-w-md">
                India's most trusted AI-powered job matching platform connecting top talent with leading employers. 
                Experience the future of job searching.
              </p>
            </div>
            
            {/* Social Icons */}
            <div className="flex space-x-4">
              <SocialIcon href="https://facebook.com/naukrimili" icon={<FiFacebook size={20} />} label="Facebook" />
              <SocialIcon href="https://twitter.com/naukrimili" icon={<FiTwitter size={20} />} label="Twitter" />
              <SocialIcon href="https://linkedin.com/company/naukrimili" icon={<FiLinkedin size={20} />} label="LinkedIn" />
              <SocialIcon href="https://instagram.com/naukrimili" icon={<FiInstagram size={20} />} label="Instagram" />
            </div>
          </div>
          
          {/* Link Groups */}
          {linkGroups.map(g => (
            <div key={g.title} className="space-y-6">
              <h3 className="text-gray-900 font-bold text-lg border-b border-gray-200 pb-3">
                {g.title}
              </h3>
              <ul className="space-y-4">
                {g.links.map(l => (
                  <li key={l.name}>
                    <Link 
                      href={l.href} 
                      className="group flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-all duration-300 hover:translate-x-1"
                    >
                      <span className="text-blue-500 group-hover:scale-110 transition-transform duration-300">
                        {l.icon}
                      </span>
                      <span className="group-hover:text-blue-600 transition-colors">
                        {l.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          {/* Newsletter */}
          <div className="space-y-6">
            <h3 className="text-gray-900 font-bold text-lg border-b border-gray-200 pb-3">
              Get Job Alerts
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Subscribe to receive the latest job openings and career opportunities directly in your inbox.
            </p>
            
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div className="relative">
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="Your email address" 
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-300 shadow-sm" 
                  required 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={status === "loading"} 
                className={`w-full px-6 py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-3 transition-all duration-300 ${
                  status === "loading" 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                }`}
              >
                {status === "loading" && <FiLoader size={20} className="animate-spin" />}
                {status === "success" && <FiCheck size={20} />}
                {status === "error" && <FiAlertCircle size={20} />}
                {status === "idle" && (
                  <>
                    Subscribe
                    <FiArrowRight size={16} />
                  </>
                )}
                {status === "loading" && "Subscribing..."}
                {status === "success" && "Subscribed!"}
                {status === "error" && "Try Again"}
              </button>
              
              {message && (
                <p className={`text-sm px-4 py-2 rounded-lg ${
                  status === "success" 
                    ? "text-green-700 bg-green-50 border border-green-200" 
                    : status === "error" 
                    ? "text-red-700 bg-red-50 border border-red-200" 
                    : "text-gray-600"
                }`}>
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="border-t border-gray-200 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-gray-600">
              <p className="text-sm">
                © {new Date().getFullYear()} NaukriMili. All rights reserved.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/privacy" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 hover:underline font-medium">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 hover:underline font-medium">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-600 hover:text-blue-600 transition-colors duration-300 hover:underline font-medium">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
