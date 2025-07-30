import { ConfigOptions } from "@app/utils/pool";
import { Options } from "generic-pool";
import Redis, { RedisOptions } from "ioredis";

export class RedisConfig {

    constructor (private readonly config: ConfigOptions<RedisOptions>) {}
    
    private initPoolConfig(options?: Options): Options {
      
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
            const connection = new Redis(this.config.connection)
            
            connection.on('connect', () => {
                console.log('Connected to Redis');
              })
              .on('ready', () => {
                console.log('Redis is ready');
              })
              .on('error', (err) => {
                console.error('Redis error:', err);
              })
              .on('close', () => {
                console.log('Redis connection closed');
              })
              .on('reconnecting', (time: number) => {
                console.log(`Reconnecting in ${time}ms`);
              })
              .on('end', () => {
                console.log('Redis connection has ended');
              });

            return connection;
        } catch (error) {
            console.error(`Redis open connection error: ${error}`);
            process.exit(1)
        }
    }

    async close (connection: Redis) {
        try {
          connection.quit();
        } catch (error) {
            console.error(`Redis close connection error: ${error}`);
            process.exit(1)
        }
    }
}