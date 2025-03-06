import { connect, type ChannelModel as Connection, Options } from 'amqplib'
import { Options as PoolOptions } from "generic-pool";

export class RabbitmqConfig {
    constructor (private readonly config: Options.Connect ) {}

    RabitmqConfig() {
        const config_env = process.env;

        const config: Options.Connect = {
            hostname: config_env.RABBITMQ_HOST,
            port: +config_env.RABBITMQ_PORT,
            username: config_env.RABBITMQ_USER,
            password: config_env.RABBITMQ_PASS,
            vhost: config_env.RABBITMQ_VHOST || config_env.RABBITMQ_USER
        }


    //   const channel = await connection.createChannel();
    //   const QUEUE = 'rpc_queue';

        return config;
    }

    poolConfig = (): PoolOptions => {
        return {
            max: +process.env.RABBITMQ_MAX_CONNECTION || 10, // Maximum number of connections
            min: +process.env.RABBITMQ_MIN_CONNECTION || 0,  // Minimum number of connections
            idleTimeoutMillis: +process.env.RABBITMQ_IDLE_TIMEOUT || 5000, // Close connections idle for 5 seconds
            // acquireTimeoutMillis: 5000, // Wait up to 5 seconds for a connection to become available
            // testOnBorrow: true, // Validate connection before use
            evictionRunIntervalMillis: +process.env.RABBITMQ_EVICTION_RUN_INTERVAL || 15000, // Check idle connections every 15 seconds
        }
    }

    async connect () {
        try {
            
            const connection = await connect(this.config)
            
            connection.on('error', (err) => {
                console.error('Connection error:', err)
                throw err;
            });

            connection.on('close', () => console.log('RabbitMQ Connection closed.'));

            return connection;
        } catch (error) {
            console.error(`Rabitmq open connection error: ${error}`);
            process.exit(1)
        }
    }

    async close (connection: Connection) {
        try {
            connection.close();
        } catch (error) {
            console.error(`Rabitmq close connection error: ${error}`);
            process.exit(1)
        }
    }
}