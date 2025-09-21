// Optimized Circuit Breaker with minimal logging
import { logger } from './logger';

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN', 
  HALF_OPEN = 'HALF_OPEN'
}

export class OptimizedCircuitBreaker {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private nextAttemptTime = 0;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 300000
    }
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      } else {
        this.state = CircuitState.HALF_OPEN;
        logger.debug(`Circuit breaker ${this.name} transitioning to HALF_OPEN`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.resetTimeout;
      logger.warn(`Circuit breaker ${this.name} opened after ${this.failureCount} failures`);
    }
  }

  getState(): string {
    return this.state;
  }

  getStats(): { state: string; failures: number; lastFailure: number } {
    return {
      state: this.state,
      failures: this.failureCount,
      lastFailure: this.lastFailureTime
    };
  }
}