import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsDateRule } from './rules';
import { EntitySchema, ObjectType } from 'typeorm';

// type IsDateContraintInterface<T> = [ObjectType<T> | EntitySchema<T> | string, {
//     select: string,
//     where: string,
//     parameters: Record<string, string>
// }];

type IsDateContraintInterface<T> = string | ObjectType<T> | EntitySchema<T>;

export function IsDate<T>(
  property?: IsDateContraintInterface<T>,
  validationOptions?: ValidationOptions,
) {
  //console.log(validationOptions, 123);

  return function (object: Record<string, any>, propertyName: string): any {
    registerDecorator({
      name: 'IsDate',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: IsDateRule,
    });
  };
}
