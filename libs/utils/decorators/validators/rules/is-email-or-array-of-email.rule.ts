import {
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
  } from 'class-validator';

  interface IErrorMsg {
    [key: string]: any;
  }
  
  @ValidatorConstraint({ name: 'IsEmailOrArrayOfEmailRule', async: false })
  export class IsEmailOrArrayOfEmailRule implements ValidatorConstraintInterface {
    constructor() {}

    private errorMsg: IErrorMsg = {};
  
    validate(value: any, args: ValidationArguments) {
        
      if (typeof value === 'string') {
        // Vérifier si c'est un email valide

        if (!(/\S+@\S+\.\S+/.test(value))) {
            this.errorMsg[args.property] = `'${value} is not a valid email'`;
          return false;
        }
        return true;
      }
      
      if (Array.isArray(value)) {
        // Vérifier si c'est un tableau contenant uniquement des emails valides
        return value.every((item) => {
          if(typeof item !== 'string' || /\S+@\S+\.\S+/.test(item)){
              
              this.errorMsg[args.property] = `'${item} is not a valid email'`;

              return false
          }

          return true
        });
      }
      return false;
    }
    defaultMessage(args: ValidationArguments): string {

      return this.errorMsg[args.property];
    }
  }
  