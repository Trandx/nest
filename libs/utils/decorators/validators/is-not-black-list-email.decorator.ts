import { registerDecorator, ValidationOptions } from 'class-validator';
import { IsNotBlackListEmailRule } from './rules';

export function IsNotBlackListEmail({ disable, urlValidator, validationOptions }: { disable: boolean, urlValidator?: string, validationOptions?: ValidationOptions } = {disable: false}) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isEmailOrArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsNotBlackListEmailRule,
      constraints: [ disable, urlValidator ],
    });
  };
}
