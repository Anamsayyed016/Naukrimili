import { useState, useEffect, useCallback } from 'react';

export interface Category { id?: number | string; name: string }

export function useCategoriesApi() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : data.categories || []);
      } else { setCategories([]); }
    } catch (_) { setError('Failed to fetch categories'); } finally { setLoading(false); }
  }, []);

  const createCategory = useCallback(async (name: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      if (!res.ok) throw new Error('create failed');
      await fetchCategories();
    } catch (_) { setError('Failed to create category'); } finally { setLoading(false); }
  }, [fetchCategories]);

  const updateCategory = useCallback(async (id: number | string, name: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      if (!res.ok) throw new Error('update failed');
      await fetchCategories();
    } catch (_) { setError('Failed to update category'); } finally { setLoading(false); }
  }, [fetchCategories]);

  const deleteCategory = useCallback(async (id: number | string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      await fetchCategories();
    } catch (_) { setError('Failed to delete category'); } finally { setLoading(false); }
  }, [fetchCategories]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  return { categories, loading, error, fetchCategories, createCategory, updateCategory, deleteCategory };
}