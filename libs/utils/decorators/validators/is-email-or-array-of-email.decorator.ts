import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsEmailOrArrayOfEmailRule } from './rules';

export function IsEmailOrArrayOfEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isEmailOrArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsEmailOrArrayOfEmailRule,
    });
  };
}
