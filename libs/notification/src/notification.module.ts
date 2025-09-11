import { Global, Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EventModule } from '@/utils/event';

@Global()
@Module({
  imports: [ EventModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
