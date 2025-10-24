/**
 * Force New Hash Component
 * This component is created to force Next.js to generate new chunk hashes
 * Build timestamp: 2025-10-02 14:30:00
 */

'use client';

import { useEffect, useState } from 'react';

export default function ForceNewHash() {
  const [timestamp, setTimestamp] = useState<number | null>(null);
  
  useEffect(() => {
    setTimestamp(Date.now());
  }, []);
  
  return (
    <div style={{ display: 'none' }}>
      Force new hash: {timestamp || 'loading'}
    </div>
  );
}
