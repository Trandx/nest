import { DynamicModule, Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisConfig } from './redis.config';
import Redis, { RedisOptions } from 'ioredis';
import { Pool } from 'libs/utils';

@Global()
@Module({})
export class RedisModule {
  static register( config:  RedisOptions ): DynamicModule {

    return {
      module: RedisModule,
      providers: [ 
        {
          provide: Pool,
          useFactory: () => {
            const redisConfig = new RedisConfig(config)
            return new Pool<Redis>(redisConfig); // Instantiate Pool with RabbitmqConfig instance
            // const options = redisConfig.getPoolOptions();
          },
        },
        RedisConfig,
        RedisService
      ],
      exports: [RedisService],

    }
  }
}
