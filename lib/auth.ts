// Frontend-only mock auth helpers with minimal, dependency-free API
export type UserRole = 'jobseeker' | 'company' | 'admin';
export interface User {
  email: string;
  password: string; // hashed
  role: UserRole;
}

const isBrowser = typeof window !== 'undefined';
const USERS_KEY = 'mock_users';
const TOKEN_KEY = 'mock_token';
const TOKEN_EXPIRY_HOURS = 24;

// In-memory fallback for SSR
let memoryUsers: User[] = [];
let memoryToken: string | null = null;

function getUsers(): User[] {
  if (!isBrowser) return memoryUsers;
  const raw = window.localStorage.getItem(USERS_KEY);
  return raw ? (JSON.parse(raw) as User[]) : [];
}

function saveUsers(users: User[]) {
  if (!isBrowser) {
    memoryUsers = users;
    return;
  }
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function hashPassword(password: string) {
  try {
    return 'password_' + (isBrowser ? btoa(password) : Buffer.from(password).toString('base64'));
  } catch {
    return 'password_' + password;
  }
}

export function generateMockJWT(user: User) {
  const exp = Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
  const payload = { email: user.email, role: user.role, exp };
  const token = (isBrowser ? btoa(JSON.stringify(payload)) : Buffer.from(JSON.stringify(payload)).toString('base64'));
  if (isBrowser) window.localStorage.setItem(TOKEN_KEY, token);
  else memoryToken = token;
  return token;
}

export function verifyMockJWT(token: string): { email: string; role: UserRole; exp: number } | null {
  try {
    const decoded = JSON.parse(isBrowser ? atob(token) : Buffer.from(token, 'base64').toString('utf8'));
    if (!decoded || typeof decoded.exp !== 'number') return null;
    if (decoded.exp < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string) {
  return !verifyMockJWT(token);
}

export function getUserRole(token: string): UserRole | null {
  const d = verifyMockJWT(token);
  return d ? d.role : null;
}

export async function register(email: string, password: string, role: UserRole) {
  return new Promise<{ success: boolean; token?: string; error?: string }>((resolve) => {
    setTimeout(() => {
      const users = getUsers();
      if (users.find((u) => u.email === email)) return resolve({ success: false, error: 'Email already registered.' });
      if (!/^\S+@\S+\.\S+$/.test(email)) return resolve({ success: false, error: 'Invalid email format.' });
      if (!/^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(password)) return resolve({ success: false, error: 'Password too weak.' });

      const user: User = { email, password: hashPassword(password), role };
      users.push(user);
      saveUsers(users);
      const token = generateMockJWT(user);
      resolve({ success: true, token });
    }, 200);
  });
}

export async function login(email: string, password: string) {
  return new Promise<{ success: boolean; token?: string; user?: Omit<User, 'password'>; error?: string }>((resolve) => {
    setTimeout(() => {
      const users = getUsers();
      let user = users.find((u) => u.email === email);
      // Demo: create on first login with role by email prefix
      if (!user) {
        let role: UserRole = 'jobseeker';
        if (email.startsWith('company')) role = 'company';
        else if (email.startsWith('admin')) role = 'admin';
        user = { email, password: hashPassword(password), role };
        users.push(user);
        saveUsers(users);
      }
      const token = generateMockJWT(user);
      resolve({ success: true, token, user: { email: user.email, role: user.role } as any });
    }, 150);
  });
}

export async function getMe(token: string) {
  return new Promise<{ success: boolean; user?: Omit<User, 'password'>; error?: string }>((resolve) => {
    setTimeout(() => {
      const decoded = verifyMockJWT(token);
      if (!decoded) return resolve({ success: false, error: 'Invalid or expired token.' });
      const users = getUsers();
      const user = users.find((u) => u.email === decoded.email);
      if (!user) return resolve({ success: false, error: 'User not found.' });
      resolve({ success: true, user: { email: user.email, role: user.role } as any });
    }, 100);
  });
}

// Placeholder to satisfy imports where NextAuth config may be expected
export const authOptions: any = {};

export { generateMockJWT as generateJWT };
