import {
  useState, useEffect
}
} from 'react';


export interface Category {
  id?: number;
  name: string // Add other fields as needed
}
}
}
export function useCategoriesApi() {
  ;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null) // Fetch all categories;
  const fetchCategories = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
}
  } catch (err) {
  ;
      setError('Failed to fetch categories');
}
  } finally {
  ;
      setLoading(false);
}
  } // Create a new category;
  const createCategory = async (name: string): Promise<void> => {
  ;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST';
        headers: {
      'Content-Type': 'application/json'
}
});
        body: JSON.stringify({
  name
}
}),
});
      if (!res.ok) throw new Error('Failed to create');
      await fetchCategories()} catch (err) {
  ;
      setError('Failed to create category');
}
  } finally {
  ;
      setLoading(false);
}
  } // Update a category;
  const updateCategory = async (id: number, name: string): Promise<void> => {
  ;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${id
}
}`, {
  ;
        method: 'PUT';
        headers: {
      'Content-Type': 'application/json'
}
});
        body: JSON.stringify({
  name
}
}),
});
      if (!res.ok) throw new Error('Failed to update');
      await fetchCategories()} catch (err) {
  ;
      setError('Failed to update category');
}
  } finally {
  ;
      setLoading(false);
}
  } // Delete a category;
  const deleteCategory = async (id: number): Promise<void> => {
  ;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/categories/${id
}
}`, {
  method: 'DELETE'
}
});
      if (!res.ok) throw new Error('Failed to delete');
      await fetchCategories()} catch (err) {
  ;
      setError('Failed to delete category');
}
  } finally {
  ;
      setLoading(false);
}
  }

  useEffect(() => {
  fetchCategories();
}
  }, []);

  return { categories, loading, error, fetchCategories, createCategory, updateCategory, deleteCategory }
}