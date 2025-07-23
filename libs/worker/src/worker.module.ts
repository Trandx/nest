// src/worker/worker.module.ts
import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WorkerService } from './worker.service';
import { WorkerProcessor } from './worker.processor';
import { REQUEST_CONTEXT_ID } from '@nestjs/core/router/request/request-constants';
import { ContextIdFactory } from '@nestjs/core';

@Global()
@Module({})
export class WorkerModule {
  static register(
    redisConfig: { host: string; port: number },
    extraModules: DynamicModule['imports'] = [],
  ) {
     const providers: Provider[] = [
      // {
      //   provide: REQUEST_CONTEXT_ID,
      //   useFactory: () => ContextIdFactory.create(),
      // },
      WorkerProcessor,
      WorkerService,
    ];

    return {
      module: WorkerModule,
      providers,
      imports: [
        BullModule.forRootAsync({
          useFactory: () => ({
            connection: redisConfig,
          }),
        }),
        BullModule.registerQueue({
          name: 'heavyTasks',
        }),
        ...extraModules, // Allow additional modules to be imported
      ],
      exports: [WorkerService],
    };
  }
}