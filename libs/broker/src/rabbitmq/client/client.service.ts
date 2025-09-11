import { Injectable } from '@nestjs/common';
import { Channel, ChannelModel } from 'amqplib';
import * as zlib from 'node:zlib';
import { Pool } from '../../../../utils';
import { uid } from '../../../../utils';
import { SendType } from './interface';

@Injectable()
export class ClientRMQService {
  private readonly compressor: typeof zlib = zlib;

  constructor(private readonly poolService: Pool<ChannelModel>) {}

  private zip(message: any): Buffer {
    try {
      return this.compressor.gzipSync(JSON.stringify(message));
    } catch (error) {
      console.error('Error during compression:', error);
      throw new Error('Compression failed');
    }
  }

  private unzip(message: Buffer): string {
    try {
      return this.compressor.gunzipSync(message).toString();
    } catch (error) {
      console.error('Error during decompression:', error);
      throw new Error('Decompression failed');
    }
  }

  private async cleanupChannel(channel: Channel, connection: ChannelModel): Promise<void> {
    if (!channel) return;
    try {
      if (channel.close) {
        await channel.close().catch(() => {}); // ignore already closed
      }
    } finally {
      this.poolService.releaseClient(connection);
    }
  }

  private async sendInternal({ to: queueName = 'rpc_queue', message, timeout }: SendType) {
    const connection = await this.poolService.getClient();
    const channel = await connection.createChannel();

    try {
      const replyQueue = await channel.assertQueue('', {
        exclusive: true,
        durable: true,  // ✅ for RPC reply queues
        autoDelete: true
      });

      return new Promise((resolve, reject) => {
        const correlationId = uid();
        const compressedMessage = this.zip(message);

        // setup timeout
        const timer = setTimeout(async () => {
          await this.cleanupChannel(channel, connection);
          reject({
            success: false,
            error_type: 'timeout',
            message:
              'RMQ response timeout: Data has been sent, but the remote server did not respond.'
          });
        }, timeout);

        channel.sendToQueue(queueName, compressedMessage, {
          replyTo: replyQueue.queue,
          correlationId,
        });

        channel.consume(
          replyQueue.queue,
          async (msg) => {
            if (!msg) return;

            try {
              if (msg.properties.correlationId === correlationId) {
                clearTimeout(timer); // ✅ prevent timeout after response
                const messageContent = this.unzip(msg.content);
                const response = JSON.parse(messageContent);
                resolve(response);
              }
              channel.ack(msg);
            } catch (error) {
              console.error('Error processing response:', error);
              msg && channel.nack(msg, false, false);
              reject(error);
            } finally {
              await this.cleanupChannel(channel, connection);
            }
          },
          { noAck: false }
        );
      });
    } catch (err) {
      console.error('Error in RPC client:', err);
      await this.cleanupChannel(channel, connection);
      throw err;
    }
  }

  send({ to, message, timeout = 15000 }: SendType) {
    return new Promise((resolve, reject) => {
      this.sendInternal({ to, message, timeout })
        .then(data => resolve(data))
        .catch(error => reject(error));
    });
  }
}
