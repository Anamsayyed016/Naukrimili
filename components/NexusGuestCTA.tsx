// Nexus Guest CTA - Completely Unique Guest Experience
// Features: Animated tiles, Hover-triggered hints, Innovative incentivization

'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface NexusGuestCTAProps {
  variant?: 'hero' | 'sidebar' | 'floating' | 'modal';
  theme?: 'dark' | 'light' | 'holographic'}

export default function NexusGuestCTA({ variant = 'hero', theme = 'dark' }: NexusGuestCTAProps) {
  const [currentTile, setCurrentTile] = useState(0);
  const [showHoverHint, setShowHoverHint] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const tiles = [
    {
      icon: '🚀',
      title: 'Launch Your Career',
      description: 'Join 50,000+ professionals who found their dream jobs',
      color: 'from-purple-500 to-pink-500',
      delay: 0
    },
    {
      icon: '🎯',
      title: 'AI-Powered Matching',
      description: 'Get personalized job recommendations based on your skills',
      color: 'from-blue-500 to-cyan-500',
      delay: 0.2
    },
    {
      icon: '💎',
      title: 'Premium Features',
      description: 'Unlock advanced tools and exclusive opportunities',
      color: 'from-emerald-500 to-teal-500',
      delay: 0.4
    },
    {
      icon: '🌟',
      title: 'Success Stories',
      description: 'See how others transformed their careers with us',
      color: 'from-orange-500 to-red-500',
      delay: 0.6
    }
  ];

  const benefits = [
    '🎯 95% job match accuracy',
    '⚡ Apply to 100+ jobs instantly',
    '📈 3x faster interview process',
    '💰 Average 40% salary increase'
  ];

  // Auto-rotate tiles
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTile((prev) => (prev + 1) % tiles.length)}, 4000);
    return () => clearInterval(interval)}, [tiles.length]);

  // Intersection observer for visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    
    const element = document.getElementById('nexus-guest-cta');
    if (element) observer.observe(element);
    
    return () => observer.disconnect()}, []);

  // Hero variant
  if (variant === 'hero') {
    return (
      <div id="nexus-guest-cta" className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
          <motion.div
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-cyan-500/10"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="text-5xl lg:text-6xl font-bold text-white leading-tight"
                >
                  Your Career
                  <span className="block bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Awaits
                  </span>
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="text-xl text-purple-200 leading-relaxed"
                >
                  Join the future of job hunting with AI-powered matching, 
                  instant applications, and personalized career guidance.
                </motion.p>
              </div>

              {/* Benefits List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="space-y-3"
              >
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isVisible ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                    className="flex items-center space-x-3 text-purple-200"
                  >
                    <span className="text-2xl">{benefit.split(' ')[0]}</span>
                    <span>{benefit.split(' ').slice(1).join(' ')}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/nexus/register">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all shadow-lg"
                  >
                    Get Started Free
                  </motion.button>
                </Link>
                
                <Link href="/nexus/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all"
                  >
                    Sign In
                  </motion.button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Content - Animated Tiles */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="grid grid-cols-2 gap-4">
                {tiles.map((tile, index) => (
                  <motion.div
                    key={tile.title}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isVisible ? { opacity: 1, scale: 1 } : {}}
                    transition={{ delay: tile.delay, duration: 0.6 }}
                    whileHover={{ 
                      scale: 1.05,
                      rotateY: 5,
                      transition: { duration: 0.2 }
                    }}
                    className={`relative p-6 rounded-xl bg-gradient-to-br ${tile.color} cursor-pointer group`}
                    onClick={() => setCurrentTile(index)}
                  >
                    <div className="text-4xl mb-3">{tile.icon}</div>
                    <h3 className="text-white font-semibold mb-2">{tile.title}</h3>
                    <p className="text-white/80 text-sm">{tile.description}</p>
                    
                    {/* Hover Effect */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute inset-0 bg-white/10 rounded-xl"
                    />
                  </motion.div>
                ))}
              </div>

              {/* Floating Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="absolute -bottom-8 -left-8 bg-white/10 backdrop-blur border border-white/20 rounded-lg p-4"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">50K+</div>
                  <div className="text-purple-300 text-sm">Active Users</div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.4, duration: 0.8 }}
                className="absolute -top-8 -right-8 bg-white/10 backdrop-blur border border-white/20 rounded-lg p-4"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">95%</div>
                  <div className="text-purple-300 text-sm">Success Rate</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>)}

  // Sidebar variant
  if (variant === 'sidebar') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-6"
      >
        <div className="text-center space-y-4">
          <div className="text-4xl">🚀</div>
          <h3 className="text-white font-semibold">Ready to Level Up?</h3>
          <p className="text-purple-300 text-sm">
            Join thousands of professionals who found their dream jobs
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-purple-300">
              <span>Job Match Accuracy</span>
              <span className="font-semibold text-green-400">95%</span>
            </div>
            <div className="flex items-center justify-between text-xs text-purple-300">
              <span>Average Salary Increase</span>
              <span className="font-semibold text-green-400">40%</span>
            </div>
            <div className="flex items-center justify-between text-xs text-purple-300">
              <span>Time to Interview</span>
              <span className="font-semibold text-green-400">3x Faster</span>
            </div>
          </div>

          <Link href="/nexus/register">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all"
            >
              Get Started Free
            </motion.button>
          </Link>
        </div>
      </motion.div>)}

  // Floating variant
  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onHoverStart={() => setShowHoverHint(true)}
          onHoverEnd={() => setShowHoverHint(false)}
          className="relative"
        >
          <Link href="/nexus/register">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer">
              <span className="text-2xl">🚀</span>
            </div>
          </Link>

          <AnimatePresence>
            {showHoverHint && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute bottom-full right-0 mb-2 w-64 bg-white/10 backdrop-blur border border-white/20 rounded-lg p-4"
              >
                <div className="text-white text-sm">
                  <div className="font-semibold mb-1">Ready to start?</div>
                  <div className="text-purple-300">Join 50K+ professionals who found their dream jobs!</div>
                </div>
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white/10"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>)}

  // Modal variant
  if (variant === 'modal') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-8 max-w-md w-full"
        >
          <div className="text-center space-y-6">
            <div className="text-6xl">🎯</div>
            <h2 className="text-2xl font-bold text-white">Unlock Your Potential</h2>
            <p className="text-purple-300">
              Join our community of professionals and discover opportunities that match your skills and aspirations.
            </p>

            <div className="space-y-3">
              {benefits.slice(0, 2).map((benefit) => (
                <div key={benefit} className="flex items-center space-x-3 text-purple-200">
                  <span className="text-xl">{benefit.split(' ')[0]}</span>
                  <span className="text-sm">{benefit.split(' ').slice(1).join(' ')}</span>
                </div>
              ))}
            </div>

            <div className="flex space-x-4">
              <Link href="/nexus/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all"
                >
                  Get Started
                </motion.button>
              </Link>
              
              <Link href="/nexus/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all"
                >
                  Sign In
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>)}

  return null} 