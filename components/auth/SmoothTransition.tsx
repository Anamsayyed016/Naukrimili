'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface SmoothTransitionProps {
  message?: string;
  role?: 'jobseeker' | 'employer';
}

export default function SmoothTransition({ message, role }: SmoothTransitionProps) {
  const roleMessages = {
    jobseeker: {
      title: 'Setting up your Job Seeker Dashboard',
      subtitle: 'Preparing personalized job recommendations...',
      color: 'blue'
    },
    employer: {
      title: 'Setting up your Employer Dashboard',
      subtitle: 'Loading your company profile and job postings...',
      color: 'green'
    }
  };

  const config = role ? roleMessages[role] : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center max-w-md px-6"
      >
        {/* Animated Logo/Icon */}
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity }
          }}
          className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br ${
            config?.color === 'blue' 
              ? 'from-blue-500 to-blue-600' 
              : config?.color === 'green'
              ? 'from-green-500 to-green-600'
              : 'from-purple-500 to-purple-600'
          } rounded-2xl flex items-center justify-center shadow-lg`}
        >
          <Loader2 className="w-10 h-10 text-white" />
        </motion.div>

        {/* Message */}
        {config ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {config.title}
            </h2>
            <p className="text-gray-600">
              {config.subtitle}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {message || 'Just a moment...'}
            </h2>
            <p className="text-gray-600">
              We're preparing your experience
            </p>
          </>
        )}

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className={`w-2 h-2 rounded-full ${
                config?.color === 'blue' 
                  ? 'bg-blue-600' 
                  : config?.color === 'green'
                  ? 'bg-green-600'
                  : 'bg-purple-600'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

