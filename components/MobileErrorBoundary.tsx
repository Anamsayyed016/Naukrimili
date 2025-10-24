'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  Bug, 
  Smartphone,
  Home,
  Mail
} from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  isMobile: boolean;
  userAgent: string;
  timestamp: string;
}

export default class MobileErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      isMobile: false,
      userAgent: '',
      timestamp: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Detect mobile device
    const isMobile = typeof window !== 'undefined' && (
      window.innerWidth <= 768 || 
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );

    this.setState({
      error,
      errorInfo,
      isMobile,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server-side'
    });

    // Log error for debugging
    console.error('🚨 Mobile Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      isMobile,
      userAgent: this.state.userAgent,
      timestamp: this.state.timestamp
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Send error to monitoring service (if available)
    if (typeof window !== 'undefined') {
      this.sendErrorToMonitoring(error, errorInfo);
    }
  }

  private sendErrorToMonitoring = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Send to custom monitoring endpoint
      fetch('/api/errors/mobile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorId: this.state.errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          isMobile: this.state.isMobile,
          userAgent: this.state.userAgent,
          timestamp: this.state.timestamp,
          url: window.location.href,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
          viewport: `${window.screen.width}x${window.screen.height}`,
          devicePixelRatio: window.devicePixelRatio,
          touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
          protocol: window.location.protocol,
          hostname: window.location.hostname
        })
      }).catch(monitoringError => {
        console.warn('Failed to send error to monitoring:', monitoringError);
      });
    } catch (e) {
      console.warn('Failed to send error to monitoring:', e);
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      timestamp: this.state.timestamp,
      userAgent: this.state.userAgent,
      url: window.location.href
    };

    const subject = `Mobile Error Report - ${this.state.errorId}`;
    const body = `Error ID: ${this.state.errorId}
Timestamp: ${this.state.timestamp}
Error: ${this.state.error?.message}
URL: ${window.location.href}
User Agent: ${this.state.userAgent}

Please describe what you were doing when this error occurred:`;

    const mailtoLink = `mailto:support@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full space-y-6">
            {/* Header */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600">
                We encountered an unexpected error. Our team has been notified.
              </p>
            </div>

            {/* Error Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="h-5 w-5" />
                  Error Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Error ID</label>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">{this.state.errorId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Device Type</label>
                    <p className="text-sm bg-gray-100 p-2 rounded flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      {this.state.isMobile ? 'Mobile Device' : 'Desktop'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Timestamp</label>
                    <p className="text-sm bg-gray-100 p-2 rounded">{this.state.timestamp}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Browser</label>
                    <p className="text-sm bg-gray-100 p-2 rounded truncate" title={this.state.userAgent}>
                      {this.state.userAgent.split(' ')[0]}
                    </p>
                  </div>
                </div>

                {this.state.error && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Error Message</label>
                    <p className="text-sm bg-red-50 border border-red-200 p-2 rounded text-red-800">
                      {this.state.error.message}
                    </p>
                  </div>
                )}

                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Component Stack</label>
                    <pre className="text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mobile-Specific Issues */}
            {this.state.isMobile && (
              <Alert className="bg-blue-50 border-blue-200">
                <Smartphone className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Mobile Device Detected:</strong> This error occurred on a mobile device. 
                  Some features may not work properly on mobile browsers. Try refreshing the page or using a desktop browser.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReload} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
              <Button onClick={this.handleReportBug} variant="outline" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Report Bug
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center text-sm text-gray-600">
              <p>
                If this problem persists, please contact our support team with the Error ID above.
              </p>
              <p className="mt-1">
                Error ID: <span className="font-mono font-medium">{this.state.errorId}</span>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
