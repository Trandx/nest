import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { LoggerService } from '@/logger/src';

@Injectable()
export class DatabaseService extends LoggerService {
  private readonly MAX_SCHEMA_LENGTH = 63;
  private readonly SCHEMA_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

  constructor(public readonly dataSource: DataSource) {
    super()
    this.setContext(this.constructor.name)

    if (!this.dataSource.isInitialized) {
      throw new Error('DataSource is not initialized');
    }
    this.log('DataSource initialized successfully');
  }

  async onModuleInit() {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
      this.log('✅ Database initialized');
    }
  }

  get manager() {
    return this.dataSource.manager;
  }

  get isInitialized(): boolean {
    return this.dataSource.isInitialized;
  }

  private async validateSchemaName(schema: string): Promise<string> {
    const schemaUpper = schema.trim().toUpperCase();

    if (!schemaUpper || schemaUpper.length > this.MAX_SCHEMA_LENGTH) {
      throw new Error(`Invalid schema name length: "${schema}"`);
    }

    if (!this.SCHEMA_PATTERN.test(schemaUpper)) {
      throw new Error(`Invalid schema name format: "${schema}"`);
    }

    const [result] = await this.dataSource.query(
      'SELECT 1 FROM pg_namespace WHERE nspname = $1',
      [schemaUpper]
    );

    if (!result) {
      throw new Error(`Schema "${schema}" does not exist`);
    }

    return schemaUpper;
  }

  private async setSchema(queryRunner: QueryRunner, schema: string): Promise<void> {
    if (schema.toUpperCase() === 'PUBLIC') return;
    
    const validated = await this.validateSchemaName(schema);
    await queryRunner.query(`SET search_path TO ${validated}`);
  }

  private async cleanupQueryRunner(queryRunner: QueryRunner, serviceName?: string): Promise<void> {
    if (queryRunner.isReleased) return;

    try {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
        this.warn(`Auto-rollback transaction for: ${serviceName || 'default'}`);
      }
      
      await queryRunner.release();
      this.debug(`Released QueryRunner for: ${serviceName || 'default'}`);
    } catch (error) {
      this.error(`Cleanup failed: ${error.message}`);
      throw error;
    }
  }

  public async getClient<T>(
    options: { schema?: string; serviceName?: string } = {},
    fn: (entityManager: EntityManager) => Promise<T> | T
  ): Promise<T> {
    const { schema = 'PUBLIC', serviceName } = options;
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await this.setSchema(queryRunner, schema);

      this.debug(`Connected with schema: ${schema} (${serviceName || 'default'})`);

      return await fn(queryRunner.manager);
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction().catch(err => 
          this.error(`Rollback failed: ${err.message}`)
        );
      }
      throw error;
    } finally {
      await this.cleanupQueryRunner(queryRunner, serviceName);
    }
  }

  public async withTransaction<T>(
    options: { schema?: string; serviceName?: string } = {},
    fn: (queryRunner: QueryRunner) => Promise<T>
  ){
    const { schema = 'PUBLIC', serviceName } = options
     const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.startTransaction();
      await this.setSchema(queryRunner, schema);

      this.debug(`Start Transaction with schema: ${schema} (${serviceName || 'default'})`)
      
      try {
        const result = await fn(queryRunner);
        await queryRunner.commitTransaction();
        return result;
      } catch (error) {
        if (queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
        }
        throw error;
      };
  }
}