import { EventService, EventType } from '@/utils/event';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ActivityLogService extends EventService {

    send(data: EventType) {
        try {
            return this.emitEvent(data)
        } catch (error) {
            throw error;
        }
    }

    async sendAsync(data: EventType) {
        try {
            return this.emitAsyncEvent(data)
        } catch (error) {
            throw error;
        }
    }
}
