import { DynamicModule, Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisConfig } from './redis.config';
import Redis, { RedisOptions } from 'ioredis';
import { ConfigOptions, Pool } from 'libs/utils';

@Global()
@Module({})
export class RedisModule {
  static register( config:  ConfigOptions<RedisOptions> ): DynamicModule {

    return {
      module: RedisModule,
      providers: [ 
        {
          provide: Pool,
          useFactory: () => {
            const redisConfig = new RedisConfig(config)
            return new Pool<Redis>(redisConfig); // Instantiate Pool with RedisConfig instance
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
