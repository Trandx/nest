import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventType } from './interface';


@Injectable()
export class EventService {
  constructor(protected readonly eventEmitter: EventEmitter2) {}
  //protected readonly eventEmitter: EventEmitter
  /**
   * Emit an event with the given name and payload.
   * @param eventName - The name of the event to emit.
   * @param payload - The payload to send with the event.
   */

  emitEvent({eventName, payload}: EventType) {
    return this.eventEmitter.emit(eventName, payload);
  }
  /**
   * Emit an event asynchronously and return the results.
   * @param eventName - The name of the event to emit.
   * @param payload - The payload to send with the event.
   */

  async emitAsyncEvent({eventName, payload}: EventType) {
    return await this.eventEmitter.emitAsync(eventName, payload);
  }
}
