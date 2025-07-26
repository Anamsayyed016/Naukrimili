// Nexus Auth CTA - Completely Unique Authenticated User Experience
// Features: Profile completion alerts, Feature unlock notifications, Personalized recommendations

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

interface NexusAuthCTAProps {
  variant?: 'dashboard' | 'sidebar' | 'notification' | 'banner';
  user?: any;
}

export default function NexusAuthCTA({ variant = 'dashboard', user }: NexusAuthCTAProps) {
  const { user: authUser } = useAuth();
  const [currentAlert, setCurrentAlert] = useState(0);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const currentUser = user || authUser;

  const alerts = [
    {
      type: 'profile',
      icon: '📝',
      title: 'Complete Your Profile',
      description: 'Add your skills and experience to get better job matches',
      progress: currentUser?.profileCompletion || 0,
      action: 'Complete Profile',
      link: '/nexus/profile-setup',
      color: 'from-blue-500 to-cyan-500',
      priority: 'high'
    },
    {
      type: 'resume',
      icon: '📄',
      title: 'Upload Your Resume',
      description: 'Stand out to employers with a professional resume',
      action: 'Upload Resume',
      link: '/nexus/resume-upload',
      color: 'from-purple-500 to-pink-500',
      priority: 'medium'
    },
    {
      type: 'skills',
      icon: '🎯',
      title: 'Add Your Skills',
      description: 'Help AI find the perfect jobs for your expertise',
      action: 'Add Skills',
      link: '/nexus/skills',
      color: 'from-emerald-500 to-teal-500',
      priority: 'medium'
    },
    {
      type: 'preferences',
      icon: '⚙️',
      title: 'Set Job Preferences',
      description: 'Customize your job search criteria',
      action: 'Set Preferences',
      link: '/nexus/preferences',
      color: 'from-orange-500 to-red-500',
      priority: 'low'
    }
  ];

  const recommendations = [
    {
      type: 'job',
      title: 'Senior React Developer',
      company: 'TechCorp Inc.',
      salary: '$120K - $150K',
      match: 95,
      icon: '💼'
    },
    {
      type: 'skill',
      title: 'Learn TypeScript',
      description: 'Based on your React experience',
      progress: 0,
      icon: '📚'
    },
    {
      type: 'network',
      title: 'Connect with Sarah Chen',
      description: 'Senior Developer at Google',
      mutual: 3,
      icon: '🤝'
    }
  ];

  const unlockedFeatures = [
    {
      name: 'AI Job Matching',
      description: 'Get personalized job recommendations',
      icon: '🤖',
      unlocked: true
    },
    {
      name: 'Instant Apply',
      description: 'Apply to multiple jobs with one click',
      icon: '⚡',
      unlocked: currentUser?.profileCompletion > 50
    },
    {
      name: 'Salary Insights',
      description: 'See salary ranges for your role',
      icon: '💰',
      unlocked: currentUser?.profileCompletion > 70
    },
    {
      name: 'Interview Prep',
      description: 'AI-powered interview coaching',
      icon: '🎤',
      unlocked: currentUser?.profileCompletion > 90
    }
  ];

  // Auto-rotate alerts
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAlert((prev) => (prev + 1) % alerts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [alerts.length]);

  // Intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    
    const element = document.getElementById('nexus-auth-cta');
    if (element) observer.observe(element);
    
    return () => observer.disconnect();
  }, []);

  // Dashboard variant
  if (variant === 'dashboard') {
    return (
      <div id="nexus-auth-cta" className="space-y-6">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border border-purple-500/30 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome back, {currentUser?.name || 'User'}! 👋
              </h2>
              <p className="text-purple-200">
                Your profile is {currentUser?.profileCompletion || 0}% complete
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {currentUser?.profileCompletion || 0}%
              </div>
              <div className="text-purple-300 text-sm">Complete</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 bg-white/10 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${currentUser?.profileCompletion || 0}%` }}
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
            />
          </div>
        </motion.div>

        {/* Priority Alerts */}
        <div className="grid md:grid-cols-2 gap-4">
          {alerts.filter(alert => alert.priority === 'high').map((alert, index) => (
            <motion.div
              key={alert.type}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-r ${alert.color} rounded-xl p-6 text-white`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">{alert.icon}</span>
                    <h3 className="font-semibold">{alert.title}</h3>
                  </div>
                  <p className="text-white/80 text-sm mb-4">{alert.description}</p>
                  <Link href={alert.link}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all text-sm font-medium"
                    >
                      {alert.action}
                    </motion.button>
                  </Link>
                </div>
                {alert.progress !== undefined && (
                  <div className="text-right">
                    <div className="text-2xl font-bold">{alert.progress}%</div>
                    <div className="text-white/60 text-sm">Complete</div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Unlocked Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">Your Unlocked Features</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {unlockedFeatures.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isVisible ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={`text-center p-4 rounded-lg ${
                  feature.unlocked 
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30' 
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <div className="text-3xl mb-2">{feature.icon}</div>
                <h4 className="font-semibold text-white mb-1">{feature.name}</h4>
                <p className="text-purple-300 text-xs">{feature.description}</p>
                {!feature.unlocked && (
                  <div className="mt-2 text-xs text-purple-400">
                    Complete profile to unlock
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Personalized Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6 }}
          className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Recommended for You</h3>
            <button
              onClick={() => setShowRecommendations(!showRecommendations)}
              className="text-purple-300 hover:text-white transition-colors"
            >
              {showRecommendations ? 'Show Less' : 'Show More'}
            </button>
          </div>
          
          <div className="space-y-3">
            {recommendations.slice(0, showRecommendations ? recommendations.length : 2).map((rec, index) => (
              <motion.div
                key={rec.title}
                initial={{ opacity: 0, x: -20 }}
                animate={isVisible ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
              >
                <span className="text-2xl">{rec.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{rec.title}</h4>
                  <p className="text-purple-300 text-sm">
                    {rec.company || rec.description}
                    {rec.salary && ` • ${rec.salary}`}
                    {rec.match && ` • ${rec.match}% match`}
                  </p>
                </div>
                {rec.type === 'job' && (
                  <div className="text-right">
                    <div className="text-green-400 font-semibold">{rec.match}%</div>
                    <div className="text-purple-300 text-xs">Match</div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Sidebar variant
  if (variant === 'sidebar') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-4"
      >
        {/* Quick Stats */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{currentUser?.profileCompletion || 0}%</div>
            <div className="text-purple-300 text-sm">Profile Complete</div>
          </div>
        </div>

        {/* Next Action */}
        {alerts.filter(alert => alert.priority === 'high').slice(0, 1).map((alert) => (
          <div key={alert.type} className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-xl">{alert.icon}</span>
              <h4 className="font-semibold text-white">{alert.title}</h4>
            </div>
            <p className="text-purple-200 text-sm mb-3">{alert.description}</p>
            <Link href={alert.link}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full px-3 py-2 bg-white/20 rounded text-white text-sm font-medium hover:bg-white/30 transition-all"
              >
                {alert.action}
              </motion.button>
            </Link>
          </div>
        ))}
      </motion.div>
    );
  }

  // Notification variant
  if (variant === 'notification') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 right-4 z-50 max-w-sm"
      >
        <AnimatePresence>
          {alerts.map((alert, index) => (
            index === currentAlert && (
              <motion.div
                key={alert.type}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                className={`bg-gradient-to-r ${alert.color} rounded-lg p-4 text-white shadow-lg`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{alert.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{alert.title}</h4>
                    <p className="text-white/80 text-sm mb-3">{alert.description}</p>
                    <Link href={alert.link}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1 bg-white/20 rounded text-sm font-medium hover:bg-white/30 transition-all"
                      >
                        {alert.action}
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Banner variant
  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border-b border-purple-500/30"
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-xl">🎯</span>
              <div>
                <h4 className="font-semibold text-white">Complete your profile to unlock premium features</h4>
                <p className="text-purple-200 text-sm">Get better job matches and exclusive opportunities</p>
              </div>
            </div>
            <Link href="/nexus/profile-setup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-white/20 rounded text-white font-medium hover:bg-white/30 transition-all"
              >
                Complete Profile
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
} 