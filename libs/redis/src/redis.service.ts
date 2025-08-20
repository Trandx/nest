import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { Pool } from 'libs/utils';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(private readonly poolService: Pool<Redis>) {}

  private async withClient<T>(fn: (client: Redis) => Promise<T>): Promise<T> {
    const client = await this.poolService.getClient();
    try {
      return await fn(client);
    } finally {
      this.poolService.releaseClient(client);
    }
  }

  async getClient(): Promise<Redis> {
    return this.poolService.getClient();
  }

  async set(key: string, value: string, expireInSeconds?: number | string): Promise<boolean> {
    return this.withClient(async (client) => {
      if (expireInSeconds) {
        await client.set(key, value, 'EX', expireInSeconds);
      } else {
        await client.set(key, value);
      }
      return true;
    });
  }

  async get(key: string): Promise<string | null> {
    return this.withClient((client) => client.get(key));
  }

  async getJson<T>(key: string): Promise<T> {
    return this.withClient(async (client) => {
      const data = await client.get(key);
      return data && JSON.parse(data);
    });
  }

  async getAllJson<T>(pattern: string): Promise<T[]> {
    return this.withClient(async (client) => {
      const keys = await client.keys(pattern);
      return await Promise.all(keys.map((key) => this.getJson<T>(key)));
    });
  }

  async del(args: string | string[]): Promise<number> {
    return this.withClient((client) => client.del(Array.isArray(args) ? args : [args]));
  }

  async exists(key: string): Promise<number> {
    return this.withClient((client) => client.exists(key));
  }

  async ttl(key: string): Promise<number> {
    return this.withClient((client) => client.ttl(key));
  }

  async onModuleDestroy() {
    await this.poolService.shutdown();
  }
}
