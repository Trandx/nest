// async-context.ts
import { AsyncLocalStorage } from 'async_hooks';

export const asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

export const CORRELATION_ID_KEY = 'correlationId';

export const REQUEST_ID_KEY = 'requestId';
