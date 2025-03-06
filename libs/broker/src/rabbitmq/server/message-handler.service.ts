import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { ServerRMQService } from './server.service';
import { MESSAGE_METADATA, MessageHandlerMetadata } from './decorator';

@Injectable()
export class MessageHandlerService implements OnModuleInit {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly serverRMQService: ServerRMQService,
  ) {}

  onModuleInit() {
    this.registerMessageHandlers();
  }

  private registerMessageHandlers() {
    const controllers = this.discoveryService.getControllers();
    
    controllers.forEach((wrapper: InstanceWrapper) => {
      const { instance } = wrapper;
      if (!instance) return;

      // Obtenir toutes les propriétés du prototype de l'instance
      const prototype = Object.getPrototypeOf(instance);
      const methodNames = Object.getOwnPropertyNames(prototype)
        .filter(item => item !== 'constructor' && typeof prototype[item] === 'function');

      methodNames.forEach(methodName => {
        const handler = prototype[methodName];
        const metadata = this.reflector.get<MessageHandlerMetadata>(
          MESSAGE_METADATA,
          handler
        );

        if (metadata) {
          this.serverRMQService.handle(metadata.queueName, async (data: any) => {
            try {
              return await instance[methodName].call(instance, data);
            } catch (error) {
              console.error(
                `Error in message handler for ${metadata.queueName}:`,
                error
              );
              throw error;
            }
          });
        }
      });
    });
  }
}