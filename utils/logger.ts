/**
 * Utility for controlled logging in the application.
 * In production, only error logs are shown.
 */

// Determine if we're in production mode
const isProduction = process.env.NODE_ENV === "production";

/**
 * Logger utility that conditionally logs based on environment
 */
class Logger {
  /**
   * Log information (only in development)
   */
  info(message: string, ...args: any[]): void {
    if (!isProduction) {
      console.log(message, ...args);
    }
  }

  /**
   * Log warnings (only in development)
   */
  warn(message: string, ...args: any[]): void {
    if (!isProduction) {
      console.warn(message, ...args);
    }
  }

  /**
   * Log errors (always shown)
   */
  error(message: string, ...args: any[]): void {
    console.error(message, ...args);
  }
}

export const logger = new Logger();
