"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
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
  const { toast } = useToast();

  // Generate job URL
  const jobUrl = typeof window !== 'undefined' ? `${window.location.origin}/jobs/${job.id}` : '';
  
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

  return (
    <div className={`relative ${className}`}>
      {/* Share Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="lg"
        className="flex items-center gap-2 sm:gap-3 bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 hover:text-white font-bold px-3 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-300 text-sm sm:text-base"
      >
        <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">Share Job</span>
        <span className="sm:hidden">Share</span>
      </Button>

      {/* Share Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal - Responsive positioning and sizing */}
          <div className="fixed sm:absolute top-1/2 sm:top-full left-1/2 sm:left-auto sm:right-0 transform -translate-x-1/2 sm:translate-x-0 -translate-y-1/2 sm:translate-y-0 sm:mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden mx-4 sm:mx-0">
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Share Job</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Share this opportunity with your network
              </p>
            </div>

            {/* Share Options */}
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 sm:gap-3">
                {/* Native Share (Mobile) */}
                {navigator.share && (
                  <Button
                    onClick={handleNativeShare}
                    variant="outline"
                    className="flex flex-col items-center gap-1 sm:gap-2 h-16 sm:h-20 p-2 sm:p-3 hover:bg-gray-50"
                  >
                    <Share2 className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">Share</span>
                  </Button>
                )}

                {/* WhatsApp */}
                <Button
                  onClick={() => handleExternalShare(shareUrls.whatsapp)}
                  variant="outline"
                  className="flex flex-col items-center gap-1 sm:gap-2 h-16 sm:h-20 p-2 sm:p-3 hover:bg-green-50 hover:border-green-200"
                >
                  <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">WhatsApp</span>
                </Button>

                {/* LinkedIn */}
                <Button
                  onClick={() => handleExternalShare(shareUrls.linkedin)}
                  variant="outline"
                  className="flex flex-col items-center gap-1 sm:gap-2 h-16 sm:h-20 p-2 sm:p-3 hover:bg-blue-50 hover:border-blue-200"
                >
                  <Linkedin className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">LinkedIn</span>
                </Button>

                {/* Twitter/X */}
                <Button
                  onClick={() => handleExternalShare(shareUrls.twitter)}
                  variant="outline"
                  className="flex flex-col items-center gap-1 sm:gap-2 h-16 sm:h-20 p-2 sm:p-3 hover:bg-gray-50 hover:border-gray-200"
                >
                  <Twitter className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Twitter/X</span>
                </Button>

                {/* Email */}
                <Button
                  onClick={() => handleExternalShare(shareUrls.email)}
                  variant="outline"
                  className="flex flex-col items-center gap-1 sm:gap-2 h-16 sm:h-20 p-2 sm:p-3 hover:bg-red-50 hover:border-red-200"
                >
                  <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Email</span>
                </Button>

                {/* Instagram */}
                <Button
                  onClick={handleInstagramShare}
                  variant="outline"
                  className="flex flex-col items-center gap-1 sm:gap-2 h-16 sm:h-20 p-2 sm:p-3 hover:bg-pink-50 hover:border-pink-200"
                >
                  <Instagram className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Instagram</span>
                </Button>

                {/* Copy Link */}
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="flex flex-col items-center gap-1 sm:gap-2 h-16 sm:h-20 p-2 sm:p-3 hover:bg-purple-50 hover:border-purple-200"
                >
                  {copied ? (
                    <Check className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  )}
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    {copied ? 'Copied!' : 'Copy Link'}
                  </span>
                </Button>
              </div>

              {/* Job Preview */}
              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Preview:</div>
                <div className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2">
                  {job.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {job.company}{job.location && ` • ${job.location}`}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
