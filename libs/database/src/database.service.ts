import { update } from '@app/utils/function';
import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, EntityTarget, FindOptionsWhere, ObjectLiteral, QueryRunner } from 'typeorm';

export type ConditionOptions<T> =  FindOptionsWhere<T> | FindOptionsWhere<T>[];

export type UpSertType<T> = {
  entityClass: EntityTarget<T>;
  condition: ConditionOptions<T>;
  data: DeepPartial<T>;
};

@Injectable()
export class DatabaseService {
  public queryRunner: QueryRunner;

  constructor(public readonly dataSource: DataSource) {}

  async connect(schema = 'PUBLIC') {
    this.queryRunner = this.dataSource.createQueryRunner();
    await this.queryRunner.connect();
    if (schema.toUpperCase() !== 'PUBLIC') {
      await this.setSchema(schema);
    }
    return this.queryRunner;
  }

  async setSchema(schema = 'PUBLIC') {
    await this.queryRunner.query(`SET search_path TO '$1';`, [schema]);
  }

  async release() {
    await this.setSchema();
    await this.queryRunner.release();
  }

  async useRepository<T extends ObjectLiteral>(entity: EntityTarget<T>) {
    return this.queryRunner.manager.getRepository<T>(entity);
  }

  async upsert<T extends ObjectLiteral>(
    { entityClass, data, condition }: UpSertType<T>,
    schema = 'PUBLIC'
  ) {
    const upperSchema = schema.toUpperCase();
    try {
      if (upperSchema !== 'PUBLIC') {
        await this.setSchema(upperSchema);
      }
      const entityRepository = await this.useRepository(entityClass);
      let result = await entityRepository.find({ where: condition });
      
      if (result.length > 0) {
        result = update<T>(result, data as T);
        //return entityRepository.save<T>(result as T[]);
      } else {
        result[0] = entityRepository.create(data);
      }
      return entityRepository.save<T>(result);
    } catch (error) {
      throw error;
    } finally {
      if (upperSchema !== 'PUBLIC') {
        await this.setSchema(upperSchema);
      }
    }
  }

  async update<T extends ObjectLiteral>({ entityClass, data, condition }: UpSertType<T>) {
    const entityRepository = await this.useRepository(entityClass);
    const entity = await entityRepository.findOne({ where: condition });
    if (!entity) return null;
    Object.assign(entity, data);
    return entityRepository.save(entity);
  }
}
