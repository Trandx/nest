// notification.service.ts
import { Injectable } from '@nestjs/common';
import { EventService } from '../../utils/event/event.service';
import { EventType } from '@/utils/event';

@Injectable()
export class NotificationService extends EventService {


  async sendAsync<T extends EventType>( data: T) {
    try {
      return await this.emitAsyncEvent(data)
    } catch (error) {
      throw error
    }
  }

  send( data: EventType) {
    try {
      return this.emitEvent(data);
    } catch (error) {
      throw error
    }
  }
}
