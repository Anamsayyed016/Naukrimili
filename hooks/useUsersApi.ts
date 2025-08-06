import { useState, useEffect } from 'react';


export interface User {
  id?: number;
  name: string;
  email: string;
  // Add other fields as needed
}

export function useUsersApi() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data)} catch (err) {
      setError('Failed to fetch users')} finally {
      setLoading(false)}
  };

  const createUser = async (user: User): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      if (!res.ok) throw new Error('Failed to create');
      await fetchUsers()} catch (err) {
      setError('Failed to create user')} finally {
      setLoading(false)}
  };

  const updateUser = async (id: number, user: User): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      if (!res.ok) throw new Error('Failed to update');
      await fetchUsers()} catch (err) {
      setError('Failed to update user')} finally {
      setLoading(false)}
  };

  const deleteUser = async (id: number): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchUsers()} catch (err) {
      setError('Failed to delete user')} finally {
      setLoading(false)}
  };

  useEffect(() => { fetchUsers()}, []);

  return { users, loading, error, fetchUsers, createUser, updateUser, deleteUser }}
