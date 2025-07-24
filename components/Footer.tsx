"use client";

import Link from 'next/link';
import { Facebook, Twitter, Linkedin, Instagram, Mail } from 'lucide-react';

export interface FooterProps {}

const Footer: React.FC<FooterProps> = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="brand-logo text-white">NaukriMili</h3>
            <div className="space-y-2">
              <p className="brand-tagline text-gray-300">Find Your Perfect Job Match</p>
              <p className="text-sm text-gray-400">
                Connecting talented professionals with their dream careers across India.
              </p>
            </div>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/jobs" className="hover:text-primary transition-colors">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link href="/companies" className="hover:text-primary transition-colors">
                  Companies
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* For Job Seekers */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">For Job Seekers</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/profile" className="hover:text-primary transition-colors">
                  Create Profile
                </Link>
              </li>
              <li>
                <Link href="/resume-upload" className="hover:text-primary transition-colors">
                  Upload Resume
                </Link>
              </li>
              <li>
                <Link href="/job-alerts" className="hover:text-primary transition-colors">
                  Job Alerts
                </Link>
              </li>
              <li>
                <Link href="/career-tips" className="hover:text-primary transition-colors">
                  Career Tips
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Contact Us</h4>
            <div className="space-y-2">
              <p className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>support@naukrimili.com</span>
              </p>
              <address className="not-italic text-sm text-gray-400">
                NaukriMili Headquarters<br />
                123 Employment Street<br />
                Mumbai, Maharashtra 400001<br />
                India
              </address>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm">
              © {currentYear} NaukriMili. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <Link href="/terms" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="hover:text-primary transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
