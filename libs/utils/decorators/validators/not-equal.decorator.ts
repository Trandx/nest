import { registerDecorator, ValidationOptions } from 'class-validator';
import { NotEqualRule } from './rules';
import { EntitySchema, ObjectType } from 'typeorm';

// type EqualContraintInterface<T> = [ObjectType<T> | EntitySchema<T> | string, {
//     select: string,
//     where: string,
//     parameters: Record<string, string>
// }];

type NotEqualContraintInterface<T> = ObjectType<T> | EntitySchema<T>;
type fieldType<T> = keyof T;

type NotEqualType<T> = {
  property: NotEqualContraintInterface<T>;
  fields: fieldType<T>[];
  validationOptions?: ValidationOptions;
};

export function NotEqual<T>({
  property,
  fields,
  validationOptions,
}: NotEqualType<T>) {
  return function (object: Record<string, any>, propertyName: string): any {
    registerDecorator({
      name: 'Equal',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property, fields],
      options: validationOptions,
      validator: NotEqualRule,
    });
  };
}
