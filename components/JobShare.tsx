"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from "@/components/ui/button";
import { getJobUrl } from '@/components/SEOJobLink';
import { getAbsoluteUrl } from '@/lib/url-utils';
import { 
  Share2, 
  MessageCircle, 
  Linkedin, 
  Twitter, 
  Mail, 
  Instagram, 
  Copy, 
  Check,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JobShareProps {
  job: {
    id: string;
    title: string;
    company: string | null;
    location: string | null;
  };
  className?: string;
}

export default function JobShare({ job, className = "" }: JobShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  // Check if device is mobile (only after mount to prevent hydration mismatch)
  useEffect(() => {
    setIsMounted(true);
    
    // Only check mobile after mount to prevent hydration mismatch
    if (typeof window !== 'undefined') {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // Generate SEO-friendly job URL using canonical base URL
  const jobUrl = getAbsoluteUrl(getJobUrl(job));
  
  // Generate share text
  const shareText = `Check out this job opportunity: ${job.title} at ${job.company || 'Company'}${job.location ? ` in ${job.location}` : ''}`;
  
  // Share URLs
  const shareUrls = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} - ${jobUrl}`)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(jobUrl)}`,
    email: `mailto:?subject=${encodeURIComponent(`Job Opportunity: ${job.title}`)}&body=${encodeURIComponent(`${shareText}\n\nView job: ${jobUrl}`)}`,
  };

  // Handle native Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Job Opportunity: ${job.title}`,
          text: shareText,
          url: jobUrl,
        });
        setIsOpen(false);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  // Handle copy to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(jobUrl);
      setCopied(true);
      toast({
        title: "Success",
        description: "Link copied to clipboard!",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  // Handle Instagram (copy link with special message)
  const handleInstagramShare = async () => {
    try {
      await navigator.clipboard.writeText(jobUrl);
      toast({
        title: "Success",
        description: "✅ Link copied! Paste it in your Instagram story or post.",
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  // Handle external share
  const handleExternalShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const modalContent = isOpen && isMounted ? (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
        style={{ zIndex: 10000 }}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 10001 }}>
        <div 
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md max-h-[90vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'relative', zIndex: 10001 }}
        >
              {/* Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Share Job</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Share this opportunity with your network
                </p>
              </div>

              {/* Share Options */}
              <div className="p-3 sm:p-4 max-h-[60vh] overflow-y-auto" style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3">
                  {/* WhatsApp */}
                  <Button
                    onClick={() => handleExternalShare(shareUrls.whatsapp)}
                    variant="outline"
                    className="flex flex-col items-center gap-1 sm:gap-2 h-16 sm:h-20 p-2 sm:p-3 hover:bg-green-50 hover:border-green-200 border-gray-200 touch-target w-full"
                  >
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    <span className="text-[10px] sm:text-xs font-medium text-gray-700 text-center leading-tight">WhatsApp</span>
                  </Button>

                  {/* LinkedIn */}
                  <Button
                    onClick={() => handleExternalShare(shareUrls.linkedin)}
                    variant="outline"
                    className="flex flex-col items-center gap-1 sm:gap-2 h-16 sm:h-20 p-2 sm:p-3 hover:bg-blue-50 hover:border-blue-200 border-gray-200 touch-target w-full"
                  >
                    <Linkedin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <span className="text-[10px] sm:text-xs font-medium text-gray-700 text-center leading-tight">LinkedIn</span>
                  </Button>

                  {/* Twitter/X */}
                  <Button
                    onClick={() => handleExternalShare(shareUrls.twitter)}
                    variant="outline"
                    className="flex flex-col items-center gap-1 sm:gap-2 h-16 sm:h-20 p-2 sm:p-3 hover:bg-gray-50 hover:border-gray-200 border-gray-200 touch-target w-full"
                  >
                    <Twitter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                    <span className="text-[10px] sm:text-xs font-medium text-gray-700 text-center leading-tight">Twitter</span>
                  </Button>

                  {/* Email */}
                  <Button
                    onClick={() => handleExternalShare(shareUrls.email)}
                    variant="outline"
                    className="flex flex-col items-center gap-1 sm:gap-2 h-16 sm:h-20 p-2 sm:p-3 hover:bg-red-50 hover:border-red-200 border-gray-200 touch-target w-full"
                  >
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    <span className="text-[10px] sm:text-xs font-medium text-gray-700 text-center leading-tight">Email</span>
                  </Button>

                  {/* Instagram */}
                  <Button
                    onClick={handleInstagramShare}
                    variant="outline"
                    className="flex flex-col items-center gap-1 sm:gap-2 h-16 sm:h-20 p-2 sm:p-3 hover:bg-pink-50 hover:border-pink-200 border-gray-200 touch-target w-full"
                  >
                    <Instagram className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600" />
                    <span className="text-[10px] sm:text-xs font-medium text-gray-700 text-center leading-tight">Instagram</span>
                  </Button>

                  {/* Copy Link */}
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="flex flex-col items-center gap-1 sm:gap-2 h-16 sm:h-20 p-2 sm:p-3 hover:bg-purple-50 hover:border-purple-200 border-gray-200 touch-target w-full"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    )}
                    <span className="text-[10px] sm:text-xs font-medium text-gray-700 text-center leading-tight">
                      {copied ? 'Copied!' : 'Copy'}
                    </span>
                  </Button>
                </div>

                {/* Job Preview */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-2 font-medium">Preview:</div>
                  <div className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                    {job.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span>{job.company}</span>
                    {job.location && (
                      <>
                        <span>•</span>
                        <span>{job.location}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-400 break-all">
                    {jobUrl}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null;

  return (
    <>
      <style jsx>{`
        .touch-target {
          min-height: 44px;
          min-width: 44px;
        }
        
        @media (max-width: 640px) {
          .touch-target {
            min-height: 48px;
            min-width: 48px;
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      
      <div className={`relative ${className}`}>
        {/* Share Button */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-white/90 backdrop-blur-sm border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium px-3 py-2 rounded-lg transition-all duration-200 text-sm min-w-[44px] min-h-[44px] touch-target"
        >
          <Share2 className="w-4 h-4 flex-shrink-0" />
          <span className="hidden xs:inline">Share</span>
        </Button>
      </div>
      
      {/* Portal Modal to Body */}
      {isMounted && typeof window !== 'undefined' && createPortal(
        modalContent,
        document.body
      )}
    </>
  );
}