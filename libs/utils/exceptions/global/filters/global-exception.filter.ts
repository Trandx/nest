import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  QueryFailedError,
  EntityNotFoundError,
  CannotCreateEntityIdMapError,
} from 'typeorm';
import { Response } from 'express';
import { errorResponse } from '../func';
import { RedirectException } from '../../others';
import { EventService } from '@/utils/event';
import { GLOBAL_EXCEPTION_EVENT_NAME } from './const';

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly eventService: EventService,
    @Inject(GLOBAL_EXCEPTION_EVENT_NAME) private readonly eventName: string
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  private readonly logger: Logger;

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

    // Ajustement du message selon le type d'erreur
    switch (exception.constructor) {
      case BadRequestException:
        statusCode = HttpStatus.BAD_REQUEST;
        if (Array.isArray(message)) {
          errors = message;
          message = 'Validation failed';
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
    }

    // 📌 Logging JSON structuré
    const errorData = {
        timestamp: new Date().toISOString(),
        method,
        path,
        statusCode,
        message,
        errors,
        stack: exception?.stack,
      }
    this.logger.error(
      errorData,
      //JSON.stringify(errorData),
    );

    // emit event global.exception
    this.eventService.emitAsyncEvent({
      eventName: this.eventName,
      payload: errorData,
    });

    // 📌 Réponse HTTP
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
