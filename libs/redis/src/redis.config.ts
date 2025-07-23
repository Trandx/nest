import { Options } from "generic-pool";
import Redis, { RedisOptions } from "ioredis";

export class RedisConfig {
    constructor (private readonly config: RedisOptions) {}

    
    poolConfig = (): Options =>{
      
      return {
          max: +(process.env.REDIS_MAX_CONNECTION ?? 10), // Maximum number of connections
          min: +(process.env.REDIS_MIN_CONNECTION ?? 0),  // Minimum number of connections
          idleTimeoutMillis: +(process.env.REDIS_IDLE_TIMEOUT ?? 5000), // Close connections idle for 5 seconds
          //idleTimeoutMillis: 10000,
          // acquireTimeoutMillis: 5000, // Wait up to 5 seconds for a connection to become available
          // testOnBorrow: true, // Validate connection before use
          evictionRunIntervalMillis: +(process.env.REDIS_EVICTION_RUN_INTERVAL ?? 15000), // Check idle connections every 15 seconds
      }
    }

    async connect () {
        try {
            const connection = new Redis(this.config)
            
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