import { useEffect, useState } from 'react';
import { verifyMockJWT, isTokenExpired, getUserRole, getMe } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('mock_token');
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setRole(null);
      setIsExpired(false);
      setLoading(false);
      return;
    }
    const decoded = verifyMockJWT(token);
    if (!decoded) {
      setIsAuthenticated(false);
      setUser(null);
      setRole(null);
      setIsExpired(true);
      setLoading(false);
      return;
    }
    setRole(decoded.role);
    setIsExpired(false);
    setIsAuthenticated(true);
    getMe(token).then(res => {
      if (res.success && res.user) setUser(res.user);
      else setUser(null);
      setLoading(false);
    });
  }, []);

  function logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock_token');
      setUser(null);
      setIsAuthenticated(false);
      setRole(null);
      setIsExpired(false);
    }
  }

  return { user, isAuthenticated, isExpired, role, logout, loading };
} 