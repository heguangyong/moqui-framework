/**
 * Authentication Logger Utility
 * Feature: 08-02-auth-diagnosis-fix
 * 
 * Provides structured logging for authentication-related events
 * to aid in debugging and diagnostics.
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
}

class AuthLoggerClass {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Prevent memory issues

  private addLog(level: LogLevel, component: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      component,
      message,
      data
    };

    this.logs.push(entry);

    // Trim old logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console for immediate visibility
    const consoleMsg = `[${level}] [${component}] ${message}`;
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(consoleMsg, data);
        break;
      case LogLevel.INFO:
        console.info(consoleMsg, data);
        break;
      case LogLevel.WARN:
        console.warn(consoleMsg, data);
        break;
      case LogLevel.ERROR:
        console.error(consoleMsg, data);
        break;
    }
  }

  debug(component: string, message: string, data?: any): void {
    this.addLog(LogLevel.DEBUG, component, message, data);
  }

  info(component: string, message: string, data?: any): void {
    this.addLog(LogLevel.INFO, component, message, data);
  }

  warn(component: string, message: string, data?: any): void {
    this.addLog(LogLevel.WARN, component, message, data);
  }

  error(component: string, message: string, data?: any): void {
    this.addLog(LogLevel.ERROR, component, message, data);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  clearLogs(): void {
    this.logs = [];
  }

  getLogCount(): number {
    return this.logs.length;
  }
}

// Export singleton instance
export const authLogger = new AuthLoggerClass();
