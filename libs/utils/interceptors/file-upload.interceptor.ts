import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  UnsupportedMediaTypeException
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as path from 'path';
import * as fs from 'fs';

interface FileUploadOptions {
  fieldName: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  destination?: string;
}

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  private readonly options: FileUploadOptions;
  private readonly defaultOptions: Partial<FileUploadOptions> = {
    maxSize: 5 * 1024 * 1024, // 5MB default
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'],
    destination: 'uploads'
  };

  constructor(options: FileUploadOptions) {
    this.options = { ...this.defaultOptions, ...options };
    this.ensureUploadDirectoryExists();
  }

  private ensureUploadDirectoryExists(): void {
    const dir = this.options.destination!;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    return `${nameWithoutExt}-${timestamp}${ext}`;
  }

  private validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > this.options.maxSize!) {
      throw new BadRequestException(
        `File size exceeds the limit of ${this.options.maxSize! / 1024 / 1024}MB`
      );
    }

    // Check file type
    if (!this.options.allowedTypes!.includes('*') && 
        !this.options.allowedTypes!.includes(file.mimetype)) {
      throw new UnsupportedMediaTypeException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${this.options.allowedTypes!.join(', ')}`
      );
    }
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const file = request.file || request.files?.[this.options.fieldName];

    if (!file) {
      throw new BadRequestException(`No file uploaded for field '${this.options.fieldName}'`);
    }

    try {
      // Validate the file
      this.validateFile(file);

      // Generate unique filename
      const filename = this.generateUniqueFileName(file.originalname);
      const filepath = path.join(this.options.destination!, filename);

      // Move file to destination
      await fs.promises.writeFile(filepath, file.buffer);

      // Add file info to request
      if (request.file) {
        request.file.path = filepath;
        request.file.filename = filename;
      }

      if (request.files?.[this.options.fieldName]) {
        request.files[this.options.fieldName].path = filepath;
        request.files[this.options.fieldName].filename = filename;
      }

      return next.handle();
    } catch (error) {
      // Clean up any partially uploaded files if they exist
      const filename = this.generateUniqueFileName(file.originalname);
      const filepath = path.join(this.options.destination!, filename);
      
      if (fs.existsSync(filepath)) {
        try {
          fs.unlinkSync(filepath);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
      
      throw error;
    }
  }
}