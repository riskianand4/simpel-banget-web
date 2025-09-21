// Standardized ErrorBoundary export to fix import inconsistencies
export { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
export { ErrorFallback } from '@/components/feedback/ErrorBoundary';

// Re-export production error boundary for specific use cases
export { default as ProductionErrorBoundary } from '@/components/ui/production-error-boundary';