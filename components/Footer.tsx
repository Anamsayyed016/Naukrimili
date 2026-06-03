"use client";
import React, { useState } from "react";
import Link from "next/link";
import { FiFacebook, FiTwitter, FiLinkedin, FiInstagram, FiLoader, FiCheck, FiAlertCircle, FiBriefcase, FiUsers, FiBook, FiMail, FiUser, FiBell, FiArrowRight } from "react-icons/fi";

type SocialVariant = "facebook" | "twitter" | "linkedin" | "instagram";

interface SocialIconProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  variant: SocialVariant;
}

const socialHoverStyles: Record<SocialVariant, string> = {
  facebook: "hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 hover:shadow-blue-100",
  twitter: "hover:border-sky-400 hover:bg-sky-50 hover:text-sky-500 hover:shadow-sky-100",
  linkedin: "hover:border-[#0A66C2] hover:bg-blue-50 hover:text-[#0A66C2] hover:shadow-blue-100",
  instagram: "hover:border-pink-500 hover:bg-pink-50 hover:text-pink-600 hover:shadow-pink-100",
};

const SocialIcon: React.FC<SocialIconProps> = ({ href, icon, label, variant }) => (
  <a
    href={href}
    className={`group flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-500 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${socialHoverStyles[variant]}`}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
  >
    <span className="transition-transform duration-300 group-hover:scale-110">{icon}</span>
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
  { title: "Legal", links: [
    { name: "Privacy Policy", href: "/privacy", icon: <FiBook /> },
    { name: "Terms of Service", href: "/terms", icon: <FiBook /> },
    { name: "Cookie Policy", href: "/cookies", icon: <FiBook /> },
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
    <footer className="relative overflow-hidden border-t border-slate-200/80 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60">
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-50">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-gradient-to-br from-blue-400/15 to-violet-400/15 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-indigo-400/15 to-blue-400/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8">
        <div className="mb-10 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <p className="max-w-md text-base leading-relaxed text-slate-600">
                India&apos;s most trusted AI-powered job matching platform connecting top talent with leading employers.
                Experience the future of job searching.
              </p>
            </div>

            <div className="mb-8 flex flex-wrap gap-3">
              <SocialIcon href="https://facebook.com/naukrimili" icon={<FiFacebook size={18} />} label="Facebook" variant="facebook" />
              <SocialIcon href="https://twitter.com/naukrimili" icon={<FiTwitter size={18} />} label="Twitter" variant="twitter" />
              <SocialIcon href="https://www.linkedin.com/in/mr-s-jaffrey-9057603a8/" icon={<FiLinkedin size={18} />} label="LinkedIn" variant="linkedin" />
              <SocialIcon href="https://www.instagram.com/naukrimili.placement.agency/" icon={<FiInstagram size={18} />} label="Instagram" variant="instagram" />
            </div>

            <div className="mt-8 space-y-4">
              <h3 className="border-b border-slate-200/90 pb-2.5 text-sm font-bold uppercase tracking-wider text-slate-900">
                Get Job Alerts
              </h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Subscribe to receive the latest job openings and career opportunities.
              </p>

              <form onSubmit={handleSubscribe} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm placeholder:text-slate-400 transition-all duration-200 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:ring-offset-0"
                  required
                />

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 ${
                    status === "loading"
                      ? "cursor-not-allowed bg-slate-400"
                      : "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
                  }`}
                >
                  {status === "loading" && <FiLoader size={18} className="animate-spin" />}
                  {status === "success" && <FiCheck size={18} />}
                  {status === "error" && <FiAlertCircle size={18} />}
                  {status === "idle" && (
                    <>
                      Subscribe
                      <FiArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                  {status === "loading" && "Subscribing..."}
                  {status === "success" && "Subscribed!"}
                  {status === "error" && "Try Again"}
                </button>

                {message && (
                  <p
                    className={`rounded-lg px-4 py-2 text-sm ${
                      status === "success"
                        ? "border border-green-200 bg-green-50 text-green-700"
                        : status === "error"
                          ? "border border-red-200 bg-red-50 text-red-700"
                          : "text-slate-600"
                    }`}
                  >
                    {message}
                  </p>
                )}
              </form>
            </div>
          </div>

          {linkGroups.map(g => (
            <div key={g.title} className="space-y-5">
              <h3 className="border-b border-slate-200/90 pb-2.5 text-sm font-bold uppercase tracking-wider text-slate-900">
                {g.title}
              </h3>
              <ul className="space-y-3.5">
                {g.links.map(l => (
                  <li key={l.name}>
                    <Link
                      href={l.href}
                      className="group flex items-center gap-3 rounded-lg border-l-2 border-transparent py-0.5 pl-2 text-slate-600 transition-all duration-200 hover:border-blue-500 hover:bg-white/60 hover:pl-3 hover:text-blue-700"
                    >
                      <span className="text-blue-500 transition-transform duration-200 group-hover:scale-110">
                        {l.icon}
                      </span>
                      <span className="text-sm font-medium transition-colors group-hover:text-blue-700">
                        {l.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200/90 pt-7 text-center">
          <p className="text-sm font-medium text-slate-500">
            © {new Date().getFullYear()} NaukriMili. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
