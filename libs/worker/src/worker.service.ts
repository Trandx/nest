// src/worker/worker.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, JobType, Job } from 'bullmq';

@Injectable()
export class WorkerService {
  constructor(
    @InjectQueue('heavyTasks') private readonly heavyTaskQueue: Queue
  ) {}

  async executeInWorker(methodName: string, data: any): Promise<string | undefined> {
    try {
      const job = await this.heavyTaskQueue.add(
        methodName,
        data,
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        }
      );

      return job.id;
    } catch (error) {
      throw new Error(`Failed to add job to queue: ${error?.message}`);
    }
  }

  async getJobResult<T = any>(jobId: string): Promise<{
    status: string;
    result?: T;
    error?: string;
  }> {
    try {
      const job = await this.heavyTaskQueue.getJob(jobId);

      if (!job) {
        return { status: 'not_found' };
      }

      const state = await job.getState();

      return {
        status: state,
        result: job.returnvalue as T,
        error: job.failedReason || undefined,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error?.message || 'Unknown error',
      };
    }
  }

  async removeJob(jobId: string): Promise<void> {
    try {
      const job = await this.heavyTaskQueue.getJob(jobId);
      if (job) {
        await job.remove();
      }
    } catch (error) {
      throw new Error(`Failed to remove job: ${error?.message}`);
    }
  }

  async getAllJobs(types: JobType[]): Promise<
    Array<{
      id: string;
      name: string;
      data: any;
      state: string;
      result: any;
      error?: string;
    }>
  > {
    try {
      const jobs = await this.heavyTaskQueue.getJobs(types);
      return await Promise.all(
        jobs.map(async (job) => ({
          id: job.id,
          name: job.name,
          data: job.data,
          state: await job.getState(),
          result: job.returnvalue,
          error: job.failedReason || undefined,
        }))
      );
    } catch (error) {
      throw new Error(`Failed to retrieve jobs: ${error?.message}`);
    }
  }

  async cleanJobs(
    grace: number,
    limit: number,
    jobTypes: Array<
      'completed' | 'wait' | 'active' | 'paused' | 'prioritized' | 'delayed' | 'failed'
    >
  ): Promise<void> {
    try {
      for (const type of jobTypes) {
        await this.heavyTaskQueue.clean(grace, limit, type);
      }
    } catch (error) {
      throw new Error(`Failed to clean jobs: ${error?.message}`);
    }
  }

  async taskQueue(): Promise<Queue> {
    return this.heavyTaskQueue;
  }
}
