'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';

export default function FilterDebug() {
  const searchParams = useSearchParams();
  
  const allParams = Object.fromEntries(searchParams.entries());
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">🔍 Filter Debug</h3>
      <div className="space-y-1">
        {Object.entries(allParams).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="font-mono">{key}:</span>
            <span className="text-green-400">{value}</span>
          </div>
        ))}
        {Object.keys(allParams).length === 0 && (
          <div className="text-yellow-400">No search parameters</div>
        )}
      </div>
    </div>
  );
}
