'use client';

import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Z_INDEX } from '@/lib/utils';

/**
 * Lightweight message bell for unauthenticated sessions.
 * Matches MessageBell trigger + empty state without socket/popover/date-fns cost.
 */
export default function NavMessageBellShell() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative touch-manipulation min-h-[44px] min-w-[44px] p-2"
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
        aria-label="Messages"
      >
        <MessageSquare className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div
          className="absolute top-full right-0 mt-3 p-0 shadow-2xl border border-gray-200 rounded-xl overflow-hidden"
          style={{
            zIndex: Z_INDEX.TOP_LEVEL_DROPDOWN,
            width: '384px',
            maxWidth: '384px',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            maxHeight: '80vh',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow:
              '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">Messages</h3>
                  <p className="text-sm text-gray-500">0 unread</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="hover:bg-gray-100 rounded-lg"
                aria-label="Close messages"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-8 text-center text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No messages yet</p>
            <p className="text-sm leading-relaxed">Start a conversation to see messages here</p>
          </div>
        </div>
      )}
    </div>
  );
}
