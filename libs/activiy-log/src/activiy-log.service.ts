import { EventMap, EventService, EventType } from '@/utils/event';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ActivityLogService extends EventService {

   send<T extends EventMap>(
    data: { eventName: keyof T; payload: T[keyof T] }
  ) {
        try {
            return this.emitEvent(data)
        } catch (error) {
            throw error;
        }
    }

   sendAsync<T extends EventMap>(
    data: { eventName: keyof T; payload: T[keyof T] }
  ) {
        try {
            return this.emitAsyncEvent(data)
        } catch (error) {
            throw error;
        }
    }
}
