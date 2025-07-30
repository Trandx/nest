import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsEqualRule } from './rules';
import { EntitySchema, ObjectType } from 'typeorm';

// type EqualContraintInterface<T> = [ObjectType<T> | EntitySchema<T> | string, {
//     select: string,
//     where: string,
//     parameters: Record<string, string>
// }];

type EqualContraintInterface<T> = ObjectType<T> | EntitySchema<T>;
type PropertiesType<T> = keyof T;

type EqualType<T> = {
  entity: EqualContraintInterface<T>;
  properties: PropertiesType<T>[];
  validationOptions?: ValidationOptions;
};

export function IsEqual<T>({
  properties,
  entity,
  validationOptions,
}: EqualType<T>) {
  return function (object: Record<string, any>, propertyName: string): any {
    registerDecorator({
      name: 'Equal',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [entity, properties],
      options: validationOptions,
      validator: IsEqualRule,
    });
  };
}
