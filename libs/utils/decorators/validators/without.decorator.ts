import { registerDecorator, ValidationOptions } from 'class-validator';
import { WithoutRule } from './rules';
import { EntitySchema, ObjectType } from 'typeorm';

// type WithoutContraintInterface<T> = [ObjectType<T> | EntitySchema<T> | string, {
//     select: string,
//     where: string,
//     parameters: Record<string, string>
// }];

type WithoutContraintInterface<T> = ObjectType<T> | EntitySchema<T>;
type fieldType<T> = keyof T;

type WithoutType<T> = {
  property: WithoutContraintInterface<T>;
  fields: fieldType<T>[];
  validationOptions?: ValidationOptions;
};

export function Without<T>({
  property,
  fields,
  validationOptions,
}: WithoutType<T>) {
  return function (object: Record<string, any>, propertyName: string): any {
    registerDecorator({
      name: 'Without',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property, fields],
      options: validationOptions,
      validator: WithoutRule,
    });
  };
}
