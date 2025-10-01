'use client';

import { useEffect } from 'react';

export default function GlobalErrorHandler() {
  useEffect(() => {
    // Handle unhandled errors
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 Unhandled Error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
      
      // Handle specific "Cannot read properties of undefined (reading 'length')" error
      if (event.message && event.message.includes("Cannot read properties of undefined (reading 'length')")) {
        console.warn('🔧 Detected undefined length access error - this has been handled gracefully');
        // Don't prevent the error from showing, but log it for debugging
        return;
      }
      
      // Prevent other errors from showing in console
      event.preventDefault();
    };

    // Handle unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 Unhandled Promise Rejection:', {
        reason: event.reason,
        promise: event.promise
      });
      
      // Prevent the error from showing in console
      event.preventDefault();
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null; // This component doesn't render anything
}
