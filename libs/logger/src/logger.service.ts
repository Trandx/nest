import { ConsoleLogger, Injectable } from '@nestjs/common';
import { asyncLocalStorage, CORRELATION_ID_KEY, REQUEST_ID_KEY } from './async-context';
import { LoggerModuleOptions } from './logger.interfaces';

@Injectable()
export class LoggerService extends ConsoleLogger {
  constructor(private readonly config: LoggerModuleOptions = {}) {
    super();
  }

  /** Définit le contexte de cette instance */
  setContext(context: string) {
    this.context = context;
  }

  /** Récupère correlationId et requestId depuis AsyncLocalStorage */
  private getIds() {
    const store = asyncLocalStorage.getStore();
    return {
      correlationId: store?.get(CORRELATION_ID_KEY) || null,
      requestId: store?.get(REQUEST_ID_KEY) || null,
    };
  }

  /** Formate le message avec contexte, correlationId et requestId */
  private formatLogMessage({ level, message, context, userId}:{level: string, message: any, context?: string, userId?: string}) {
    const { correlationId, requestId } = this.getIds();
    const finalContext = context || this.context;

    if (this.config.format === 'pretty') {
      return [
        correlationId ? `[correlationId = ${correlationId}]` : '',
        requestId ? `[requestId = ${requestId}]` : '',
        message
      ].filter(Boolean).join(' ');
    }

    // format JSON ELK-ready par défaut
    return JSON.stringify({
      pid: process.pid,
      timestamp: new Date().toISOString(),
      level,
      context: finalContext || null,
      correlationId,
      requestId,
      userId: this.config.includeUserId ? userId : undefined,
      message,
    });
  }

  log(message: any, context?: string) {
    if (context) {
        super.log(this.formatLogMessage({ level: 'LOG', message, context}), context);
        return;
    }
    super.log(this.formatLogMessage({ level: 'LOG', message, context}));
  }

  error(message: any, trace?: string, context?: string) {
     if (context) {
        super.error(this.formatLogMessage({ level: 'ERROR', message, context}), trace, context);
        return;
    }
    super.error(this.formatLogMessage({ level: 'ERROR', message, context}), trace);
  }

  warn(message: any, context?: string) {
    if (context) {
        super.warn(this.formatLogMessage({ level: 'WARN', message, context}), context);
        return;
    }
    super.warn(this.formatLogMessage({ level: 'WARN', message, context}));
  }

  debug(message: any, context?: string) {
    if (context) {
        super.debug(this.formatLogMessage({ level: 'DEBUG', message, context}), context);
        return;
    }
    super.debug(this.formatLogMessage({ level: 'DEBUG', message, context}));
  }

  verbose(message: any, context?: string) {
    
    if (context) {
       super.verbose(this.formatLogMessage({ level: 'VERBOSE', message, context}), context);
        return;
    }
    super.verbose(this.formatLogMessage({ level: 'VERBOSE', message, context}));
  }
}
