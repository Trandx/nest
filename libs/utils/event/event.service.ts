import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventMap } from './interface';


@Injectable()
export class EventService {
  constructor(protected readonly eventEmitter: EventEmitter2) {}
  //protected readonly eventEmitter: EventEmitter
  /**
   * Emit an event with the given name and payload.
   * @param eventName - The name of the event to emit.
   * @param payload - The payload to send with the event.
   */

  emitEvent<T extends EventMap>({eventName, payload}: { eventName: keyof T; payload: T[keyof T] }) {
    return this.eventEmitter.emit(eventName as string, payload);
  }
  /**
   * Emit an event asynchronously and return the results.
   * @param eventName - The name of the event to emit.
   * @param payload - The payload to send with the event.
   */

  async emitAsyncEvent<T extends EventMap>({eventName, payload}: { eventName: keyof T; payload: T[keyof T] }) {
    return await this.eventEmitter.emitAsync(eventName as string, payload);
  }
}
