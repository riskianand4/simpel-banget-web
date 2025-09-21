import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { errorReporter } from '@/utils/errorReporting';

interface ProductionErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ProductionErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ProductionErrorBoundary extends React.Component<
  ProductionErrorBoundaryProps,
  ProductionErrorBoundaryState
> {
  private retryTimeoutId: number | null = null;

  constructor(props: ProductionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ProductionErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report error to external service
    errorReporter.reportError(error, 'ErrorBoundary', {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl text-foreground">
                Something went wrong
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                We're sorry for the inconvenience. The error has been reported to our team.
              </p>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {import.meta.env.MODE === 'development' && this.state.error && (
                <div className="p-3 bg-muted rounded-md">
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium text-destructive">
                      Error Details (Development Only)
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap text-xs overflow-auto max-h-32">
                      {this.state.error.message}
                      {this.state.error.stack && `\n\n${this.state.error.stack}`}
                    </pre>
                  </details>
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Home
                </Button>
                
                <Button variant="ghost" onClick={this.handleReload} className="w-full text-xs">
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ProductionErrorBoundary;