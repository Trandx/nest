// import { Channel, Connection } from "amqplib";
// import { createPool, Options, Pool } from "generic-pool";
// import { QUEUE } from "./rabbitmq.config";
// import { connectionPool } from "./connection-pool";

// const channelConfig = (): Options => {
//     return  {
//         max: +process.env.RABBITMQ_MAX_CHANNEL || 10, // Maximum number of CHANNELs
//         min: +process.env.RABBITMQ_MIN_CHANNEL || 0,  // Minimum number of connections
//         idleTimeoutMillis: +process.env.RABBITMQ_IDLE_TIMEOUT || 30000, // Close connections idle for 30 seconds
//         acquireTimeoutMillis: 5000, // Wait up to 5 seconds for a channel to become available
//         //testOnBorrow: true, // Validate channel before use
//         evictionRunIntervalMillis: 15000, // Check every 15 seconds for idle channels to evict
//         softIdleTimeoutMillis: 20000, // Close idle channels if the pool has more than `min` resources
//     }
// }

// export class ChannelPool  {
//     constructor ( private poolConfig = channelConfig()) {
//         this.connectionPool = connectionPool.connect();
//         this.queueName = QUEUE;
//         this.pool = createPool<Channel>(this.factory, this.poolConfig);
//         process.on('SIGINT', this.close.bind(this));
//     }

//     public queueName: string

//     private pool: Pool<Channel>;

//     private connectionPool: Pool<Connection>

//     // RabbitMQ Channel Pool Factory
//     private factory = {
//         create: async () => {
//             const connection = await this.connectionPool.acquire();
//             const channel = await connection.createChannel();
        
//             channel.on('close', () => {
//                 console.log('Release connection Pool.');
//                 this.connectionPool.release(connection);
//             });
        
//             channel.on('error', (err) => {
//                 console.error('Channel error:', err);
//                 this.connectionPool.release(connection);
//             });
//             return channel;
//         },
//         destroy: async (channel: Channel) => {
//             console.log('Closing channel...');
//             await channel.close();
            
//             console.log('Channel closed.');
//         },        
//         // validate: async (channel: Channel ) => {
//         //     try {

//         //         if (channel.connection) {

//         //             // Validate the channel is still usable
//         //             await channel.checkQueue(this.queueName); // QUEUE will be a global variable
//         //             return true;
//         //         }
                
//         //         return true;
//         //     } catch {
//         //         return false;
//         //     }
//         // },
//     };

//     async acquire(): Promise<Channel> {
//         return this.pool.acquire();
//     }

//     async release(resource: Channel): Promise<void> {
//         return this.pool.release(resource);
//     }

//     // Use the Channel Pool
//     // async useChannel(callback: ( channel: Channel) => Promise<void>) {
//     //     const channel = await channelPool.acquire();
//     //     try {
//     //         await callback(channel);
//     //     } finally {
//     //         channelPool.release(channel);
//     //     }
//     // }

//     close = async () => {
//         console.log('Closing channel pool...');
        
//         await this.pool.drain();
//         await this.pool.clear();

//         console.log('All Channel pool closed');

        

//         await connectionPool.close();
    
//         process.exit(0);
//     }    
// }

// const channelPool = new ChannelPool()

// export { channelPool }