import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './global-exception.filter';
import { EventModule } from '@/utils/event';

@Global()
@Module({
  imports: [EventModule], // pour injecter EventService
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class GlobalExceptionModule {}
