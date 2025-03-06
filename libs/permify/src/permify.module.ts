import { DynamicModule, Module } from '@nestjs/common';

import { Config, newClient } from '@permify/permify-node/dist/src/grpc';

export type PermifyClient = ReturnType<typeof newClient>

@Module({})
export class PermifyModule {
  static register(config: Config): DynamicModule {
    return {
      global: true,
      module: PermifyModule,
      providers: [
        {
          provide: 'PERMIFY_CLIENT',
          useFactory: () => newClient(config),
        },
      ],
      exports: ['PERMIFY_CLIENT'],
    };
  }
}
