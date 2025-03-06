import { uid } from "../../../utils";
import zlib from 'node:zlib';
import { Pool } from "../../../utils/pool";
import { ChannelModel as Connection } from "amqplib";

type MessageType = {
  command: string;
  data: any;
}

type SendType = {
  to: string,
  message: MessageType
}

export abstract class RpcClient {
  constructor() {
    this.compressor = zlib;
  }

  abstract poolService: Pool<Connection>

  private readonly compressor: typeof zlib 

  private zip(message: any): Buffer {
    try {
      return this.compressor.gzipSync(JSON.stringify(message));
    } catch (error) {
      console.error("Error during compression:", error);
      throw new Error("Compression failed");
    }
  }

  private unzip(message: Buffer): string {
    try {
      return this.compressor.gunzipSync(message).toString();
    } catch (error) {
      console.error("Error during decompression:", error);
      throw new Error("Decompression failed");
    }
  }
  /**
   * 
   * @param to microservice 
   * @param message 
   * @param queueName 
   * @returns 
   */
  async send( { to: queueName = 'rpc_queue', message} : SendType) {
    
    const connection = await this.poolService.getClient();
    const channel = await connection.createChannel();

    try {
      const replyQueue = await channel.assertQueue('', { 
        exclusive: true,
        durable: true,  // Does not persist after server restarts
        autoDelete: true // Deleted when the connection or channel closes
      });

      return new Promise((resolve, reject) => {
        const correlationId = uid();

        try{
          // Compress the message (Gzip)
          const compressedMessage = this.zip(message);

          channel.sendToQueue(queueName, compressedMessage, {
            replyTo: replyQueue.queue,
            correlationId,
          });

          channel.consume(
            replyQueue.queue,
            async (msg) => {
              try{

                if (!msg) throw new Error('Empty message received');

                const messageContent= this.unzip(msg.content);

                const message = JSON.parse(messageContent);
                console.log('response:', message);

                if (msg.properties.correlationId === correlationId) {
                  resolve(message);
                }

                channel.ack(msg);
                
                channel.close(); // Close the channel
                this.poolService.releaseClient(connection); // Release the connection
              } catch (error) {
                console.error("Error processing response:", error);
                msg && channel.nack(msg, false, false); // Reject the message without requeue
                reject(error);
              }
            },
            { noAck: false }
          );
        } catch (error) {
          console.error("Error sending message:", error);
          reject(error);
        }
      });
    } catch (err) {
      console.error('Error in RPC client:', err);
      throw err;
    }
  }
}
