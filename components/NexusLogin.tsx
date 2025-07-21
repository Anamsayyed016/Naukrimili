// Nexus Login Component - Completely Unique Implementation
// Features: Biometric-style auth, Voice activation, Gesture patterns, Holographic UI

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useNexusAuth } from '@/hooks/use-nexus-auth';
import { AuthMethod } from '@/lib/nexus-auth';

interface NexusLoginProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export default function NexusLogin({ onSuccess, redirectTo = '/nexus/dashboard' }: NexusLoginProps) {
  const { login, register, isLoading, error, clearError, authMethod, switchAuthMethod } = useNexusAuth();
  const router = useRouter();
  
  const [currentMethod, setCurrentMethod] = useState<AuthMethod>('traditional');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  
  // Traditional auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Voice auth state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSignature, setVoiceSignature] = useState('');
  
  // Gesture auth state
  const [gesturePattern, setGesturePattern] = useState<number[]>([]);
  const [isDrawingGesture, setIsDrawingGesture] = useState(false);
  
  // Biometric auth state
  const [biometricData, setBiometricData] = useState('');
  
  // UI state
  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);

  // Handle method selection
  const handleMethodSelect = (method: AuthMethod) => {
    setCurrentMethod(method);
    switchAuthMethod(method);
    setShowMethodSelector(false);
    setCurrentStep(0);
    clearError();
  };

  // Traditional login/register
  const handleTraditionalAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegistering) {
      const success = await register({
        email,
        name,
        password,
        role: 'talent',
        authMethod: 'traditional'
      });
      
      if (success) {
        handleSuccess();
      }
    } else {
      const success = await login({
        email,
        password
      });
      
      if (success) {
        handleSuccess();
      }
    }
  };

  // Voice authentication
  const handleVoiceAuth = async () => {
    if (!isRecording) {
      setIsRecording(true);
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        voiceRecorderRef.current = mediaRecorder;
        
        const audioChunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const signature = await generateVoiceSignature(audioBlob);
          setVoiceSignature(signature);
          
          if (isRegistering) {
            const success = await register({
              email,
              name,
              role: 'talent',
              authMethod: 'voice',
              voiceSignature: signature
            });
            
            if (success) handleSuccess();
          } else {
            const success = await login({
              email,
              voiceSignature: signature
            });
            
            if (success) handleSuccess();
          }
        };
        
        mediaRecorder.start();
        
        // Stop recording after 3 seconds
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            stream.getTracks().forEach(track => track.stop());
          }
          setIsRecording(false);
        }, 3000);
        
      } catch (error) {
        setIsRecording(false);
        console.error('Voice recording failed:', error);
      }
    }
  };

  // Gesture authentication
  const handleGestureAuth = () => {
    if (!isDrawingGesture) {
      setIsDrawingGesture(true);
      initializeGestureCanvas();
    }
  };

  const initializeGestureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pattern: number[] = [];
    let isDrawing = false;
    const gridSize = 3;
    const cellSize = canvas.width / gridSize;

    const getCellFromPoint = (x: number, y: number): number => {
      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);
      return row * gridSize + col;
    };

    const drawPattern = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      for (let i = 1; i < gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();
      }

      // Draw pattern
      if (pattern.length > 0) {
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        for (let i = 0; i < pattern.length; i++) {
          const cell = pattern[i];
          const row = Math.floor(cell / gridSize);
          const col = cell % gridSize;
          const x = col * cellSize + cellSize / 2;
          const y = row * cellSize + cellSize / 2;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDrawing = true;
      pattern.length = 0;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cell = getCellFromPoint(x, y);
      pattern.push(cell);
      drawPattern();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cell = getCellFromPoint(x, y);
      
      if (!pattern.includes(cell)) {
        pattern.push(cell);
        drawPattern();
      }
    };

    const handleMouseUp = async () => {
      isDrawing = false;
      setIsDrawingGesture(false);
      setGesturePattern([...pattern]);
      
      if (isRegistering) {
        const success = await register({
          email,
          name,
          role: 'talent',
          authMethod: 'gesture',
          gesturePattern: pattern
        });
        
        if (success) handleSuccess();
      } else {
        const success = await login({
          email,
          gesturePattern: pattern
        });
        
        if (success) handleSuccess();
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    drawPattern();
  };

  // Biometric authentication
  const handleBiometricAuth = async () => {
    try {
      // Simulate biometric data capture
      const biometricData = Math.random().toString(36).substring(2);
      setBiometricData(biometricData);
      
      if (isRegistering) {
        const success = await register({
          email,
          name,
          role: 'talent',
          authMethod: 'biometric'
        });
        
        if (success) handleSuccess();
      } else {
        const success = await login({
          email,
          biometricData
        });
        
        if (success) handleSuccess();
      }
    } catch (error) {
      console.error('Biometric auth failed:', error);
    }
  };

  // Generate voice signature
  const generateVoiceSignature = async (audioBlob: Blob): Promise<string> => {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const channelData = audioBuffer.getChannelData(0);
    const signature = Array.from(channelData)
      .slice(0, 1024)
      .map(sample => Math.abs(sample))
      .reduce((sum, val) => sum + val, 0) / 1024;
    
    return signature.toString(16);
  };

  // Handle successful authentication
  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push(redirectTo);
    }
  };

  // Render method selector
  if (showMethodSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Choose Your Authentication Method
          </h2>
          
          <div className="space-y-4">
            {[
              { method: 'traditional', icon: '🔐', title: 'Traditional', desc: 'Email & Password' },
              { method: 'biometric', icon: '👆', title: 'Biometric', desc: 'Fingerprint or Face ID' },
              { method: 'voice', icon: '🎤', title: 'Voice', desc: 'Voice Recognition' },
              { method: 'gesture', icon: '✋', title: 'Gesture', desc: 'Pattern Drawing' }
            ].map(({ method, icon, title, desc }) => (
              <motion.button
                key={method}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleMethodSelect(method as AuthMethod)}
                className="w-full p-6 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-left hover:bg-white/20 transition-all"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <h3 className="text-white font-semibold">{title}</h3>
                    <p className="text-purple-300 text-sm">{desc}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-4xl font-bold text-white mb-2"
          >
            Nexus Portal
          </motion.h1>
          <p className="text-purple-300">
            {isRegistering ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {/* Auth Method Display */}
        <div className="mb-6">
          <button
            onClick={() => setShowMethodSelector(true)}
            className="w-full p-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all"
          >
            <div className="flex items-center justify-between">
              <span>Authentication Method</span>
              <span className="text-purple-400">
                {currentMethod === 'traditional' && '🔐 Traditional'}
                {currentMethod === 'biometric' && '👆 Biometric'}
                {currentMethod === 'voice' && '🎤 Voice'}
                {currentMethod === 'gesture' && '✋ Gesture'}
              </span>
            </div>
          </button>
        </div>

        {/* Traditional Auth Form */}
        {currentMethod === 'traditional' && (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleTraditionalAuth}
            className="space-y-4"
          >
            {isRegistering && (
              <div>
                <label className="block text-white text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}
            
            <div>
              <label className="block text-white text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <label className="block text-white text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500 pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full p-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
            </motion.button>
          </motion.form>
        )}

        {/* Voice Auth */}
        {currentMethod === 'voice' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {isRegistering && (
              <div>
                <label className="block text-white text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}
            
            <div>
              <label className="block text-white text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
                placeholder="Enter your email"
                required
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleVoiceAuth}
              disabled={isRecording || isLoading}
              className="w-full p-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all disabled:opacity-50"
            >
              {isRecording ? '🎤 Recording...' : (isRegistering ? '🎤 Record Voice Signature' : '🎤 Voice Login')}
            </motion.button>
          </motion.div>
        )}

        {/* Gesture Auth */}
        {currentMethod === 'gesture' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {isRegistering && (
              <div>
                <label className="block text-white text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}
            
            <div>
              <label className="block text-white text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                {isRegistering ? 'Draw your gesture pattern' : 'Enter your gesture pattern'}
              </label>
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="w-full h-64 bg-white/10 border border-white/20 rounded-lg cursor-crosshair"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGestureAuth}
              disabled={isDrawingGesture || isLoading}
              className="w-full p-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all disabled:opacity-50"
            >
              {isDrawingGesture ? '✋ Drawing...' : (isRegistering ? '✋ Set Gesture Pattern' : '✋ Gesture Login')}
            </motion.button>
          </motion.div>
        )}

        {/* Biometric Auth */}
        {currentMethod === 'biometric' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {isRegistering && (
              <div>
                <label className="block text-white text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}
            
            <div>
              <label className="block text-white text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-500"
                placeholder="Enter your email"
                required
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBiometricAuth}
              disabled={isLoading}
              className="w-full p-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all disabled:opacity-50"
            >
              {isRegistering ? '👆 Register Biometric' : '👆 Biometric Login'}
            </motion.button>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Toggle Register/Login */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              clearError();
            }}
            className="text-purple-300 hover:text-white transition-colors"
          >
            {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
} 