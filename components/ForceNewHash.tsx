/**
 * Force New Hash Component
 * This component is created to force Next.js to generate new chunk hashes
 * Build timestamp: 2025-10-02 14:30:00
 */

'use client';

export default function ForceNewHash() {
  return (
    <div style={{ display: 'none' }}>
      Force new hash: {Date.now()}
    </div>
  );
}
