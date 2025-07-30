import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

interface IErrorMsg {
  [key: string]: any;
}

@ValidatorConstraint({ name: 'IsEqualRule', async: false })
export class IsEqualRule implements ValidatorConstraintInterface {
  constructor() {}

  private errorMsg: IErrorMsg = {};

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    const [, fields] = args.constraints;
    const data = args.object as { [key: string]: any };

    //log(data, fields, args, args.property);

    let errorMsg = `${args.property} will be equal to`;

    const initLengthError = errorMsg.length;

    fields.map((field: string) => {
      if (data[field] !== value) {
        errorMsg += ` '${field}',`;
      }
    });

    const finalLengthError = errorMsg.length;

    if (initLengthError === finalLengthError) {
      this.errorMsg[args.property] = errorMsg;

      return true;
    } else {
      this.errorMsg[args.property] = errorMsg.slice(0, -1);

      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaultMessage(args: ValidationArguments) {
    //console.log(args);

    //log(this.errorMsg);

    return this.errorMsg[args.property];
  }
}
