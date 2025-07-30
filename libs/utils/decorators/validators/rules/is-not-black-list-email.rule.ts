
import { blackListEmail } from '@app/utils/function';
import {
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

interface IErrorMsg {
    [key: string]: any;
}

@ValidatorConstraint({ name: 'IsNotBlackListEmailRule', async: true })
export class IsNotBlackListEmailRule implements ValidatorConstraintInterface {
    constructor() {}

    private errorMsg: IErrorMsg = {};

    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }

    async validate(value: any, args: ValidationArguments): Promise<boolean> {
        const [ isDisable, urlValidator ] = args.constraints;
        //const data = args.object;

        if (!this.isValidUrl(urlValidator)) {
            throw new Error('incorrect urlValidator. Please provide a valid URL for email validation.');
        }
        
        if ( isDisable ) return true
        
        const blackListedEmail = await blackListEmail(value, urlValidator);

        if(blackListedEmail){
            this.errorMsg[args.property] = `The email '${value}' is blacklisted.`;
            return false; //Return true if match
        }
        
        return true;
    }

    defaultMessage(args: ValidationArguments) {

        return this.errorMsg[args.property];
    }
}
