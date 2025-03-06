import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from '../../../utils';
import { ChannelModel as Connection } from 'amqplib';
import { RpcClient } from './rpc-client';

@Injectable()
export class RabbitMQService extends RpcClient implements OnModuleDestroy {

  constructor(public readonly poolService: Pool<Connection>) {
    super()
  }

  onModuleDestroy() {
    this.poolService.shutdown();
  }
}
