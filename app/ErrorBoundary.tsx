'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Card } from '@/components/ui';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Provides user-friendly error display and recovery options
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console for development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // In production, you might want to log to a service like Sentry
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-slate-600 mb-4">
                We encountered an unexpected error. Our team has been notified and is working on a fix.
              </p>
            </div>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 text-left">
                <details className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <summary className="cursor-pointer font-medium text-red-800 mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="text-sm text-red-700 space-y-2">
                    <div>
                      <strong>Error:</strong>
                      <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
                        {this.state.error.message}
                      </pre>
                    </div>
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            {/* Recovery Actions */}
            <div className="space-y-3">
              <Button
                onClick={this.handleReset}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Try Again
              </Button>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  size="md"
                >
                  Go to Homepage
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="md"
                >
                  Refresh Page
                </Button>
              </div>
            </div>

            {/* Support Information */}
            <div className="mt-8 pt-6 border-t border-slate-200 text-sm text-slate-500">
              <p className="mb-2">
                If this problem persists, please try:
              </p>
              <ul className="text-left max-w-md mx-auto space-y-1">
                <li>• Clearing your browser cache</li>
                <li>• Disabling browser extensions</li>
                <li>• Using a different browser</li>
                <li>• Checking your internet connection</li>
              </ul>
            </div>

            {/* Technical Info */}
            <div className="mt-4 text-xs text-slate-400">
              <p>Error ID: {Date.now()}</p>
              <p>Time: {new Date().toISOString()}</p>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;