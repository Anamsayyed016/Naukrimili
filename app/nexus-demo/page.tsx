'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import NexusGuestCTA from '@/components/NexusGuestCTA';
import NexusAuthCTA from '@/components/NexusAuthCTA';
import NexusLogin from '@/components/NexusLogin';
import NexusOnboarding from '@/components/NexusOnboarding';
import NexusAuthGuard from '@/components/NexusAuthGuard';
import { AnimatePresence } from 'framer-motion';

export default function NexusDemoPage() {
  const [currentDemo, setCurrentDemo] = useState('guest');
  const [showLogin, setShowLogin] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const demos = [
    { id: 'guest', name: 'Guest Experience', icon: '👋' },
    { id: 'auth', name: 'Authenticated User', icon: '🔐' },
    { id: 'login', name: 'Login System', icon: '🚀' },
    { id: 'onboarding', name: 'Profile Setup', icon: '📝' },
    { id: 'protected', name: 'Protected Routes', icon: '🛡️' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Navigation */}
      <div className="bg-white/10 backdrop-blur border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Nexus Authentication Demo</h1>
            <div className="flex space-x-2">
              {demos.map((demo) => (
                <motion.button
                  key={demo.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentDemo(demo.id)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    currentDemo === demo.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-purple-300 hover:bg-white/20'
                  }`}
                >
                  <span className="mr-2">{demo.icon}</span>
                  {demo.name}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          key={currentDemo}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Guest Experience Demo */}
          {currentDemo === 'guest' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Guest Experience</h2>
                <p className="text-purple-300">Showcasing unique guest call-to-action components</p>
              </div>
              
              <div className="space-y-12">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Hero Section</h3>
                  <NexusGuestCTA variant="hero" />
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Sidebar CTA</h3>
                    <NexusGuestCTA variant="sidebar" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Floating CTA</h3>
                    <NexusGuestCTA variant="floating" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Modal CTA</h3>
                  <NexusGuestCTA variant="modal" />
                </div>
              </div>
            </div>
          )}

          {/* Authenticated User Demo */}
          {currentDemo === 'auth' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Authenticated User Experience</h2>
                <p className="text-purple-300">Showcasing personalized user dashboard and alerts</p>
              </div>
              
              <div className="space-y-12">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Dashboard Alerts</h3>
                  <NexusAuthCTA variant="dashboard" />
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Sidebar Alerts</h3>
                    <NexusAuthCTA variant="sidebar" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Notification Alerts</h3>
                    <NexusAuthCTA variant="notification" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">Banner Alert</h3>
                  <NexusAuthCTA variant="banner" />
                </div>
              </div>
            </div>
          )}

          {/* Login System Demo */}
          {currentDemo === 'login' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Unique Login System</h2>
                <p className="text-purple-300">Showcasing biometric, voice, gesture, and traditional authentication</p>
              </div>
              
              <div className="flex justify-center">
                <div className="w-full max-w-md">
                  <NexusLogin />
                </div>
              </div>
            </div>
          )}

          {/* Profile Setup Demo */}
          {currentDemo === 'onboarding' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Profile Setup Wizard</h2>
                <p className="text-purple-300">Showcasing voice-guided, auto-save, and holographic progress tracking</p>
              </div>
              
              <NexusOnboarding />
            </div>
          )}

          {/* Protected Routes Demo */}
          {currentDemo === 'protected' && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Protected Route System</h2>
                <p className="text-purple-300">Showcasing holographic loading, biometric prompts, and elegant redirects</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Role-Based Access</h3>
                  <p className="text-purple-300 mb-4">
                    Different user roles have access to different dashboard areas:
                  </p>
                  <ul className="space-y-2 text-purple-200">
                    <li>• <strong>Talent:</strong> Job seeker dashboard</li>
                    <li>• <strong>Enterprise:</strong> Employer dashboard</li>
                    <li>• <strong>Curator:</strong> Admin dashboard</li>
                  </ul>
                </div>
                
                <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Profile Completion</h3>
                  <p className="text-purple-300 mb-4">
                    Users with incomplete profiles are redirected to setup:
                  </p>
                  <ul className="space-y-2 text-purple-200">
                    <li>• <strong>0-25%:</strong> Basic access only</li>
                    <li>• <strong>26-50%:</strong> Limited features</li>
                    <li>• <strong>51-75%:</strong> Most features</li>
                    <li>• <strong>76-100%:</strong> Full access</li>
                  </ul>
                </div>
              </div>
              
              <div className="text-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowLogin(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all"
                >
                  Test Protected Route
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-8 max-w-md w-full"
            >
              <div className="text-center space-y-6">
                <h2 className="text-2xl font-bold text-white">Test Authentication</h2>
                <p className="text-purple-300">
                  Try logging in to see the protected route system in action
                </p>
                <NexusLogin onSuccess={() => setShowLogin(false)} />
                <button
                  onClick={() => setShowLogin(false)}
                  className="text-purple-300 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 