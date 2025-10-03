import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { ActivityLogService } from './activiy-log.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ActivityLogInterceptor } from './activiy-log.interceptor';
import { ACTIVITY_LOG_EVENT_NAME } from './const';

export interface ActivityLogModuleOptions {
  globalInterceptor?: boolean;
  eventName?: string;
}

@Global()
@Module({})
export class ActivityLogModule {
  static register(options: ActivityLogModuleOptions = {}): DynamicModule {
    const { globalInterceptor = true, eventName: eventName = 'new.activity' } = options;

    const providers: Provider[] = [
      ActivityLogService,
      {
        provide: ACTIVITY_LOG_EVENT_NAME,
        useValue: eventName,
      },
    ];

    if (globalInterceptor) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: ActivityLogInterceptor,
      });
    }

    return {
      module: ActivityLogModule,
      imports: [],
      providers,
      exports: [ActivityLogService],
      global: true, // ✅ pour que le module soit global même en mode register()
    };
  }
}
