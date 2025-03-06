import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { Pool } from 'libs/utils';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(private readonly poolService: Pool<Redis>) {}

  async set(key: string, value: string, expireInSeconds?:  number | string): Promise<void> {
    const client = await this.poolService.getClient();
    try {
      if (expireInSeconds) {
        await client.set(key, value, 'EX', expireInSeconds);
      } else {
        await client.set(key, value);
      }
    } finally {
      this.poolService.releaseClient(client);
    }
  }

  async get(key: string): Promise<string | null> {
    const client = await this.poolService.getClient();
    try {
      return await client.get(key);
    } finally {
      this.poolService.releaseClient(client);
    }
  }

  async del(args: string | string[]): Promise<number> {
    const client = await this.poolService.getClient();
    try {
      if (!Array.isArray(args)) {
        args = [args]
      }
      return await client.del(args);
    } finally {
     this.poolService.releaseClient(client);
    }
  }

  async exists(key: string): Promise<number> {
    const client = await this.poolService.getClient();
    try {
      return await client.exists(key);
    } finally {
      this.poolService.releaseClient(client);
    }
  }

  async onModuleDestroy() {
    await this.poolService.shutdown();
  }
}
