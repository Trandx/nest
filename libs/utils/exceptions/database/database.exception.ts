import { ConflictException } from '@nestjs/common';
import { TypeORMError } from 'typeorm';

export class DatabaseException {
  constructor(private readonly error: any) {
    this.makeError(this.error);
  }

  private makeError(error: any) {
    const rgx: { regex: RegExp; rpl: string }[] = [
      {
        regex: /\(|\)/gi,
        rpl: '', // regx to remove "(", ")""
      },
      {
        regex: /=/gi,
        rpl: ' ', // regex to remove "="
      },
    ];
    let msg: string = error.detail;

    rgx.forEach((item) => {
      msg = msg.replace(item.regex, item.rpl);
    });
    TypeORMError
    //console.log(msg);
    throw new ConflictException(msg);
  }
  
}
