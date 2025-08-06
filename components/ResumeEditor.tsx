'use client';
import React, { useState } from 'react';

export default function ResumeEditor({ initialValues = {}, onSave }) {
  const [form, setForm] = useState(initialValues);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <input 
        placeholder="Full Name" 
        value={form.full_name || ''} 
        onChange={e => setForm({...form, full_name: e.target.value})}
        className="w-full p-2 border rounded mb-2"
      />
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Save Resume
      </button>
    </form>
  );
}
