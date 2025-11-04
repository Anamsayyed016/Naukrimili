"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Cookie, CheckCircle, XCircle, Settings, Shield, Eye, Target } from 'lucide-react';

export default function CookiePolicyPage() {
  const [cookieConsent, setCookieConsent] = useState<boolean | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    } else {
      setCookieConsent(consent === 'accepted');
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setCookieConsent(true);
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setCookieConsent(false);
    setShowBanner(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
            <Cookie className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading text-gray-900">
            Cookie Policy
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Learn how NaukriMili uses cookies to enhance your experience
          </p>
        </div>

        {/* Cookie Consent Banner */}
        {showBanner && (
          <Card className="shadow-2xl border-0 rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Cookie className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">We Use Cookies</h3>
                  <p className="text-gray-600">
                    We use cookies to improve your experience, analyze site traffic, and personalize content. 
                    By clicking "Accept", you consent to our use of cookies.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button
                    onClick={handleAccept}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    onClick={handleDecline}
                    variant="outline"
                    className="border-gray-300"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Consent Status */}
        {cookieConsent !== null && (
          <Card className="shadow-lg border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {cookieConsent ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Cookies Accepted</p>
                      <p className="text-sm text-gray-600">You have accepted our cookie policy</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Cookies Declined</p>
                      <p className="text-sm text-gray-600">You have declined our cookie policy</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cookie Types */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-lg border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Essential Cookies</h3>
                  <p className="text-gray-600 text-sm">
                    Required for the website to function properly. These cannot be disabled.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Eye className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Analytics Cookies</h3>
                  <p className="text-gray-600 text-sm">
                    Help us understand how visitors interact with our website.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Marketing Cookies</h3>
                  <p className="text-gray-600 text-sm">
                    Used to deliver personalized advertisements relevant to you.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Settings className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Preference Cookies</h3>
                  <p className="text-gray-600 text-sm">
                    Remember your settings and preferences for a better experience.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Policy */}
        <Card className="shadow-2xl border-0 rounded-3xl overflow-hidden">
          <CardContent className="p-8 sm:p-12 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are Cookies?</h2>
              <p className="text-gray-600 leading-relaxed">
                Cookies are small text files that are placed on your device when you visit our website. 
                They help us provide you with a better experience by remembering your preferences and 
                understanding how you use our platform.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Cookies</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-600">
                    <strong>Authentication:</strong> Keep you signed in to your account securely
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-600">
                    <strong>Preferences:</strong> Remember your job search filters and settings
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-600">
                    <strong>Analytics:</strong> Understand which features are most useful to improve our service
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-600">
                    <strong>Marketing:</strong> Show you relevant job opportunities and career content
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Managing Your Cookie Preferences</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                You can change your cookie preferences at any time using the buttons below. 
                Note that disabling certain cookies may affect your experience on our platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleAccept}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Accept All Cookies
                </Button>
                <Button
                  onClick={handleDecline}
                  variant="outline"
                  className="border-gray-300 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Decline Optional Cookies
                </Button>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-500">
                Last updated: November 2024. For more information, please read our{' '}
                <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                {' '}and{' '}
                <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

