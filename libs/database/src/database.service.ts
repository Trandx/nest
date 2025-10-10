import { update } from '@app/utils/function';
import { Injectable, Logger } from '@nestjs/common';
import { DataSource, DeepPartial, EntityTarget, ObjectLiteral, QueryRunner } from 'typeorm';
import { UpSertType } from './typeorm-extensions';


@Injectable()
export class DatabaseService {

  constructor(public readonly dataSource: DataSource) {
    this.className = this.constructor.name;
    if (!this.dataSource.isInitialized) {
      throw new Error('DatabaseService: DataSource is not initialized.');
    }

    if (this.dataSource) {
      Logger.log('DatabaseService: DataSource is initialized.', this.className);
    } else {
      throw new Error('DatabaseService: Failed to initialize DataSource.');
    }
  }

  private className: string;
  private serviceName: string | undefined;

  async onModuleInit() {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
      console.log('✅ Database initialized');
    }
  }

  get manager() {
    return this.dataSource.manager;
  }

  get isInitialized(): boolean {
    return this.dataSource.isInitialized;
  }

  private async schemaExists(schema: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `SELECT 1 FROM pg_namespace WHERE nspname = $1`,
      [schema]
    );
    return result.length > 0;
  }

  private async validateSchemaName(schema: string): Promise<string> {
    const MAX_SCHEMA_LENGTH = 63;
    const schemaUpper = schema.trim().toUpperCase();

    if (schemaUpper.length === 0 || schemaUpper.length > MAX_SCHEMA_LENGTH) {
      throw new Error(`Invalid schema name length: "${schema}"`);
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schemaUpper)) {
      throw new Error(`Invalid schema name format: "${schema}"`);
    }

    if (!(await this.schemaExists(schemaUpper))) {
      throw new Error(`Schema "${schema}" is not allowed.`);
    }

    return schemaUpper;
  }

  public queryRunner: QueryRunner;

  async setSchema(schema = 'PUBLIC') {
    if (!this.queryRunner) return;
    if (schema.toUpperCase() === 'PUBLIC') return;
    const validated = await this.validateSchemaName(schema);
    await this.queryRunner.query(`SET search_path TO ${validated};`);
  }

  async connect({ schema = 'PUBLIC', serviceName }: { schema?: string; serviceName?: string } = {}) {
    try {
      this.serviceName = serviceName;

      if (this.queryRunner && !this.queryRunner.isReleased) {
        Logger.warn(`QueryRunner already active for: ${serviceName}`, this.className);
        return this.queryRunner;
      }

      this.queryRunner = this.dataSource.createQueryRunner();
      await this.queryRunner.connect();
      await this.setSchema(schema);

      Logger.log(`Connected to database with schema: ${schema} from service ${serviceName || 'default'}`, this.className);

      return this.queryRunner;
    } catch (error) {
      throw error
    }
  }

  public async withClient<T>({ schema = 'PUBLIC', serviceName }: { schema?: string; serviceName?: string } = {},fn: () => Promise<T> | T): Promise<T> {
    await this.connect({ schema, serviceName });
    try {
      return await fn();
    } catch (error) {
      throw error;
    } finally {
      await this.release(serviceName);
    }
  }


  async release(serviceName?: string) {
    try {
      if (serviceName) {
        this.serviceName = serviceName;
      }

      if (this.queryRunner) {
        await this.setSchema();
        await this.queryRunner.release();
        Logger.log(`Released query runner for service: ${this.serviceName || 'default'}`, this.className);
      }

      this.serviceName = undefined;
    } catch (error) {
      throw error
    }
  }

  async useRepository<T extends ObjectLiteral>(entity: EntityTarget<T>) {
    try {
      if (!this.queryRunner) {
        throw new Error('Database connection is not established. Call connect() first.');
      }
      return this.queryRunner.manager.getRepository<T>(entity);
    } catch (error) {
      throw error
    }
  }

  async upsert<T extends ObjectLiteral>(
    { entityClass, data, condition }: UpSertType<T>
  ) {
    try {
      const entityRepository = await this.useRepository(entityClass);
      let result = await entityRepository.find({ where: condition });

      if (result.length > 0) {
        result = update<T>(result, data as T);
      } else {
        result = [entityRepository.create(data)];
      }
      return entityRepository.save<T>(result);
    } catch (error) {
      throw error;
    }
  }

  async update<T extends ObjectLiteral>({ entityClass, data, condition }: UpSertType<T>) {
    try {
      const entityRepository = await this.useRepository(entityClass);

      let result = await entityRepository.find({ where: condition });

      if (result.length === 0) return null;

      result = update<T>(result, data as T);
      return entityRepository.save(result);
    } catch (error) {
      throw error
    }
  }
}
