/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

/**
 * 日志工具类
 */
export class Logger {
  private static formatMessage(level: LogLevel, message: string, requestId?: string, meta?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const requestInfo = requestId ? `[RequestId: ${requestId}]` : '';
    const metaInfo = meta ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]${requestInfo} ${message}${metaInfo}`;
  }

  static debug(message: string, requestId?: string, meta?: Record<string, any>): void {
    console.debug(this.formatMessage(LogLevel.DEBUG, message, requestId, meta));
  }

  static info(message: string, requestId?: string, meta?: Record<string, any>): void {
    console.info(this.formatMessage(LogLevel.INFO, message, requestId, meta));
  }

  static warn(message: string, requestId?: string, meta?: Record<string, any>): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, requestId, meta));
  }

  static error(message: string, requestId?: string, meta?: Record<string, any>): void {
    console.error(this.formatMessage(LogLevel.ERROR, message, requestId, meta));
  }
} 