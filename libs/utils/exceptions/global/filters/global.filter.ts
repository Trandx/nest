import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  QueryFailedError,
  EntityNotFoundError,
  CannotCreateEntityIdMapError,
} from 'typeorm';
import { errorResponse } from '../func';
import { RedirectException } from '../../others';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const { url: path, method } = request;

    let statusCode =
      exception?.response?.statusCode ||
      (exception as HttpException)?.getStatus?.() ||
      HttpStatus.INTERNAL_SERVER_ERROR;

    let message = exception?.response?.message || exception.message || 'Internal server error';
    let errors = exception?.response?.error || null;

    // Handle RedirectException explicitly
    if (exception instanceof RedirectException) {
      
      response.redirect(exception.getResponse() as string);

      return;
    }

    switch (exception.constructor) {
      case BadRequestException:
        statusCode = HttpStatus.BAD_REQUEST;
        if (Array.isArray(message)) {
          errors = message;
          message = 'Validation failed';
        } else {
          message = (exception as BadRequestException).message;
        }
        break;

      case QueryFailedError:
        statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
        message = (exception as QueryFailedError).message || 'Database query failed';
        errors = errors || 'DB Query Failed Error';
        break;

      case EntityNotFoundError:
        statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
        message = (exception as EntityNotFoundError).message || 'Entity not found';
        break;

      case CannotCreateEntityIdMapError:
        statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
        message = (exception as CannotCreateEntityIdMapError).message || 'Cannot create EntityId map';
        break;

      default:
        if (!message) {
          console.error(exception);
        }
        break;
    }

    // Send the error response
    response.status(statusCode).json(
      errorResponse(
        {
          message,
          errors,
        },
        {
          method,
          path,
          statusCode,
        },
      ),
    );
  }
}
