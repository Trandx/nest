import { ConfigOptions } from '@app/utils/pool';
import { connect, type ChannelModel as Connection, Options } from 'amqplib'
import { Options as PoolOptions } from "generic-pool";

export class RabbitmqConfig {

    constructor (private readonly config: ConfigOptions<Options.Connect>) {}
    
    private initPoolConfig(options?: PoolOptions): PoolOptions {
      
      return options || {
          max:  10, // Maximum number of connections
          min:  0,  // Minimum number of connections
          idleTimeoutMillis:  5000, // Close connections idle for 5 seconds
          //idleTimeoutMillis: 10000,
          // acquireTimeoutMillis: 5000, // Wait up to 5 seconds for a connection to become available
          // testOnBorrow: true, // Validate connection before use
          evictionRunIntervalMillis:  15000, // Check idle connections every 15 seconds
      }
    }

    poolConfig = () => {
      return this.initPoolConfig(this.config.pool);
    }

    async connect () {
        try {
            const connection = await connect(this.config.connection)
            
            connection.on('connect', () => {
                console.log('Connected to RabbitMQ');
            }).on('ready', () => {
                console.log('RabbitMQ is ready');
            }).on('error', (err) => {
                console.error('RabbitMQ error:', err);
            }).on('close', () => {
                console.log('RabbitMQ connection closed');
            }).on('reconnecting', (time: number) => {
                console.log(`Reconnecting in ${time}ms`);
            }).on('end', () => {
                console.log('RabbitMQ connection has ended');
            });

            return connection;
        } catch (error) {
            console.error(`RabbitMQ open connection error: ${error}`);
            process.exit(1)
        }
    }

    async close (connection: Connection) {
        try {
          connection.close();
        } catch (error) {
            console.error(`RabbitMQ close connection error: ${error}`);
            process.exit(1)
        }
    }
}