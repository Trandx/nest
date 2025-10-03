import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsStrongPasswordRule } from './rules';

export function IsStrongPassword(
  { disable = true, validationOptions }: { disable: boolean; validationOptions?: ValidationOptions } = { disable: true }
) {
  return function (object: Object, propertyName: string): void {
    registerDecorator({
      name: 'isEmailOrArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsStrongPasswordRule,
      constraints: [ disable ],
    });
  };
}
