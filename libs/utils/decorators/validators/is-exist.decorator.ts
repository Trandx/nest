import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsExistRule } from './rules';
import { EntitySchema, ObjectType } from 'typeorm';

type UniqueContraintInterface<T> = ObjectType<T> | EntitySchema<T>;
type PropertiesType<T> = keyof T;

type UniqueType<T> = {
  entity: UniqueContraintInterface<T>;
  properties?: PropertiesType<T> | PropertiesType<T>[];
  validationOptions?: ValidationOptions;
};

export function IsExist<T>(
  {
    entity,
    properties,
    validationOptions,
  }: UniqueType<T>
) {
  return function (object: Record<string, any>, propertyName: string): any {
    registerDecorator({
      name: 'IsNotExist',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [entity, properties],
      options: validationOptions,
      validator: IsExistRule,
    });
  };
}
