import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, EntityTarget, FindOptionsWhere, ObjectLiteral, QueryRunner } from 'typeorm';

export type UpSertType<T> = {
  entityClass: EntityTarget<T>, 
  condition: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  data: DeepPartial<T>,
}

@Injectable()
export class DatabaseService {
  constructor(public readonly dataSource: DataSource) {}

  public queryRunner: QueryRunner;

  async connect(schema: string = 'PUBLIC') {
    // Connexion explicite au QueryRunner
    this.queryRunner = this.dataSource.createQueryRunner();
    await this.queryRunner.connect();
    await this.setSchema(schema);
    return this.queryRunner;
  }

  async setSchema (schema: string = 'PUBLIC'){
    await this.queryRunner.query(`SET search_path TO ${schema};`);
  }

  async release () {
    await this.setSchema();
    await this.queryRunner.release();
  }

  async useRepository<T extends ObjectLiteral>(entity: EntityTarget<T>){
    return this.queryRunner.manager.getRepository<T>(entity);
  }

  async upsert<T extends ObjectLiteral>({ entityClass, data, condition }: UpSertType<T>, schema: string = 'PUBLIC') {
    try {

      if (schema.toUpperCase() !== 'PUBLIC' ) {
        await this.setSchema(schema)
      }

      const entityRepository = await this.useRepository(entityClass);

      const existingAccount = await entityRepository.findOne({
        where: condition
      });
  
      if (existingAccount) {
        // Update existing account
        Object.assign(existingAccount, data);
        return entityRepository.save(existingAccount);
      }
  
      // Create new account
      const newAccount = entityRepository.create(data);
      return entityRepository.save(newAccount);
  
    } catch (error: any) {
      throw error;
    }finally{
      if (schema.toUpperCase() !== 'PUBLIC' ) {
        await this.setSchema(schema)
      }
    }
  };

  async update<T extends ObjectLiteral>({ entityClass, data, condition }: UpSertType<T>){
    const entityRepository = await this.useRepository(entityClass);

    //return await entityRepository.update([condition as any], data as any) as any

    const existingEntity = await entityRepository.findOne({
      where: condition
    });

    if (!existingEntity) return null
    
    // Update existing Entity
    Object.assign(existingEntity, data);
    return entityRepository.save(existingEntity);
  }
}