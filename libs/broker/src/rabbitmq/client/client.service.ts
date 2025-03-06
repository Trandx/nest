import { Injectable } from '@nestjs/common';
import { ChannelModel } from 'amqplib';
import * as zlib from 'node:zlib';
import { Pool } from '../../../../utils';
import { uid } from '../../../../utils';
import { SendType } from './interface';

// Extend Promise to add the `timeout` method
interface ExecPromise extends Promise<string> {
  timeout(ms: number): Promise<string>;
}

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

  private async cleanupChannel(channel: any, connection: ChannelModel): Promise<void> {
    try {
      await channel.close();
      this.poolService.releaseClient(connection);
    } catch (error) {
      console.error('Error cleaning up channel:', error);
    }
  }

  send({ to, message,  timeout = 15000 }: SendType): ExecPromise {
    const promise: any = new Promise((resolve, reject) => {
      
      // setTimeout(() => {
      //   resolve({
      //     success: false,
      //     error_type: 'timout',
      //     message:
      //     'RMQ response timeout: Data has been sent, but the remote server did not respond.'
      //   });
      // }, timeout );

      this.sendInternal({ to, message, timeout })
        .then(data => resolve(data))
        .catch(error => reject(error))
    })

    return promise;
  }

  private async sendInternal({ to: queueName = 'rpc_queue', message, timeout }: SendType): Promise<any> {
    const connection = await this.poolService.getClient();
    const channel = await connection.createChannel();

    try {
      const replyQueue = await channel.assertQueue('', {
        exclusive: true,
        durable: true,
        autoDelete: true
      });

      return new Promise((resolve, reject) => {
        try {
          const correlationId = uid();
          const compressedMessage = this.zip(message);

          setTimeout(async () => {
            await this.cleanupChannel(channel, connection);
            reject({
              success: false,
              error_type: 'timout',
              message:
              'RMQ response timeout: Data has been sent, but the remote server did not respond.'
            });
          }, timeout );

          channel.sendToQueue(queueName, compressedMessage, {
            replyTo: replyQueue.queue,
            correlationId,
          });

          channel.consume(
            replyQueue.queue,
            async (msg) => {
              try {
                if (!msg) {
                  reject(new Error('Empty message received'));
                  return;
                }

                const messageContent = this.unzip(msg.content);
                const response = JSON.parse(messageContent);

                if (msg.properties.correlationId === correlationId) {
                  resolve(response);
                }

                channel.ack(msg);
                await this.cleanupChannel(channel, connection);
              } catch (error) {
                console.error('Error processing response:', error);
                msg && channel.nack(msg, false, false);
                reject(error);
              }
            },
            { noAck: false }
          );
        } catch (error) {
          console.error('Error sending message:', error);
          reject(error);
        }
      });
    } catch (err) {
      console.error('Error in RPC client:', err);
      await this.cleanupChannel(channel, connection);
      throw err;
    }
  }
}