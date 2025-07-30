import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

interface IErrorMsg {
  [key: string]: any;
}

@ValidatorConstraint({ name: 'WithoutRule', async: false })
export class WithRule implements ValidatorConstraintInterface {
  constructor() {}

  //private queryCondition: FindOptionsWhere<any> | FindOptionsWhere<any>[];
  private errorMsg: IErrorMsg = {};

  async validate(_value: any, args: ValidationArguments): Promise<boolean> {
    const [, fields] = args.constraints;
    const data = args.object as Record<string, any>;

    //log(data, fields, args, args.property);

    let errorMsg = `${args.property} must be defined with`;

    const initLengthError = errorMsg.length;

    fields.map((field: string) => {
      if (!data[field]) {
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
