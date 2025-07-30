
import { FileUploadInterceptor } from '@app/utils/interceptors';
import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

export function UploadFileInterceptor(options: {
  fieldName: string;
  maxSize?: number;
  allowedTypes?: string[];
  destination?: string;
}) {
  return applyDecorators(
    UseInterceptors(
      FileInterceptor(options.fieldName),
      new FileUploadInterceptor(options)
    )
  );
}