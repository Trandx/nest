// correlation-id.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { asyncLocalStorage, CORRELATION_ID_KEY, REQUEST_ID_KEY } from './async-context';
import { uid } from '@/utils';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const store = new Map<string, any>();
    const correlationId = req.headers['x-correlation-id'] || uid();
    const requestId = uid();

    store.set(CORRELATION_ID_KEY, correlationId);
    store.set(REQUEST_ID_KEY, requestId);

    asyncLocalStorage.run(store, () => {
      res.setHeader('x-correlation-id', correlationId);
      res.setHeader('x-request-id', requestId);
      next();
    });
  }
}
