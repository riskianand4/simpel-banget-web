import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { errorReporter } from '@/utils/errorReporting';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  component?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ComprehensiveErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { component, onError } = this.props;

    this.setState({ errorInfo });

    // Log error locally
    logger.error(`Error in ${component || 'Component'}`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Report error to external service
    errorReporter.reportError(error, component, {
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
    });

    // Call custom error handler
    onError?.(error, errorInfo);
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    } else {
      // Max retries reached, reload the page
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const { fallback, showDetails = false } = this.props;
      const { error, errorInfo, retryCount } = this.state;

      if (fallback) {
        return fallback;
      }

      const canRetry = retryCount < this.maxRetries;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Something went wrong</CardTitle>
              <CardDescription>
                {canRetry 
                  ? 'An unexpected error occurred. You can try again.'
                  : 'Multiple errors occurred. The page will be reloaded.'
                }
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {showDetails && error && (
                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm font-mono text-muted-foreground">
                    {error.message}
                  </p>
                  {errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-muted-foreground">
                        Technical Details
                      </summary>
                      <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant={canRetry ? "default" : "destructive"}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {canRetry ? `Retry (${this.maxRetries - retryCount} left)` : 'Reload Page'}
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Error ID: {Date.now().toString(36)}
                {retryCount > 0 && ` • Attempt ${retryCount + 1}`}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component wrapper
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ComprehensiveErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ComprehensiveErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}