import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { ThemeProvider } from './components/ui/theme-provider.tsx'
import { AppProvider } from './contexts/AppContext.tsx'
import App from './App.tsx'
import './index.css'
import { logger } from './utils/logger.ts'
import { replaceConsoleWithLogger } from './utils/productionLogger.ts'

// Initialize production optimizations
if (!import.meta.env.DEV) {
  replaceConsoleWithLogger();
}

// Initialize error reporting
logger.info('Application starting', {
  mode: import.meta.env.MODE,
  timestamp: new Date().toISOString(),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('401')) {
          return false; // Don't retry auth errors
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('401')) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
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
  </StrictMode>
);
