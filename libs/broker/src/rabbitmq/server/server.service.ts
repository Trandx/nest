import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Channel, ChannelModel as Connection } from 'amqplib';
import * as zlib from 'node:zlib';
import { Pool } from '../../../../utils';
import { RpcHandler, RpcHandlers } from './interface';

@Injectable()
export class ServerRMQService implements OnModuleInit {
    private readonly compressor: typeof zlib = zlib;
    private readonly handles: RpcHandlers = {};
    private isListening = false;

    constructor(
        @Inject('SERVER_QUEUE_NAME') private readonly queueName: string,
        private readonly poolService: Pool<Connection>,
    ) { }

    private reconnectionTimeout = 5000 // ms

    async onModuleInit() {
        if (!this.isListening) {
            await this.startListening();
        }
    }

    private zip(message: any): Buffer {
        try {
            return this.compressor.gzipSync(JSON.stringify(message));
        } catch (error) {
            Logger.error('Error during compression:', error);
            throw new Error('Compression failed');
        }
    }

    private unzip(message: Buffer): string {
        try {
            return this.compressor.gunzipSync(message).toString();
        } catch (error) {
            Logger.error('Error during decompression:', error);
            throw new Error('Decompression failed');
        }
    }

    handle(title: string, callback: RpcHandler): void {
        if (!title || typeof callback !== 'function') {
            throw new Error('Invalid title or callback for handle');
        }
        this.handles[title] = callback;
    }

    private async cleanupChannel(channel: any, connection: Connection): Promise<void> {
        try {
            await channel.close();
            this.poolService.releaseClient(connection);
        } catch (error) {
            Logger.error('Error cleaning up channel:', error);
        }
    }

    private async startListening(): Promise<void> {
        Logger.log(`Starting RMQ server on queue: ${this.queueName}`);

        if (!this.queueName || typeof this.queueName !== 'string') {
            throw new Error('Queue name must be a valid string');
        }

        const client = await this.poolService.getClient();
        const channel = await client.createChannel();

        client.on('error', async (error) => {
            Logger.error('RMQ server error, retrying...', error);
            await this.cleanupChannel(channel, client);
            setTimeout(() => this.startListening(), this.reconnectionTimeout); // Retry after 5 seconds
        })

        client.on('close', () => {
            Logger.error('Server Connection closed, retrying...');
            setTimeout(() => this.startListening(), this.reconnectionTimeout); // Retry after 5 seconds
        })

        try {
            await channel.assertQueue(this.queueName, { durable: false });
            channel.prefetch(1);
            Logger.log(`RMQ server is listening on queue: ${this.queueName}`);

            channel.consume(
                this.queueName,
                async (msg) => {
                    if (!msg) return;

                    try {
                        const messageContent = this.unzip(msg.content);
                        const { command, data } = JSON.parse(messageContent);
                        Logger.log(`Received command: ${command}`, data);

                        if (!command || !data) {
                            Logger.warn('Invalid message format, missing command or data');
                            channel.nack(msg, false, false);
                            return;
                        }

                        const handler = this.handles[command];
                        let result: any;

                        if (handler) {
                            try {
                                result = await handler(data);
                            } catch (error) {
                                Logger.error(`Error in handler for command: ${command}`, error);
                                result = { error: `Error in handler for command: ${command}` };
                            }
                        } else {
                            Logger.warn(`No handler for command: ${command}`);
                            result = { error: `Unknown method: ${command}` };
                        }

                        this.sendMessage(
                            channel,
                            msg.properties.replyTo,
                            {
                                command,
                                data: result,
                                correlationId: msg.properties.correlationId,
                            },
                            //{ persistent: true }
                        );

                        channel.ack(msg);
                        
                    } catch (error) {
                        console.error('Error processing message:', error);
                        channel.nack(msg, false, false);
                    }
                },
                { noAck: false }
            );

            this.isListening = true;
        } catch (err) {
            console.error('Error in RPC server:', err);

            // await this.cleanupChannel(channel, client);
            // setTimeout(() => this.startListening(), this.reconnectionTimeout); // Retry after 5 seconds

            throw err;
        }
    }

    private sendMessage(
        channel: Channel,
        queue: string,
        message: any,
        options: { persistent?: boolean } = {}
    ) {
        if (!queue || typeof queue !== 'string') {
            throw new Error('Queue name must be a valid string');
        }

        const compressedMessage = this.zip(message);
        return channel.sendToQueue(queue, compressedMessage, {
            correlationId: message.correlationId,
            persistent: options.persistent ?? true,
        });
    }
}