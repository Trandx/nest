import { Module } from '@nestjs/common';
import { ClientRMQModule, ServerRMQModule } from './rabbitmq';

@Module({
  imports: [
    ClientRMQModule,
    ServerRMQModule
  ],

  exports: [ClientRMQModule, ServerRMQModule]
})
export class BrokerModule {}
