import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from './components/ui/theme-provider.tsx';
import { AppProvider } from './contexts/AppContext.tsx';
import App from './App.tsx';
import './index.css';
import { optimizeBundle } from './utils/build-optimizer.ts';
import ProductionErrorBoundary from './components/ui/production-error-boundary.tsx';
import { logger } from './utils/logger.ts';

// Initialize production optimizations
optimizeBundle();

// Initialize error reporting
logger.info('Application starting', {
  mode: import.meta.env.MODE,
  timestamp: new Date().toISOString(),
});

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProductionErrorBoundary
      onError={(error, errorInfo) => {
        logger.error('React Error Boundary caught error', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="inventory-theme">
          <AppProvider>
            <BrowserRouter>
              <App />
              <Toaster 
                position="bottom-right"
                expand={false}
                richColors
                closeButton
                duration={4000}
              />
            </BrowserRouter>
          </AppProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ProductionErrorBoundary>
  </StrictMode>,
);