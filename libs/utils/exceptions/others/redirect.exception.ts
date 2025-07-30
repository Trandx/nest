import { HttpException, HttpStatus } from '@nestjs/common';

export class RedirectException extends HttpException {
  constructor(url: string) {
    super(url, HttpStatus.FOUND);
  }
}
