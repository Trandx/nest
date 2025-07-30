import { registerDecorator, ValidationOptions } from 'class-validator';
import { WithRule } from './rules';
import { EntitySchema, ObjectType } from 'typeorm';

// type WithContraintInterface<T> = [ObjectType<T> | EntitySchema<T> | string, {
//     select: string,
//     where: string,
//     parameters: Record<string, string>
// }];

type WithContraintInterface<T> = ObjectType<T> | EntitySchema<T>;

type fieldType<T> = keyof T;

type WithoutType<T> = {
  property: WithContraintInterface<T>;
  fields: fieldType<T>[];
  validationOptions?: ValidationOptions;
};

export function With<T>({
  property,
  fields,
  validationOptions,
}: WithoutType<T>) {
  return function (object: Record<string, any>, propertyName: string): any {
    registerDecorator({
      name: 'With',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property, fields],
      options: validationOptions,
      validator: WithRule,
    });
  };
}
