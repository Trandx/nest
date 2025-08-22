import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EventModule } from '@/utils/event';

@Module({
  imports: [ EventModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
