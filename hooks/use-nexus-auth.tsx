// Nexus Authentication Hook - Completely Unique Implementation
// Features: Biometric detection, Voice activation, Gesture patterns, Real-time validation

import { useState, useEffect, useCallback, useRef } from 'react';
import { nexusAuth, NexusUser, AuthSession, AuthMethod } from '@/lib/nexus-auth';

export interface NexusAuthState {
  user: NexusUser | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  authMethod: AuthMethod | null;
}

export interface NexusAuthActions {
  login: (credentials: any) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<NexusUser>) => Promise<boolean>;
  switchAuthMethod: (method: AuthMethod) => void;
  clearError: () => void;
}

export function useNexusAuth(): NexusAuthState & NexusAuthActions {
  const [state, setState] = useState<NexusAuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    authMethod: null
  });

  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [gesturePattern, setGesturePattern] = useState<number[]>([]);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gestureCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const session = nexusAuth.getCurrentSession();
        
        if (session) {
          setState(prev => ({
            ...prev,
            user: session.user,
            session,
            isAuthenticated: true,
            isLoading: false,
            authMethod: session.user.authMethod
          }));
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false
          }));
        }

        // Check for biometric availability
        await checkBiometricAvailability();
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to initialize authentication'
        }));
      }
    };

    initializeAuth();
  }, []);

  // Check biometric availability
  const checkBiometricAvailability = async () => {
    try {
      // Check for WebAuthn support
      if (window.PublicKeyCredential) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setBiometricAvailable(available);
      }
    } catch (error) {
      console.log('Biometric not available:', error);
    }
  };

  // Unique login with multiple auth methods
  const login = useCallback(async (credentials: any): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Rate limiting
      if (loginAttempts >= 5) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Too many login attempts. Please try again later.'
        }));
        return false;
      }

      const result = await nexusAuth.login(credentials);
      
      if (result.success && result.session) {
        setState(prev => ({
          ...prev,
          user: result.session.user,
          session: result.session,
          isAuthenticated: true,
          isLoading: false,
          authMethod: result.session.user.authMethod
        }));
        setLoginAttempts(0);
        return true;
      } else {
        setLoginAttempts(prev => prev + 1);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Login failed'
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'An unexpected error occurred'
      }));
      return false;
    }
  }, [loginAttempts]);

  // Unique registration with auth method selection
  const register = useCallback(async (userData: any): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Validate auth method specific data
      if (userData.authMethod === 'voice' && !userData.voiceSignature) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Voice signature required for voice authentication'
        }));
        return false;
      }

      if (userData.authMethod === 'gesture' && !userData.gesturePattern) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Gesture pattern required for gesture authentication'
        }));
        return false;
      }

      const result = await nexusAuth.register(userData);
      
      if (result.success && result.session) {
        setState(prev => ({
          ...prev,
          user: result.session.user,
          session: result.session,
          isAuthenticated: true,
          isLoading: false,
          authMethod: result.session.user.authMethod
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Registration failed'
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'An unexpected error occurred'
      }));
      return false;
    }
  }, []);

  // Logout with cleanup
  const logout = useCallback(() => {
    nexusAuth.logout();
    setState(prev => ({
      ...prev,
      user: null,
      session: null,
      isAuthenticated: false,
      authMethod: null
    }));
    setLoginAttempts(0);
    setIsVoiceRecording(false);
    setGesturePattern([]);
  }, []);

  // Update profile with validation
  const updateProfile = useCallback(async (updates: Partial<NexusUser>): Promise<boolean> => {
    if (!state.user) return false;

    try {
      const success = await nexusAuth.updateProfile(state.user.id, updates);
      
      if (success) {
        setState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, ...updates } : null
        }));
      }
      
      return success;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to update profile'
      }));
      return false;
    }
  }, [state.user]);

  // Switch authentication method
  const switchAuthMethod = useCallback((method: AuthMethod) => {
    setState(prev => ({ ...prev, authMethod: method }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Voice recording functions
  const startVoiceRecording = useCallback(async (): Promise<string | null> => {
    try {
      setIsVoiceRecording(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      voiceRecorderRef.current = mediaRecorder;
      
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Convert to signature
        const signature = await generateVoiceSignature(audioBlob);
        return signature;
      };
      
      mediaRecorder.start();
      
      // Stop after 3 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          stream.getTracks().forEach(track => track.stop());
        }
        setIsVoiceRecording(false);
      }, 3000);
      
    } catch (error) {
      setIsVoiceRecording(false);
      setState(prev => ({
        ...prev,
        error: 'Failed to start voice recording'
      }));
      return null;
    }
  }, []);

  const generateVoiceSignature = async (audioBlob: Blob): Promise<string> => {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const channelData = audioBuffer.getChannelData(0);
    const signature = Array.from(channelData)
      .slice(0, 1024) // Take first 1024 samples
      .map(sample => Math.abs(sample))
      .reduce((sum, val) => sum + val, 0) / 1024;
    
    return signature.toString(16);
  };

  // Gesture pattern functions
  const startGestureCapture = useCallback((canvas: HTMLCanvasElement) => {
    gestureCanvasRef.current = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isDrawing = false;
    const pattern: number[] = [];
    const gridSize = 3; // 3x3 grid
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

    const handleMouseUp = () => {
      isDrawing = false;
      setGesturePattern([...pattern]);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    drawPattern();

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Biometric authentication
  const authenticateWithBiometric = useCallback(async (): Promise<boolean> => {
    if (!biometricAvailable) return false;

    try {
      // Simulate biometric authentication
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      if (success) {
        // In real implementation, this would use WebAuthn
        return true;
      } else {
        setState(prev => ({
          ...prev,
          error: 'Biometric authentication failed'
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Biometric authentication not available'
      }));
      return false;
    }
  }, [biometricAvailable]);

  return {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    switchAuthMethod,
    clearError,
    // Additional methods
    startVoiceRecording,
    startGestureCapture,
    authenticateWithBiometric,
    isVoiceRecording,
    gesturePattern,
    biometricAvailable
  };
} 