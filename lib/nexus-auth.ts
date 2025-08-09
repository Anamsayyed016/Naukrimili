// Minimal, type-safe Nexus Authentication utilities with browser-safe guards.

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
    gesturePattern?: string; // hashed pattern
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

// Unique Session Management with Device Fingerprinting (safe for SSR)
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

  private b64(str: string): string {
    if (typeof window === 'undefined') {
      return Buffer.from(str, 'utf8').toString('base64');
    }
    return btoa(str);
  }

  generateDeviceFingerprint(): string {
    try {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return `srv_${Math.random().toString(36).slice(2, 10)}`;
      }
      const ua = navigator.userAgent || 'unknown';
      const lang = (navigator as any).language || 'en';
      const tz = String(new Date().getTimezoneOffset());
      const size = typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'na';
      const raw = [ua, lang, tz, size, Date.now()].join('|');
      return this.b64(raw).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
    } catch {
      return `fp_${Math.random().toString(36).slice(2, 10)}`;
    }
  }

  createSession(user: NexusUser): AuthSession {
    const deviceFingerprint = this.generateDeviceFingerprint();
    const token = this.generateSecureToken(user.id, deviceFingerprint);
    const expiresAt = new Date(Date.now() + this.SESSION_DURATION);

    const session: AuthSession = { token, user, expiresAt, deviceFingerprint };
    this.sessions.set(token, session);
    this.persistSession(session);
    return session;
  }

  private generateSecureToken(userId: string, deviceFingerprint: string): string {
    const payload = `${userId}:${deviceFingerprint}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    return this.b64(payload).replace(/[^a-zA-Z0-9]/g, '');
  }

  private persistSession(session: AuthSession): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nexus_session', JSON.stringify(session));
      } catch {
        // ignore
      }
    }
  }

  getSession(token: string): AuthSession | null {
    const session = this.sessions.get(token) || this.loadSessionFromStorage();
    if (!session) return null;
    if (session.expiresAt.getTime() < Date.now()) {
      this.invalidateSession(session.token);
      return null;
    }
    return session;
  }

  private loadSessionFromStorage(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('nexus_session');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AuthSession;
      // revive date
      parsed.expiresAt = new Date(parsed.expiresAt);
      this.sessions.set(parsed.token, parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  invalidateSession(token: string): void {
    this.sessions.delete(token);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('nexus_session');
      } catch {
        // ignore
      }
    }
  }
}

// Password strength helper
class NexusPasswordValidator {
  static validate(password: string): { isValid: boolean; score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    if (/(.)\1{2,}/.test(password)) { score -= 10; feedback.push('Avoid repeated characters'); }
    if (/123|abc|qwe/i.test(password)) { score -= 15; feedback.push('Avoid common sequences'); }
    if (/qwerty|asdfgh|zxcvbn/i.test(password)) { score -= 20; feedback.push('Avoid keyboard patterns'); }
    const isValid = score >= 60;
    if (!isValid) feedback.unshift('Password is too weak');
    else if (score >= 80) feedback.unshift('Excellent password strength');
    else feedback.unshift('Good password strength');
    return { isValid, score, feedback };
  }
}

// Voice Authentication (graceful fallback on unsupported envs)
class NexusVoiceAuth {
  static async captureVoiceSignature(): Promise<string> {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return Promise.resolve(`srv_voice_${Math.random().toString(36).slice(2, 10)}`);
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      return Promise.reject(new Error('Voice capture not supported'));
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Minimal pseudo-signature based on available constraints
      const signature = `v_${Math.random().toString(36).slice(2, 10)}`;
      stream.getTracks().forEach(t => t.stop());
      return signature;
    } catch (err) {
      throw new Error('Voice capture failed');
    }
  }
}

// Gesture Pattern Authentication
class NexusGestureAuth {
  static validateGesturePattern(pattern: number[]): boolean {
    if (!Array.isArray(pattern) || pattern.length < 4) return false;
    for (let i = 1; i < pattern.length; i++) {
      const distance = Math.abs(pattern[i] - pattern[i - 1]);
      if (distance < 2) return false;
    }
    return true;
  }

  static generateGestureHash(pattern: number[]): string {
    const raw = pattern.join(',');
    if (typeof window === 'undefined') return Buffer.from(raw).toString('base64');
    return btoa(raw).replace(/[^a-zA-Z0-9]/g, '');
  }
}

// Main Authentication API
export class NexusAuth {
  private static users: NexusUser[] = [];
  private sessionManager = NexusSessionManager.getInstance();

  constructor() {
    this.loadUsers();
  }

  async register(userData: {
    email: string;
    name: string;
    password?: string;
    role: NexusUserRole;
    authMethod: AuthMethod;
    gesturePattern?: number[];
    voiceSignature?: string;
    biometricData?: string;
  }): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    try {
      if (NexusAuth.users.find(u => u.email === userData.email)) {
        return { success: false, error: 'Email already registered' };
      }

      if (userData.authMethod === 'traditional' && !userData.password) {
        return { success: false, error: 'Password required for traditional auth' };
      }
      if (userData.authMethod === 'gesture' && !userData.gesturePattern) {
        return { success: false, error: 'Gesture pattern required' };
      }
      if (userData.authMethod === 'voice' && !userData.voiceSignature) {
        return { success: false, error: 'Voice signature required' };
      }

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
          voiceEnabled: userData.authMethod === 'voice',
        },
        security: {
          gesturePattern: userData.gesturePattern
            ? NexusGestureAuth.generateGestureHash(userData.gesturePattern)
            : undefined,
          voiceSignature: userData.voiceSignature,
          biometricData:
            userData.authMethod === 'biometric'
              ? userData.biometricData ?? this.generateBiometricData()
              : undefined,
        },
      };

      NexusAuth.users.push(user);
      this.persistUsers();
      const session = this.sessionManager.createSession(user);
      return { success: true, session };
    } catch {
      return { success: false, error: 'Registration failed' };
    }
  }

  async login(credentials: {
    email: string;
    password?: string;
    gesturePattern?: number[];
    voiceSignature?: string;
    biometricData?: string;
  }): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    try {
      const user = NexusAuth.users.find(u => u.email === credentials.email);
      if (!user) return { success: false, error: 'User not found' };

      let isValid = false;
      switch (user.authMethod) {
        case 'traditional':
          if (credentials.password) {
            isValid = this.validatePassword(credentials.password, user);
          }
          break;
        case 'gesture':
          if (credentials.gesturePattern) {
            const hash = NexusGestureAuth.generateGestureHash(credentials.gesturePattern);
            isValid = hash === user.security.gesturePattern;
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

      if (!isValid) return { success: false, error: 'Authentication failed' };

      user.lastActive = new Date();
      this.persistUsers();
      const session = this.sessionManager.createSession(user);
      return { success: true, session };
    } catch {
      return { success: false, error: 'Login failed' };
    }
  }

  getCurrentSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('nexus_session');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AuthSession;
      parsed.expiresAt = new Date(parsed.expiresAt);
      const valid = this.sessionManager.getSession(parsed.token);
      if (!valid) {
        this.logout();
        return null;
      }
      return valid;
    } catch {
      this.logout();
      return null;
    }
  }

  logout(): void {
    const session = this.getCurrentSession();
    if (session) this.sessionManager.invalidateSession(session.token);
  }

  async updateProfile(userId: string, updates: Partial<NexusUser>): Promise<boolean> {
    const idx = NexusAuth.users.findIndex(u => u.id === userId);
    if (idx === -1) return false;
    NexusAuth.users[idx] = { ...NexusAuth.users[idx], ...updates };
    this.persistUsers();
    return true;
  }

  // Private helpers
  private generateUserId(): string {
    return `nexus_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private generateBiometricData(): string {
    const rnd = Math.random().toString(36).slice(2);
    if (typeof window === 'undefined') return Buffer.from(rnd).toString('base64').slice(0, 32);
    return btoa(rnd).slice(0, 32);
  }

  private validatePassword(password: string, _user: NexusUser): boolean {
    return NexusPasswordValidator.validate(password).isValid;
  }

  private persistUsers(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nexus_users', JSON.stringify(NexusAuth.users));
      } catch {
        // ignore write errors
      }
    }
  }

  private loadUsers(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('nexus_users');
      if (raw) {
        const users = JSON.parse(raw) as NexusUser[];
        // revive dates
        NexusAuth.users = users.map(u => ({
          ...u,
          lastActive: new Date(u.lastActive),
        }));
      }
    } catch {
      // ignore
    }
  }
}

// Export singleton instance and helpers
export const nexusAuth = new NexusAuth();
export { NexusPasswordValidator, NexusVoiceAuth, NexusGestureAuth };