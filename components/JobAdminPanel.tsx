"use client";

import { useState } from 'react';
import { useJobsApi } from '@/hooks/useJobsApi';

export default function JobAdminPanel() {
  const { jobs, loading, error, createJob, updateJob, deleteJob } = useJobsApi();
  const [form, setForm] = useState({ title: '', description: '', location: '' });
  const [editId, setEditId] = useState<number|null>(null);

  return (
    <div className="p-6 bg-white rounded shadow max-w-xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Manage Jobs</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <form
        onSubmit={e => {
          e.preventDefault();
          if (editId !== null) {
            updateJob(editId, form);
            setEditId(null);
            setForm({ title: '', description: '', location: '' });
          } else {
            createJob(form);
            setForm({ title: '', description: '', location: '' });
          }
        }}
        className="flex flex-col gap-2 mb-4"
      >
        <input className="border px-2 py-1 rounded" placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <input className="border px-2 py-1 rounded" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        <input className="border px-2 py-1 rounded" placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">
          {editId !== null ? 'Update' : 'Add'}
        </button>
        {editId !== null && (
          <button type="button" className="ml-2 text-gray-500" onClick={() => { setEditId(null); setForm({ title: '', description: '', location: '' }); }}>
            Cancel
          </button>
        )}
      </form>
      <ul>
        {jobs.map((job: any) => (
          <li key={job.id} className="flex items-center justify-between border-b py-2">
            <span>{job.title} - {job.location}</span>
            <div className="flex gap-2">
              <button className="text-blue-600" onClick={() => { setEditId(job.id); setForm({ title: job.title, description: job.description, location: job.location }); }}>Edit</button>
              <button className="text-red-600" onClick={() => deleteJob(job.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
      {loading && <div className="mt-2 text-gray-500">Loading...</div>}
    </div>
  );
}
