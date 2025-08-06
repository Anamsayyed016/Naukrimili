import { useState, useEffect } from 'react';


export interface Resume {
  id?: number;
  userId: number | string;
  fileUrl: string;
  // Add other fields as needed
}

export function useResumesApi() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResumes = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/resumes');
      const data = await res.json();
      setResumes(data)} catch (err) {
      setError('Failed to fetch resumes')} finally {
      setLoading(false)}
  };

  const createResume = async (resume: Resume): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resume),
      });
      if (!res.ok) throw new Error('Failed to create');
      await fetchResumes()} catch (err) {
      setError('Failed to create resume')} finally {
      setLoading(false)}
  };

  const updateResume = async (id: number, resume: Resume): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/resumes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resume),
      });
      if (!res.ok) throw new Error('Failed to update');
      await fetchResumes()} catch (err) {
      setError('Failed to update resume')} finally {
      setLoading(false)}
  };

  const deleteResume = async (id: number): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      await fetchResumes()} catch (err) {
      setError('Failed to delete resume')} finally {
      setLoading(false)}
  };

  useEffect(() => { fetchResumes()}, []);

  return { resumes, loading, error, fetchResumes, createResume, updateResume, deleteResume }}
