
import zlib from "node:zlib";
import { Pool } from "../../../utils";
import { ChannelModel as Connection } from "amqplib";

export class RpcServer {
  constructor(
    private readonly poolService: Pool<Connection>
  ) {
    this.compressor = zlib;
    this.handles = {};
  }

  private readonly compressor: typeof zlib 

  private handles: Record<string, Function>; // Store RPC routes (method handlers)

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

  // Register a route (method)
  handle(title: string, callback: Function): void {
    if (!title || typeof callback !== "function") {
      throw new Error("Invalid title or callback for handle");
    }
    this.handles[title] = callback;
  }

  // Start the server
  /**
   * 
   * @param queueName Microservice queueName
   * @param callback 
   */
  async listen(queueName: string, callback: () => void): Promise<void> {
    if (!queueName || typeof queueName !== "string") {
      throw new Error("Queue name must be a valid string");
    }

    const client =  await this.poolService.getClient();
    
    const channel = await client.createChannel();

    try {
      await channel.assertQueue(queueName, { durable: false });
      channel.prefetch(1); // Process one request at a time

      console.log(`[x] Awaiting RPC requests on ${queueName}`);

      channel.consume(
        queueName,
        async (msg) => {
          if (!msg) return;

          try {
            const messageContent = this.unzip(msg.content);
            const { command, data } = JSON.parse(messageContent);
            console.log("Received message:", data);

            // Route handling
            const handler = this.handles[command];
            let result: any;

            if (handler) {
              try {
                result = await handler(data);
              } catch (error) {
                console.error(`Error processing method: ${command}`, error);
                result = { error: "Internal Server Error" };
              }
            } else {
              console.warn(`No handler for method: ${command}`);
              result = { error: `Unknown method: ${command}` };
            }

            // Compress the message (Gzip)
            const compressedMessage = this.zip(result);

            // Send response
            channel.sendToQueue(
              msg.properties.replyTo,
              compressedMessage,
              { correlationId: msg.properties.correlationId }
            );

            channel.ack(msg); // Acknowledge the message
          } catch (error) {
            console.error("Error processing message:", error);
            channel.nack(msg, false, false); // Reject message without requeue
          }
        },
        { noAck: false } // Enable manual acknowledgment
      );

      if (typeof callback === "function") {
        callback();
      }
    } catch (err) {
      console.error("Error in RPC server:", err);
      throw err;
    }
  }
}
