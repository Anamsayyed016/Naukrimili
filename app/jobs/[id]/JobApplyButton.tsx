"use client";
import React from 'react';

export function JobApplyButton({ url }: { url?: string | null }) {
  if (!url) return null;
  return (
    <button
      onClick={() => window.open(url, '_blank', 'noopener')}
      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
    >
      Apply
    </button>
  );
}
