import { BadRequestException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { TypeORMError } from "typeorm";
import { RedirectException } from "../others/redirect.exception";

export const exception = {
    badRequest: (message = 'Bad request') => new BadRequestException(message),
    notFound: (message = 'Not found') => new NotFoundException(message),
    database: (message: string) => new TypeORMError(message),
    unauthorized: (message = 'Unauthorized') => new UnauthorizedException(message),
    redirect: (url: string) => new RedirectException(url),
}