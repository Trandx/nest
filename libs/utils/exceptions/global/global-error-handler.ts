/** old version
 * this is anather way to handle exception globally
 */

import { NextFunction, Request, Response } from 'express';
import { baseResponse, errorResponse } from './func'
import { HttpException, HttpStatus } from '@nestjs/common';
import { trace } from 'node:console';
type ErrorType = {
    statusCode: number,
    message: string
}
export const globalErrorHandler = (
    err: ErrorType,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
  try {
    
    console.error("global-error:", err); // Optional: Log the error for debugging

    const data = errorResponse( {
      message: err.message || 'Internal Server Error'
    }, {
      path: req.url,
      method: req.method,
      ...baseResponse,
    })

    if (err instanceof HttpException) {
      res.status(err.statusCode).json(data);
    } else {
      // Handle other errors
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(data);
    }

    throw err
  } catch (error) {
    trace(error)
    next(error)
  }
};
