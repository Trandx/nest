import { Module, DynamicModule, Global } from '@nestjs/common';
import { ClientRMQService } from './client.service';
import { Pool } from 'libs/utils';
import { RabbitmqConfig } from '../rabbitmq.config';
import { Options } from 'amqplib'
  
@Global()
@Module({})
export class ClientRMQModule {
  static register( rmqConfig: Options.Connect ): DynamicModule {

    return {
      module: ClientRMQModule,
      providers: [
        {
          provide: Pool,
          useFactory: () => {
            const config = new RabbitmqConfig(rmqConfig)
            return new Pool(config); // Instantiate Pool with RabbitmqConfig instance
          },
        },
        ClientRMQService,
      ],
      exports: [ClientRMQService],
    };
  }
}