import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ChannelModel as Connection } from 'amqplib';
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
) {}

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
        console.error('Error cleaning up channel:', error);
    }
}


private async startListening(): Promise<void> {
    console.log(this.queueName);
    
    if (!this.queueName || typeof this.queueName !== 'string') {
    throw new Error('Queue name must be a valid string');
    }

    const client = await this.poolService.getClient();
    const channel = await client.createChannel();

    client.on('error', async (error) => {
        console.error('RMQ server error, retrying...', error);
        await this.cleanupChannel(channel, client);
        setTimeout(() => this.startListening(), this.reconnectionTimeout); // Retry after 5 seconds
    })

    client.on('close', () => {
        console.error('Server Connection closed, retrying...');
        setTimeout(() => this.startListening(), this.reconnectionTimeout); // Retry after 5 seconds
    })

    try {
    await channel.assertQueue(this.queueName, { durable: false });
    channel.prefetch(1);
    console.log(`[x] Awaiting RPC requests on ${this.queueName}`);

    channel.consume(
        this.queueName,
        async (msg) => {
        if (!msg) return;

        try {
            const messageContent = this.unzip(msg.content);
            const { command, data } = JSON.parse(messageContent);
            console.log('Received message:', data);

            const handler = this.handles[command];
            let result: any;

            if (handler) {
            try {
                result = await handler(data);
            } catch (error) {
                console.error(`Error processing method: ${command}`, error);
                result = { error: 'Internal Server Error' };
            }
            } else {
            console.warn(`No handler for method: ${command}`);
            result = { error: `Unknown method: ${command}` };
            }

            const compressedMessage = this.zip(result);

            channel.sendToQueue(
            msg.properties.replyTo,
            compressedMessage,
            { correlationId: msg.properties.correlationId }
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
}