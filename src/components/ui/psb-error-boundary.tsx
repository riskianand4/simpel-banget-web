import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface PSBErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface PSBErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

export class PSBErrorBoundary extends React.Component<
  PSBErrorBoundaryProps,
  PSBErrorBoundaryState
> {
  constructor(props: PSBErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<PSBErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[PSB Error Boundary] Caught error:', error);
    console.error('[PSB Error Boundary] Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Add your error reporting service here
      console.error('PSB Error:', { error, errorInfo });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            retry={this.handleRetry}
          />
        );
      }

      return (
        <Card className="p-6 m-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Something went wrong with PSB System</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="space-y-2">
                <p>An unexpected error occurred in the PSB module.</p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-4">
                    <summary className="cursor-pointer font-medium">
                      Error Details (Development)
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                      {this.state.error.toString()}
                    </pre>
                    {this.state.errorInfo && (
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="mt-4 flex gap-2">
            <Button onClick={this.handleRetry} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="secondary"
            >
              Reload Page
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle PSB-specific errors
export const usePSBErrorHandler = () => {
  const handleError = React.useCallback((error: Error, context?: string) => {
    console.error(`[PSB Error${context ? ` - ${context}` : ''}]:`, error);
    
    // You could integrate with toast notifications here
    // or trigger other error handling mechanisms
    
    return {
      message: error.message || 'An unexpected error occurred',
      isNetworkError: error.message?.includes('network') || error.message?.includes('fetch'),
      isValidationError: error.message?.includes('validation') || error.message?.includes('required'),
    };
  }, []);

  return { handleError };
};