// Nexus Authentication System - Completely Unique Implementation
// Features: Biometric-style login, Voice activation, Gesture patterns, Holographic UI

export type NexusUserRole = 'talent' | 'enterprise' | 'curator';
export type AuthMethod = 'biometric' | 'voice' | 'gesture' | 'traditional';

export interface NexusUser {
  id: string;
  email: string;
  name: string;
  role: NexusUserRole;
  authMethod: AuthMethod;
  profileCompletion: number;
  lastActive: Date;
  preferences: {
    theme: 'light' | 'dark' | 'holographic';
    notifications: boolean;
    voiceEnabled: boolean;
  };
  security: {
    gesturePattern?: string;
    voiceSignature?: string;
    biometricData?: string;
  };
}

export interface AuthSession {
  token: string;
  user: NexusUser;
  expiresAt: Date;
  deviceFingerprint: string;
}

// Unique Session Management with Device Fingerprinting
class NexusSessionManager {
  private static instance: NexusSessionManager;
  private sessions: Map<string, AuthSession> = new Map();
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static getInstance(): NexusSessionManager {
    if (!NexusSessionManager.instance) {
      NexusSessionManager.instance = new NexusSessionManager();
    }
    return NexusSessionManager.instance;
  }

  generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx!.textBaseline = 'top';
    ctx!.font = '14px Arial';
    ctx!.fillText('NexusAuth', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    return btoa(fingerprint).slice(0, 32);
  }

  createSession(user: NexusUser): AuthSession {
    const deviceFingerprint = this.generateDeviceFingerprint();
    const token = this.generateSecureToken(user.id, deviceFingerprint);
    const expiresAt = new Date(Date.now() + this.SESSION_DURATION);
    
    const session: AuthSession = {
      token,
      user,
      expiresAt,
      deviceFingerprint
    };
    
    this.sessions.set(token, session);
    this.persistSession(session);
    
    return session;
  }

  private generateSecureToken(userId: string, deviceFingerprint: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const payload = `${userId}:${deviceFingerprint}:${timestamp}:${random}`;
    return btoa(payload).replace(/[^a-zA-Z0-9]/g, '');
  }

  private persistSession(session: AuthSession): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_session', JSON.stringify(session));
    }
  }

  getSession(token: string): AuthSession | null {
    const session = this.sessions.get(token);
    if (!session) return null;
    
    if (session.expiresAt < new Date()) {
      this.sessions.delete(token);
      return null;
    }
    
    return session;
  }

  invalidateSession(token: string): void {
    this.sessions.delete(token);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nexus_session');
    }
  }
}

// Unique Password Strength Algorithm
class NexusPasswordValidator {
  static validate(password: string): { isValid: boolean; score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;
    
    // Unique scoring system
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    
    // Unique patterns detection
    if (/(.)\1{2,}/.test(password)) {
      score -= 10;
      feedback.push('Avoid repeated characters');
    }
    
    if (/123|abc|qwe/i.test(password)) {
      score -= 15;
      feedback.push('Avoid common sequences');
    }
    
    // Check for keyboard patterns
    const keyboardPatterns = /qwerty|asdfgh|zxcvbn/i;
    if (keyboardPatterns.test(password)) {
      score -= 20;
      feedback.push('Avoid keyboard patterns');
    }
    
    const isValid = score >= 60;
    
    if (score < 60) {
      feedback.unshift('Password is too weak');
    } else if (score >= 80) {
      feedback.unshift('Excellent password strength');
    } else {
      feedback.unshift('Good password strength');
    }
    
    return { isValid, score, feedback };
  }
}

// Voice Authentication System
class NexusVoiceAuth {
  static async captureVoiceSignature(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        reject(new Error('Voice capture not supported'));
        return;
      }
      
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const audioContext = new AudioContext();
          const analyser = audioContext.createAnalyser();
          const microphone = audioContext.createMediaStreamSource(stream);
          
          microphone.connect(analyser);
          analyser.fftSize = 256;
          
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          
          // Capture voice signature
          const signature = this.generateVoiceSignature(analyser, dataArray);
          
          stream.getTracks().forEach(track => track.stop());
          resolve(signature);
        })
        .catch(reject);
    });
  }
  
  private static generateVoiceSignature(analyser: AnalyserNode, dataArray: Uint8Array): string {
    analyser.getByteFrequencyData(dataArray);
    const signature = Array.from(dataArray)
      .slice(0, 64) // Take first 64 frequency bins
      .map(val => val.toString(16).padStart(2, '0'))
      .join('');
    return signature;
  }
}

// Gesture Pattern Authentication
class NexusGestureAuth {
  static validateGesturePattern(pattern: number[]): boolean {
    // Must be at least 4 points
    if (pattern.length < 4) return false;
    
    // Check for minimum distance between points
    for (let i = 1; i < pattern.length; i++) {
      const prev = pattern[i - 1];
      const curr = pattern[i];
      const distance = Math.abs(curr - prev);
      if (distance < 2) return false; // Points too close
    }
    
    return true;
  }
  
  static generateGestureHash(pattern: number[]): string {
    const patternString = pattern.join(',');
    return btoa(patternString).replace(/[^a-zA-Z0-9]/g, '');
  }
}

// Main Authentication API
export class NexusAuth {
  private static users: NexusUser[] = [];
  private sessionManager = NexusSessionManager.getInstance();
  
  // Unique Registration with Multiple Auth Methods
  async register(userData: {
    email: string;
    name: string;
    password?: string;
    role: NexusUserRole;
    authMethod: AuthMethod;
    gesturePattern?: number[];
    voiceSignature?: string;
  }): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    try {
      // Validate email uniqueness
      if (this.users.find(u => u.email === userData.email)) {
        return { success: false, error: 'Email already registered' };
      }
      
      // Validate based on auth method
      if (userData.authMethod === 'traditional' && !userData.password) {
        return { success: false, error: 'Password required for traditional auth' };
      }
      
      if (userData.authMethod === 'gesture' && !userData.gesturePattern) {
        return { success: false, error: 'Gesture pattern required' };
      }
      
      if (userData.authMethod === 'voice' && !userData.voiceSignature) {
        return { success: false, error: 'Voice signature required' };
      }
      
      // Create user
      const user: NexusUser = {
        id: this.generateUserId(),
        email: userData.email,
        name: userData.name,
        role: userData.role,
        authMethod: userData.authMethod,
        profileCompletion: 0,
        lastActive: new Date(),
        preferences: {
          theme: 'light',
          notifications: true,
          voiceEnabled: userData.authMethod === 'voice'
        },
        security: {
          gesturePattern: userData.gesturePattern ? 
            NexusGestureAuth.generateGestureHash(userData.gesturePattern) : undefined,
          voiceSignature: userData.voiceSignature,
          biometricData: userData.authMethod === 'biometric' ? 
            this.generateBiometricData() : undefined
        }
      };
      
      this.users.push(user);
      this.persistUsers();
      
      // Create session
      const session = this.sessionManager.createSession(user);
      
      return { success: true, session };
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    }
  }
  
  // Unique Login with Multiple Auth Methods
  async login(credentials: {
    email: string;
    password?: string;
    gesturePattern?: number[];
    voiceSignature?: string;
    biometricData?: string;
  }): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    try {
      const user = this.users.find(u => u.email === credentials.email);
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      
      // Validate based on user's auth method
      let isValid = false;
      
      switch (user.authMethod) {
        case 'traditional':
          if (credentials.password) {
            isValid = this.validatePassword(credentials.password, user);
          }
          break;
        case 'gesture':
          if (credentials.gesturePattern) {
            const gestureHash = NexusGestureAuth.generateGestureHash(credentials.gesturePattern);
            isValid = gestureHash === user.security.gesturePattern;
          }
          break;
        case 'voice':
          if (credentials.voiceSignature) {
            isValid = credentials.voiceSignature === user.security.voiceSignature;
          }
          break;
        case 'biometric':
          if (credentials.biometricData) {
            isValid = credentials.biometricData === user.security.biometricData;
          }
          break;
      }
      
      if (!isValid) {
        return { success: false, error: 'Authentication failed' };
      }
      
      // Update last active
      user.lastActive = new Date();
      this.persistUsers();
      
      // Create session
      const session = this.sessionManager.createSession(user);
      
      return { success: true, session };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  }
  
  // Get current session
  getCurrentSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    
    const sessionData = localStorage.getItem('nexus_session');
    if (!sessionData) return null;
    
    try {
      const session: AuthSession = JSON.parse(sessionData);
      const validSession = this.sessionManager.getSession(session.token);
      
      if (!validSession) {
        this.logout();
        return null;
      }
      
      return validSession;
    } catch {
      this.logout();
      return null;
    }
  }
  
  // Logout
  logout(): void {
    const session = this.getCurrentSession();
    if (session) {
      this.sessionManager.invalidateSession(session.token);
    }
  }
  
  // Update user profile
  async updateProfile(userId: string, updates: Partial<NexusUser>): Promise<boolean> {
    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;
    
    this.users[userIndex] = { ...this.users[userIndex], ...updates };
    this.persistUsers();
    return true;
  }
  
  // Private helper methods
  private generateUserId(): string {
    return 'nexus_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  private generateBiometricData(): string {
    // Simulate biometric data generation
    return btoa(Math.random().toString()).slice(0, 32);
  }
  
  private validatePassword(password: string, user: NexusUser): boolean {
    // In a real implementation, this would check against hashed password
    // For demo purposes, we'll use a simple validation
    const validation = NexusPasswordValidator.validate(password);
    return validation.isValid;
  }
  
  private persistUsers(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_users', JSON.stringify(this.users));
    }
  }
  
  private loadUsers(): void {
    if (typeof window !== 'undefined') {
      const usersData = localStorage.getItem('nexus_users');
      if (usersData) {
        this.users = JSON.parse(usersData);
      }
    }
  }
  
  constructor() {
    this.loadUsers();
  }
}

// Export singleton instance
export const nexusAuth = new NexusAuth();

// Export utility functions
export { NexusPasswordValidator, NexusVoiceAuth, NexusGestureAuth }; 