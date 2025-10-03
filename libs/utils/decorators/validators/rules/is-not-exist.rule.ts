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
@ValidatorConstraint({ name: 'IsNotExistRule', async: true })
export class IsNotExistRule<T extends ObjectLiteral> implements ValidatorConstraintInterface {

  constructor(
    private readonly databaseService: DatabaseService
  ) {}

  private className = this.constructor.name;

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    // Résoudre DatabaseService à chaque validation si nécessaire

    if (!this.databaseService) {
      throw new Error('DatabaseService is not injected properly');
    }

    return await this.databaseService.withClient({ serviceName: this.className }, async () => {
      try {
        let [EntityClass, properties] = args.constraints as [EntityTarget<T>, PropertiesType<T>[], string];
        let condition: FindOptionsWhere<T>[];

        if (!properties) {
          properties = [args.property as (keyof T)];
        }

        condition = properties.map((field) => {
          return { [field]: value } as FindOptionsWhere<T>;
        });

        const repository = await this.databaseService.useRepository<T>(EntityClass);
        const isExist = await repository.exists({ where: condition });
        return !isExist;
      } catch (error) {
        Logger.error('Validation error:', error.stack, 'IsNotExistRule');
        throw error;
      }
    });
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} ${args.value} is already existed.`;
  }
}