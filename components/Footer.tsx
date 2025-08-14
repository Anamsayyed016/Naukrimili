"use client";
import React, { useState } from "react";
import Link from "next/link";
import { FiFacebook, FiTwitter, FiLinkedin, FiInstagram, FiLoader, FiCheck, FiAlertCircle, FiBriefcase, FiUsers, FiBook, FiMail, FiUser, FiBell, FiUpload } from "react-icons/fi";

interface SocialIconProps { href: string; icon: React.ReactNode; label: string; }
const SocialIcon: React.FC<SocialIconProps> = ({ href, icon, label }) => (
  <a href={href} className="text-gray-400 hover:text-white transition-colors duration-200" target="_blank" rel="noopener noreferrer" aria-label={label}>{icon}</a>
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
    <footer className="bg-gray-900 text-gray-300 pt-12 pb-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <p className="text-sm mb-6">India's most trusted AI-powered job matching platform connecting top talent with leading employers.</p>
            <div className="flex space-x-4">
              <SocialIcon href="https://facebook.com" icon={<FiFacebook size={20} />} label="Facebook" />
              <SocialIcon href="https://twitter.com" icon={<FiTwitter size={20} />} label="Twitter" />
              <SocialIcon href="https://linkedin.com" icon={<FiLinkedin size={20} />} label="LinkedIn" />
              <SocialIcon href="https://instagram.com" icon={<FiInstagram size={20} />} label="Instagram" />
            </div>
          </div>
          {linkGroups.map(g => (
            <div key={g.title} className="space-y-4">
              <h3 className="text-white font-medium">{g.title}</h3>
              <ul className="space-y-3">
                {g.links.map(l => (
                  <li key={l.name}>
                    <Link href={l.href} className="flex items-center gap-2 hover:text-indigo-400 transition-colors group">
                      <span className="text-indigo-400 group-hover:scale-110 transition-transform">{l.icon}</span>
                      <span>{l.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="space-y-4">
            <h3 className="text-white font-medium">Get Job Alerts</h3>
            <p className="text-sm">Subscribe to receive the latest job openings</p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex w-full">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" className="px-4 py-2 w-full rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900" required />
                <button type="submit" disabled={status === "loading"} className={`px-4 py-2 rounded-r-md text-white flex items-center gap-2 min-w-[110px] transition-colors ${status === "loading" ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}>
                  {status === "loading" && <FiLoader className="animate-spin" />}
                  {status === "success" && <FiCheck />}
                  {status === "error" && <FiAlertCircle />}
                  {status === "idle" && "Subscribe"}
                </button>
              </div>
              {message && (<p className={`text-sm ${status === "success" ? "text-green-400" : status === "error" ? "text-red-400" : "text-gray-400"}`}>{message}</p>)}
            </form>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">© {new Date().getFullYear()} NaukriMili. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="text-sm hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="text-sm hover:text-white">Terms</Link>
            <Link href="/cookies" className="text-sm hover:text-white">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}