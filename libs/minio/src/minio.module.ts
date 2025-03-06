import { DynamicModule, Global, Module } from '@nestjs/common';
import { MinioService } from './minio.service';
import { MinioConfig } from './minio.config';
import { ClientOptions } from 'minio';


@Global()
@Module({})
export class MinioModule {
  static register( config:  ClientOptions ): DynamicModule {

    return {
      module: MinioModule,
      providers: [ 
        {
          provide: MinioService,
          useFactory: () => {
            return new MinioService(config)
          },
        }
      ],
      exports: [MinioService],

    }
  }
}
