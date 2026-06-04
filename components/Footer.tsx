"use client";
import React, { useState } from "react";
import Link from "next/link";
import { FiFacebook, FiTwitter, FiLinkedin, FiLoader, FiCheck, FiAlertCircle, FiBriefcase, FiUsers, FiBook, FiMail, FiUser, FiBell, FiArrowRight } from "react-icons/fi";

type SocialVariant = "facebook" | "twitter" | "linkedin" | "instagram";

interface SocialIconProps {
  href: string;
  icon?: React.ReactNode;
  label: string;
  variant: SocialVariant;
}

const socialTooltipLabels: Record<SocialVariant, string> = {
  facebook: "Facebook",
  twitter: "Twitter/X",
  linkedin: "LinkedIn",
  instagram: "Instagram",
};

const socialBaseStyles =
  "group relative flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/90 bg-gradient-to-br from-white/95 via-white/75 to-slate-100/40 shadow-[0_6px_20px_rgba(15,23,42,0.14)] ring-1 ring-slate-200/60 backdrop-blur-lg transition-all duration-300 ease-out sm:h-[60px] sm:w-[60px]";

/** Default platform brand colors — icons recognizable before hover */
const socialDefaultStyles: Record<SocialVariant, string> = {
  facebook: "text-[#1877F2]",
  twitter: "text-[#0F1419]",
  linkedin: "text-[#0A66C2]",
  instagram: "",
};

/** Feather stroke icons ignore text gradients; gradient stroke keeps Instagram visible */
function InstagramSocialGlyph({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="url(#naukrimili-footer-ig-gradient)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <defs>
        <linearGradient id="naukrimili-footer-ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#833AB4" />
          <stop offset="35%" stopColor="#C13584" />
          <stop offset="65%" stopColor="#FD1D1D" />
          <stop offset="100%" stopColor="#F77737" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const socialHoverStyles: Record<SocialVariant, string> = {
  facebook:
    "hover:-translate-y-1 hover:scale-[1.08] hover:border-blue-300/90 hover:bg-gradient-to-br hover:from-blue-50/95 hover:to-white/90 hover:text-[#1877F2] hover:shadow-[0_14px_36px_rgba(24,119,242,0.45)] hover:ring-blue-400/35",
  twitter:
    "hover:-translate-y-1 hover:scale-[1.08] hover:border-slate-500/80 hover:bg-gradient-to-br hover:from-slate-100/95 hover:to-white/90 hover:text-slate-900 hover:shadow-[0_14px_36px_rgba(15,23,42,0.4)] hover:ring-slate-600/30",
  linkedin:
    "hover:-translate-y-1 hover:scale-[1.08] hover:border-[#0A66C2]/80 hover:bg-gradient-to-br hover:from-blue-50/95 hover:to-white/90 hover:text-[#0A66C2] hover:shadow-[0_14px_36px_rgba(10,102,194,0.45)] hover:ring-[#0A66C2]/35",
  instagram:
    "hover:-translate-y-1 hover:scale-[1.08] hover:border-pink-300/90 hover:bg-gradient-to-br hover:from-pink-50/90 hover:via-white/85 hover:to-orange-50/75 hover:text-pink-600 hover:shadow-[0_14px_36px_rgba(225,48,108,0.42),0_0_28px_rgba(131,58,180,0.25)] hover:ring-pink-400/35",
};

const SocialIcon: React.FC<SocialIconProps> = ({ href, icon, label, variant }) => (
  <a
    href={href}
    className={`${socialBaseStyles} ${socialDefaultStyles[variant]} ${socialHoverStyles[variant]}`}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`${label} (opens in new tab)`}
  >
    <span className="flex h-full w-full items-center justify-center">
      {variant === "instagram" ? <InstagramSocialGlyph size={22} /> : icon}
    </span>
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900/95 px-3 py-1.5 text-xs font-medium tracking-wide text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-all duration-300 ease-out group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {socialTooltipLabels[variant]}
      <span
        className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900/95"
        aria-hidden
      />
    </span>
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

            <div className="mb-8 max-w-md">
              <h4 className="text-sm font-bold uppercase tracking-[0.22em] text-slate-800">
                Follow Us
              </h4>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-500/95">
                Connect with NaukriMili for jobs, hiring updates and career opportunities.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3 sm:gap-4">
                <SocialIcon href="https://facebook.com/naukrimili" icon={<FiFacebook size={22} />} label="Facebook" variant="facebook" />
                <SocialIcon href="https://twitter.com/naukrimili" icon={<FiTwitter size={22} />} label="Twitter" variant="twitter" />
                <SocialIcon href="https://www.linkedin.com/in/mr-s-jaffrey-9057603a8/" icon={<FiLinkedin size={22} />} label="LinkedIn" variant="linkedin" />
                <SocialIcon href="https://www.instagram.com/naukrimili.placement.agency/" label="Instagram" variant="instagram" />
              </div>
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
