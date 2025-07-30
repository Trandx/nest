
import { validatePasswordFormat } from '@app/utils/function';
import {
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

interface IErrorMsg {
    [key: string]: any;
}

@ValidatorConstraint({ name: 'IsStrongPasswordRule', async: false })
export class IsStrongPasswordRule implements ValidatorConstraintInterface {
    constructor() {}

    private errorMsg: IErrorMsg = {};

    async validate(value: string , args: ValidationArguments): Promise<boolean> {
        const [isDisable] = args.constraints;
        //const data = args.object;
        //condition = !process.env.APP_ENV.toLowerCase().includes('dev') 

        const passwordError = validatePasswordFormat(value);
        if ( !isDisable && passwordError){
            this.errorMsg[args.property] = passwordError;
            return false;
        } 
        return true;
    }

    defaultMessage(args: ValidationArguments) {

        return this.errorMsg[args.property];
    }
}
