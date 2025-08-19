/**
 * Enhanced Error Boundary Component
 * Handles API errors, network issues, and component crashes gracefully
 */

"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRecovering: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      isRecovering: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
      console.error('Production error:', error.message);
    }
  }

  private handleRetry = () => {
    this.setState({ isRecovering: true });
    
    // Attempt to recover by resetting error state
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false,
      });
    }, 1000);
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleGoBack = () => {
    window.history.back();
  };

  private isApiError = (error: Error): boolean => {
    return error.message.includes('Failed to fetch') ||
           error.message.includes('Network Error') ||
           error.message.includes('API') ||
           error.message.includes('HTTP');
  };

  private isNetworkError = (error: Error): boolean => {
    return error.message.includes('Network Error') ||
           error.message.includes('Failed to fetch') ||
           error.message.includes('ERR_NETWORK');
  };

  private isAuthError = (error: Error): boolean => {
    return error.message.includes('Unauthorized') ||
           error.message.includes('401') ||
           error.message.includes('Forbidden') ||
           error.message.includes('403');
  };

  private getErrorMessage = (error: Error): string => {
    if (this.isNetworkError(error)) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    
    if (this.isAuthError(error)) {
      return 'Authentication required. Please log in to continue.';
    }
    
    if (this.isApiError(error)) {
      return 'Service temporarily unavailable. Please try again later.';
    }
    
    return error.message || 'Something went wrong. Please try again.';
  };

  private getErrorIcon = (error: Error): ReactNode => {
    if (this.isNetworkError(error)) {
      return <AlertTriangle className="w-16 h-16 text-yellow-500" />;
    }
    
    if (this.isAuthError(error)) {
      return <AlertTriangle className="w-16 h-16 text-red-500" />;
    }
    
    return <AlertTriangle className="w-16 h-16 text-red-500" />;
  };

  private getErrorActions = (): ReactNode => {
    const { error } = this.state;
    
    if (!error) return null;

    if (this.isAuthError(error)) {
      return (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={this.handleGoHome} variant="outline" className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            Go Home
          </Button>
          <Button onClick={this.handleRetry} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      );
    }

    if (this.isNetworkError(error)) {
      return (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={this.handleRetry} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
          <Button onClick={this.handleGoBack} variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={this.handleRetry} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
        <Button onClick={this.handleGoHome} variant="outline" className="flex items-center gap-2">
          <Home className="w-4 h-4" />
          Go Home
        </Button>
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      const { error, isRecovering } = this.state;
      
      if (isRecovering) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <RefreshCw className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Recovering...</h2>
              <p className="text-gray-600">Please wait while we restore the application.</p>
            </div>
          </div>
        );
      }

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            {this.getErrorIcon(error!)}
            
            <h1 className="mt-6 text-2xl font-bold text-gray-900">
              Oops! Something went wrong
            </h1>
            
            <p className="mt-4 text-gray-600">
              {this.getErrorMessage(error!)}
            </p>
            
            {error && process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Show error details (development only)
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-800 overflow-auto">
                  {error.stack}
                </pre>
              </details>
            )}
            
            <div className="mt-8">
              {this.getErrorActions()}
            </div>
            
            <div className="mt-6 text-sm text-gray-500">
              <p>If the problem persists, please contact support.</p>
              <p className="mt-1">Error ID: {error?.name || 'Unknown'}</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook-based error boundary for functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    
    // Log error
    console.error('useErrorHandler caught error:', error);
    
    // Report to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
    }
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}

// API Error Handler Component
export function ApiErrorHandler({ 
  error, 
  onRetry, 
  onGoBack 
}: { 
  error: Error | null; 
  onRetry?: () => void; 
  onGoBack?: () => void; 
}) {
  if (!error) return null;

  const isNetworkError = error.message.includes('Network Error') || 
                        error.message.includes('Failed to fetch');
  
  const isAuthError = error.message.includes('Unauthorized') || 
                     error.message.includes('401');

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {isNetworkError ? 'Connection Error' : 
             isAuthError ? 'Authentication Required' : 
             'Error Occurred'}
          </h3>
          <p className="mt-1 text-sm text-red-700">
            {error.message}
          </p>
          <div className="mt-3 flex gap-2">
            {onRetry && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onRetry}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                Try Again
              </Button>
            )}
            {onGoBack && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onGoBack}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                Go Back
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
