'use client';

import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Z_INDEX } from '@/lib/utils';

/**
 * Lightweight notification bell for unauthenticated sessions.
 * Matches ComprehensiveNotificationBell trigger + empty state without socket/hook cost.
 */
export default function NavNotificationBellShell() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
      </button>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[80vh] max-w-96 overflow-hidden"
          style={{
            zIndex: Z_INDEX.TOP_LEVEL_DROPDOWN,
            width: '384px',
            minWidth: '320px',
            maxWidth: '384px',
            backgroundColor: 'white',
            boxShadow:
              '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Close notifications"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No notifications found</p>
          </div>
        </div>
      )}
    </div>
  );
}
