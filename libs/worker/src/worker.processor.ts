// src/worker/worker.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ModuleRef, ContextIdFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';

@Processor('heavyTasks')
export class WorkerProcessor extends WorkerHost {
  private readonly logger = new Logger(WorkerProcessor.name); // ✅ instanciation correcte

  constructor(private readonly moduleRef: ModuleRef) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { serviceToken, methodName, data } = job.data;

    try {
      // Crée un contexte isolé pour ce job
      const jobContextId = ContextIdFactory.create();

      // Enregistre un objet factice pour satisfaire les services request-scoped
      this.moduleRef.registerRequestByContextId({}, jobContextId);

      // Résout dynamiquement le service dans ce contexte
      const service = await this.moduleRef.resolve(serviceToken, jobContextId, {
        strict: false,
      });

      if (typeof service[methodName] !== 'function') {
        throw new Error(`Method ${methodName} not found on service ${serviceToken.toString()}`);
      }

      const result = await service[methodName](data);
      return result;
    } catch (error) {
      this.logger.error(`Job ${job.id} failed`, error.stack);
      throw error;
    }
  }
}
