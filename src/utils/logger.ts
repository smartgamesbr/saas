import { User } from '../types';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private static logs: LogEntry[] = [];
  private static readonly MAX_LOGS = 1000;

  private static log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };

    console[level](message, data || '');
    
    this.logs.push(entry);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }
  }

  static info(message: string, data?: any) {
    this.log('info', message, data);
  }

  static warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  static error(message: string, data?: any) {
    this.log('error', message, data);
  }

  static debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  static getAuthStateLog(user: User | null, isLoading: boolean) {
    this.debug('Auth State:', { 
      isLoading,
      hasUser: !!user,
      userDetails: user ? {
        id: user.id,
        isAdmin: user.isAdmin,
        isSubscribed: user.isSubscribed
      } : null
    });
  }

  static getLogs(): LogEntry[] {
    return [...this.logs];
  }
}

export default Logger;