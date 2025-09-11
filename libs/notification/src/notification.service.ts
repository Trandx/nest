// notification.service.ts
import { Injectable } from '@nestjs/common';
import { EventService } from '../../utils/event/event.service';
import { EventMap } from '@/utils/event';

@Injectable()
export class NotificationService extends EventService {


  async sendAsync<T extends EventMap>(
    data: { eventName: keyof T; payload: T[keyof T] }
  ) {
    try {
      return await this.emitAsyncEvent(data);
    } catch (error) {
      throw error;
    }
  }


  send<T extends EventMap>(
    data: { eventName: keyof T; payload: T[keyof T] }
  ) {
    try {
      return this.emitEvent(data);
    } catch (error) {
      throw error
    }
  }
}
