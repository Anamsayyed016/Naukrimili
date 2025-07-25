"use client";

import { useState } from 'react';
import { useUsersApi } from '@/hooks/useUsersApi';

export default function UserAdminPanel() {
  const { users, loading, error, createUser, updateUser, deleteUser } = useUsersApi();
  const [form, setForm] = useState({ name: '', email: '' });
  const [editId, setEditId] = useState<number|null>(null);

  return (
    <div className="p-6 bg-white rounded shadow max-w-xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Manage Users</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <form
        onSubmit={e => {
          e.preventDefault();
          if (editId !== null) {
            updateUser(editId, form);
            setEditId(null);
            setForm({ name: '', email: '' });
          } else {
            createUser(form);
            setForm({ name: '', email: '' });
          }
        }}
        className="flex flex-col gap-2 mb-4"
      >
        <input className="border px-2 py-1 rounded" placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <input className="border px-2 py-1 rounded" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">
          {editId !== null ? 'Update' : 'Add'}
        </button>
        {editId !== null && (
          <button type="button" className="ml-2 text-gray-500" onClick={() => { setEditId(null); setForm({ name: '', email: '' }); }}>
            Cancel
          </button>
        )}
      </form>
      <ul>
        {users.map((user: any) => (
          <li key={user.id} className="flex items-center justify-between border-b py-2">
            <span>{user.name} - {user.email}</span>
            <div className="flex gap-2">
              <button className="text-blue-600" onClick={() => { setEditId(user.id); setForm({ name: user.name, email: user.email }); }}>Edit</button>
              <button className="text-red-600" onClick={() => deleteUser(user.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
      {loading && <div className="mt-2 text-gray-500">Loading...</div>}
    </div>
  );
}
