import { DynamicModule, Global, Module } from "@nestjs/common";
import { ServerRMQService } from "./server.service";
import { MessageHandlerService } from "./message-handler.service"
import { RabbitmqConfig } from "../rabbitmq.config";
import { Pool } from "libs/utils";
import { Options } from 'amqplib'
import { DiscoveryModule } from "@nestjs/core";

@Global()
@Module({})
  export class ServerRMQModule {
    static register(serverQueueName: string, rmqConfig: Options.Connect): DynamicModule {
        
      return {
        module: ServerRMQModule,
        imports: [
          DiscoveryModule,
        ],
        providers: [
          {
            provide: "SERVER_QUEUE_NAME",
            useValue: serverQueueName,
          },
          {
            provide: Pool,
            useFactory: () => {
              const config = new RabbitmqConfig(rmqConfig)
              return new Pool(config); // Instantiate Pool with RabbitmqConfig instance
            },
          },
          ServerRMQService,
          MessageHandlerService
        ],
        exports: [ServerRMQService],
      };
    }
  }