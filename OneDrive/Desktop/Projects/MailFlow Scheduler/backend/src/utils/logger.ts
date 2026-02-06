export interface LogEntry {
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

class Logger {
  private formatLog(level: LogEntry['level'], message: string, data?: Record<string, unknown>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    };
  }

  info(message: string, data?: Record<string, unknown>): void {
    const log = this.formatLog('info', message, data);
    console.log(JSON.stringify(log));
  }

  error(message: string, data?: Record<string, unknown>): void {
    const log = this.formatLog('error', message, data);
    console.error(JSON.stringify(log));
  }

  warn(message: string, data?: Record<string, unknown>): void {
    const log = this.formatLog('warn', message, data);
    console.warn(JSON.stringify(log));
  }

  debug(message: string, data?: Record<string, unknown>): void {
    const log = this.formatLog('debug', message, data);
    console.debug(JSON.stringify(log));
  }
}

export const logger = new Logger();
