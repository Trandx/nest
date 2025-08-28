import { DynamicModule, Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './global-exception.filter';
import { EventModule } from '@/utils/event';
import { GLOBAL_EXCEPTION_EVENT_NAME } from './const';

export interface GlobalExceptionModuleOptions {
  eventNameEmitted?: string;
}

@Global()
@Module({})
export class GlobalExceptionModule {
  static register(options: GlobalExceptionModuleOptions): DynamicModule {
    const { eventNameEmitted = 'global.exception' } = options;
    const imports = [EventModule] // pour injecter EventService
    const providers = [
      {
        provide: APP_FILTER,
        useClass: GlobalExceptionFilter,
      },
      {
        provide: GLOBAL_EXCEPTION_EVENT_NAME,
        useValue: eventNameEmitted,
      }
    ]
    return {
      module: GlobalExceptionModule,
      global: true,
      imports,
      providers,
      exports: [],
    };
  }
}