import { FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { ValidationArguments, ValidatorConstraint } from 'class-validator';
import { EntityTarget } from 'typeorm';
import { DatabaseService } from '@app/database';

type PropertiesType<T> = keyof T;

@Injectable()
@ValidatorConstraint({ name: 'IsNotExistRule', async: true })
export class IsExistRule<T extends ObjectLiteral> {
  constructor(
    @Inject(DatabaseService)
    private readonly databaseService: DatabaseService 
  ) {}

  private className = this.constructor.name;

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
     return await this.databaseService.withClient({ serviceName:  this.className }, async () =>{
      try {
        let [EntityClass, properties] = args.constraints as [EntityTarget<T>, PropertiesType<T>[]];

        // const request = REQUEST_CONTEXT_ID.currentRequest(); // Access the current request
        // if (!request?.user?.tenant) {
        //   throw new Error('Tenant information is missing in the request context.');
        // }
        //const tenantId = request.user.tenant; // Extract tenant ID from req.user.tenant

        let condition: FindOptionsWhere<T>[]

        if (!properties) {
          properties = [ args.property as  (keyof T) ]
        }

        condition = properties.map((field) => {
          return { [field]: value } as FindOptionsWhere<T>;
        });

        console.log(args.property, args);

        const repository = await this.databaseService.useRepository<T>(EntityClass);
        const isExist =  repository.exists({ where: condition})

        return isExist;

      } catch (error) {
        throw error;
      }
    })
  }

  defaultMessage(args: ValidationArguments): string {
    return `${ args.property } ${ args.value } does not exist.`;
  }
}

