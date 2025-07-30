
import { Injectable } from "@nestjs/common";
import { createPool, Factory, Pool as GenericPool, Options,  } from "generic-pool";

export type ConfigOptions<T> = { connection: T, pool: Options };

interface PoolOptions {
  connect(): Promise<any>
  close(connection: any): Promise<any>
  poolConfig(): Options
}

@Injectable()
export class Pool<T> {
  private pool: GenericPool<T>;

  constructor(private readonly options: PoolOptions) {
    this.pool = createPool<T>(
      this.factory,
      this.options.poolConfig());
  }

  private factory: Factory<T> = {
    create: async () => {
      console.log('Creating a new connection...');
      const connection = await this.options.connect();
      return connection;
    },
    destroy: async (connection: T) => {
      console.log('Closing a connection...');

      await this.options.close(connection);
      
      //await connection.close();
      console.log('connection closed.');
    },
  };

  async getClient() {
    console.log('Acquiring a connection...');

    const client = this.pool.acquire();

    console.log('Total connection(s): ', this.pool.size);

    return client;
  }

  async releaseClient(client: T) {
    console.log('Releasing a connection...');
    
    await this.pool.release(client);
    
    console.log('Total connection(s): ', this.pool.size);
  }

  async shutdown() {
    console.log('Shutting down pool...');
    try {
      await this.pool.drain();
      await this.pool.clear();
      //await this.options.close()
      console.log('pool shutdown complete.');
      //process.exit(0);
    } catch (err) {
      console.error('Error during pool shutdown:', err);
      //process.exit(1);
    }
  }
}