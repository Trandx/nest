// logger.module.ts
import { DynamicModule, Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerMiddleware } from './logger.middleware';
import { LoggerModuleOptions } from './logger.interfaces';
import { LoggerService } from './logger.service';

@Global()
@Module({})
export class LoggerModule implements NestModule {
  static register(options : LoggerModuleOptions = {}): DynamicModule {
    const { format = 'pretty', includeUserId = true } = options;
    return {
      module: LoggerModule,
      providers: [
        {
           provide: LoggerService,
          useFactory: () => {
            const logger = new LoggerService();
            logger.setConfig({ format, includeUserId });
            return logger;
          }
        },
      ],
      exports: [LoggerService],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

