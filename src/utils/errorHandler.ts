/**
 * ErrorHandler
 *
 * Utility for handling errors gracefully with retry logic, exponential backoff,
 * safe error logging, and user-friendly error messages.
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

export class ErrorHandler {
  /**
   * Retry a function with exponential backoff
   */
  static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 8000,
      backoffMultiplier = 2,
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        const delay = Math.min(
          initialDelay * Math.pow(backoffMultiplier, attempt),
          maxDelay
        );

        console.warn(
          `Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`,
          lastError.message
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Retry failed');
  }

  /**
   * Log error safely (without exposing sensitive data)
   */
  static logError(error: Error, context?: string): void {
    const message = context 
      ? `[${context}] ${error.message}`
      : error.message;
    
    console.error(message, {
      name: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: Error): string {
    if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
      return 'Network error. Please check your connection.';
    }
    if (error.message.includes('429')) {
      return 'Too many requests. Please wait a moment.';
    }
    if (error.message.includes('404')) {
      return 'Data not found. Please try a different coin.';
    }
    return 'Something went wrong. Please try again later.';
  }
}

