import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { Injectable } from '@nestjs/common';

@Injectable()
@ValidatorConstraint({ name: 'IsDateRule', async: true })
export class IsDateRule implements ValidatorConstraintInterface {
  private _regex: RegExp =
    /^\d{4}(-|\/)(((0)[0-9])|((1)[0-2]))(-|\/)([0-2][0-9]|(3)[0-1])$/i;

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    const [regexPattern, queryConditions] = args.constraints;

    regexPattern ? (this._regex = regexPattern) : false;

    const globalRegex: RegExp = new RegExp(this._regex);

    return globalRegex.test(value);
  }

  defaultMessage(args: ValidationArguments) {
    //console.log(args);
    return ` "${args.property} must be formatted as yyyy-mm-dd`;
  }
}
