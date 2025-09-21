// Global request throttler to prevent API spam
class GlobalRequestThrottler {
  private requestCounts = new Map<string, number>();
  private resetTimers = new Map<string, NodeJS.Timeout>();
  private readonly maxRequestsPerSecond = import.meta.env.DEV ? 15 : 8; // More reasonable limits
  private readonly healthCheckLimit = import.meta.env.DEV ? 5 : 2; // Separate limit for health checks
  private readonly windowMs = 1000;

  canMakeRequest(endpoint: string): boolean {
    const count = this.requestCounts.get(endpoint) || 0;
    
    // Use different limits for health checks vs other endpoints
    const limit = endpoint.includes('/health') ? this.healthCheckLimit : this.maxRequestsPerSecond;
    
    if (count >= limit) {
      console.warn(`🚫 Request rate limit exceeded for ${endpoint}: ${count}/${limit}`);
      return false;
    }
    
    return true;
  }

  recordRequest(endpoint: string): void {
    const currentCount = this.requestCounts.get(endpoint) || 0;
    this.requestCounts.set(endpoint, currentCount + 1);
    
    // Clear existing timer
    const existingTimer = this.resetTimers.get(endpoint);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set new reset timer
    const timer = setTimeout(() => {
      this.requestCounts.delete(endpoint);
      this.resetTimers.delete(endpoint);
    }, this.windowMs);
    
    this.resetTimers.set(endpoint, timer);
  }

  reset(): void {
    // Clear all timers
    for (const timer of this.resetTimers.values()) {
      clearTimeout(timer);
    }
    
    this.requestCounts.clear();
    this.resetTimers.clear();
  }

  getStats(): { endpoint: string; count: number }[] {
    return Array.from(this.requestCounts.entries()).map(([endpoint, count]) => ({
      endpoint,
      count,
    }));
  }
}

export const globalRequestThrottler = new GlobalRequestThrottler();