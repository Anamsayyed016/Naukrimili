"use client";
import React, { useState } from "react";
import Link from "next/link";
import { FiFacebook, FiTwitter, FiLinkedin, FiInstagram, FiLoader, FiCheck, FiAlertCircle, FiBriefcase, FiUsers, FiBook, FiMail, FiUser, FiBell, FiUpload, FiHeart, FiArrowRight } from "react-icons/fi";

interface SocialIconProps { href: string; icon: React.ReactNode; label: string; }
const SocialIcon: React.FC<SocialIconProps> = ({ href, icon, label }) => (
  <a 
    href={href} 
    className="group w-12 h-12 bg-gray-800 hover:bg-blue-600 rounded-xl flex items-center justify-center text-gray-300 hover:text-white transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl" 
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
    { name: "Create Profile", href: "/profile-setup", icon: <FiUser /> },
    { name: "Upload Resume", href: "/resumes/upload", icon: <FiUpload /> },
    { name: "Job Alerts", href: "/settings", icon: <FiBell /> },
    { name: "Dashboard", href: "/dashboard", icon: <FiBook /> },
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
      if (res.ok) { setStatus("success"); setMessage("Successfully subscribed to newsletter!"); setEmail(""); }
      else { setStatus("error"); setMessage(data.error || "Subscription failed"); }
    } catch { setStatus("error"); setMessage("Network error"); } finally { setTimeout(() => setStatus("idle"), 4000); }
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto pt-16 pb-8 px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Company Info - Enhanced */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  NaukriMili
                </h3>
              </div>
              <p className="text-gray-300 text-base leading-relaxed max-w-md">
                India's most trusted AI-powered job matching platform connecting top talent with leading employers. 
                Experience the future of job searching.
              </p>
            </div>
            
            {/* Enhanced Social Icons */}
            <div className="flex space-x-4">
              <SocialIcon href="https://facebook.com" icon={<FiFacebook size={20} />} label="Facebook" />
              <SocialIcon href="https://twitter.com" icon={<FiTwitter size={20} />} label="Twitter" />
              <SocialIcon href="https://linkedin.com" icon={<FiLinkedin size={20} />} label="LinkedIn" />
              <SocialIcon href="https://instagram.com" icon={<FiInstagram size={20} />} label="Instagram" />
            </div>
          </div>
          
          {/* Link Groups - Enhanced */}
          {linkGroups.map(g => (
            <div key={g.title} className="space-y-6">
              <h3 className="text-white font-semibold text-lg border-b border-gray-700 pb-2">
                {g.title}
              </h3>
              <ul className="space-y-4">
                {g.links.map(l => (
                  <li key={l.name}>
                    <Link 
                      href={l.href} 
                      className="group flex items-center gap-3 hover:text-blue-400 transition-all duration-300 hover:translate-x-1"
                    >
                      <span className="text-blue-400 group-hover:scale-110 transition-transform duration-300">
                        {l.icon}
                      </span>
                      <span className="text-gray-300 group-hover:text-blue-400 transition-colors">
                        {l.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          {/* Newsletter - Enhanced */}
          <div className="space-y-6">
            <h3 className="text-white font-semibold text-lg border-b border-gray-700 pb-2">
              Get Job Alerts
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Subscribe to receive the latest job openings and career opportunities directly in your inbox.
            </p>
            
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div className="relative">
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="Your email address" 
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 placeholder-gray-400 transition-all duration-300" 
                  required 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={status === "loading"} 
                className={`w-full px-6 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-3 transition-all duration-300 ${
                  status === "loading" 
                    ? "bg-gray-600 cursor-not-allowed" 
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                }`}
              >
                {status === "loading" && <FiLoader size={20} className="animate-spin" />}
                {status === "success" && <FiCheck size={20} />}
                {status === "error" && <FiAlertCircle size={20} />}
                {status === "idle" && (
                  <>
                    Subscribe
                    <FiArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              
              {message && (
                <p className={`text-sm px-4 py-2 rounded-lg ${
                  status === "success" 
                    ? "text-green-400 bg-green-900/20 border border-green-700/30" 
                    : status === "error" 
                    ? "text-red-400 bg-red-900/20 border border-red-700/30" 
                    : "text-gray-400"
                }`}>
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>
        
        {/* Bottom Section - Enhanced */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-gray-400">
              <p className="text-sm">
                © {new Date().getFullYear()} NaukriMili. All rights reserved.
              </p>
              <FiHeart className="w-4 h-4 text-red-400 animate-pulse" />
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors duration-300 hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors duration-300 hover:underline">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors duration-300 hover:underline">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
