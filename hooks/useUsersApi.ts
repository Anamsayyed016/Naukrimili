import { useState, useEffect, useCallback } from 'react';

export interface UserSummary {
  id?: string | number;
  name: string;
  email: string;
}

interface ApiState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

export function useUsersApi() {
  const [state, setState] = useState<ApiState<UserSummary[]>>({ data: [], loading: false, error: null });

  const setLoading = (loading: boolean) => setState((s) => ({ ...s, loading }));
  const setError = (error: string | null) => setState((s) => ({ ...s, error }));
  const setUsers = (users: UserSummary[]) => setState((s) => ({ ...s, data: users }));

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (user: UserSummary) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      if (!res.ok) throw new Error('Create failed');
      await fetchUsers();
    } catch (e) {
      setError('Failed to create user');
    } finally {
      setLoading(false);
    }
  }, []); // Removed fetchUsers to prevent circular dependency

  const updateUser = useCallback(async (id: string | number, user: UserSummary) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${id}` , {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      if (!res.ok) throw new Error('Update failed');
      await fetchUsers();
    } catch (e) {
      setError('Failed to update user');
    } finally {
      setLoading(false);
    }
  }, []); // Removed fetchUsers to prevent circular dependency

  const deleteUser = useCallback(async (id: string | number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${id}` , { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchUsers();
    } catch (e) {
      setError('Failed to delete user');
    } finally {
      setLoading(false);
    }
  }, []); // Removed fetchUsers to prevent circular dependency

  useEffect(() => { fetchUsers(); }, []); // Removed fetchUsers to prevent infinite loop

  return {
    users: state.data,
    loading: state.loading,
    error: state.error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}
