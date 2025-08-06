"use client";
import { useState } from 'react';
import { useCategoriesApi } from '@/hooks/useCategoriesApi';

export default function CategoryAdminPanel() {
  const { categories, loading, error, createCategory, updateCategory, deleteCategory } = useCategoriesApi();
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<number|null>(null);
  const [editName, setEditName] = useState('');

  return (
    <div className="p-6 bg-white rounded shadow max-w-xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Manage Categories</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <form
        onSubmit={e => {
          e.preventDefault();
          if (editId !== null) {
            updateCategory(editId, editName);
            setEditId(null);
            setEditName('');
          } else {
            createCategory(newName);
            setNewName('');
          }
        }}
        className="flex gap-2 mb-4"
      >
        <input
          className="border px-2 py-1 rounded flex-1"
          placeholder="Category name"
          value={editId !== null ? editName : newName}
          onChange={e => editId !== null ? setEditName(e.target.value) : setNewName(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">
          {editId !== null ? 'Update' : 'Add'}
        </button>
        {editId !== null && (
          <button type="button" className="ml-2 text-gray-500" onClick={() => { setEditId(null); setEditName(''); }}>
            Cancel
          </button>
        )}
      </form>
      <ul>
        {categories.map((cat: Record<string, unknown>) => (
          <li key={cat.id} className="flex items-center justify-between border-b py-2">
            {editId === cat.id ? null : <span>{cat.name}</span>}
            <div className="flex gap-2">
              <button
                className="text-blue-600"
                onClick={() => { setEditId(cat.id); setEditName(cat.name); }}
              >Edit</button>
              <button
                className="text-red-600"
                onClick={() => deleteCategory(cat.id)}
              >Delete</button>
            </div>
          </li>
        ))}
      </ul>
      {loading && <div className="mt-2 text-gray-500">Loading...</div>}
    </div>
  );
}
