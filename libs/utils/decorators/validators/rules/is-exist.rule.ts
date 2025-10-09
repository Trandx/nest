import { FindOptionsWhere, ObjectLiteral, EntityTarget } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { 
  ValidationArguments, 
  ValidatorConstraint,
  ValidatorConstraintInterface 
} from 'class-validator';
import { DatabaseService } from '@app/database';

type PropertiesType<T> = keyof T;

@Injectable()
@ValidatorConstraint({ name: 'IsExistRule', async: true })
export class IsExistRule<T extends ObjectLiteral> implements ValidatorConstraintInterface {
  private readonly className = this.constructor.name;
  private readonly logger = new Logger(this.className);

  constructor(private readonly databaseService: DatabaseService) {}

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    if (!this.databaseService) {
      throw new Error('DatabaseService is not injected properly');
    }

    return await this.databaseService.withClient({ serviceName: this.className }, async () => {
      try {
        let [EntityClass, properties] = args.constraints as [EntityTarget<T>, PropertiesType<T>[] | PropertiesType<T>];

        if (!Array.isArray(properties)) {
          properties = [properties];
        }

        const condition = properties.map((field) => ({ [field]: value })) as FindOptionsWhere<T>[];

        const repository = await this.databaseService.useRepository<T>(EntityClass);
        const isExist = await repository.exists({ where: condition });
        return isExist;
      } catch (error) {
        this.logger.error('Validation error', error.stack);
        throw error;
      }
    });
  }

  defaultMessage(args: ValidationArguments): string {
    return `The ${args.property} (${args.value}) does not exist.`;
  }
}
