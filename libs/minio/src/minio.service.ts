import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { MinioConfig } from './minio.config';
import { Client, ClientOptions, InvalidBucketNameError } from 'minio';

type CreateBucketOptions = {
    sanitize?: boolean;
    checkBucketName?: boolean;
    public?: boolean;
};

@Injectable()
export class MinioService extends MinioConfig implements OnModuleDestroy {

  constructor( readonly config: ClientOptions) {
    super(config)
  }

  private client: Client

  async getClient() {
    try {
      this.client = this.connect()
      await this.checkMinioConnection();
      
      return this.client;
    } catch (error) {
      throw error
    }
  }

  async checkMinioConnection() {
    try {
      const buckets = await this.client.listBuckets();
      console.log('MinIO connection successful!', buckets);
    } catch (err) {
      console.error('Error connecting to MinIO:', err.message);
      throw err;
    }
  }

  async setPublicBucketPolicy(bucketName: string) {
    try {
      // Define the public access policy
      const client = await this.getClient()

      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: 's3:GetObject',
            Resource: `arn:aws:s3:::${bucketName}/*`,
          },
        ],
      };
  
      // Convert the policy to a JSON string
      const policyString = JSON.stringify(policy);
  
      // Apply the policy to the bucket
      await client.setBucketPolicy(bucketName, policyString);
      console.log(`Public bucket policy applied to bucket: ${bucketName}`);
    } catch (error) {
      console.error('Error setting public bucket policy:', error.message);
      throw error;
    }
  }

  private validateAndSanitizeBucketName(bucketName: string, sanitize: boolean): string {
    if (bucketName.length < 3 || bucketName.length > 63) {
      throw new InvalidBucketNameError('Bucket name must be between 3 and 63 characters');
    }
    return sanitize
      ? bucketName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
      : bucketName;
  }

  async createBucket(bucketName: string, options: CreateBucketOptions = { sanitize: true, checkBucketName: true, public: true }) {
    try {
      bucketName = this.validateAndSanitizeBucketName(bucketName, options.sanitize ?? true);
      const client = await this.getClient();

      await client.makeBucket(bucketName, '');
      
      if (options.public) {
        await this.setPublicBucketPolicy(bucketName)
      }

      console.log(`Bucket "${bucketName}" created successfully.`);
    } catch (error) {
      console.error('Error creating bucket:', error.message);
      throw error;
    }
  }

  async createBucketIfNotExists(bucketName: string, options: CreateBucketOptions = { sanitize: true, checkBucketName: true, public: true }) {
    try {
      bucketName = this.validateAndSanitizeBucketName(bucketName, options.sanitize ?? true);
      const client = await this.getClient();

      const bucketExists = await client.bucketExists(bucketName);
      if (!bucketExists) {
        await this.createBucket(bucketName, { sanitize: false, checkBucketName: false });

        if (options.public) {
            await this.setPublicBucketPolicy(bucketName)
        }
      }
      return bucketName;
    } catch (error) {
      console.error('Error checking/creating bucket:', error.message);
      throw error;
    }
  }

  async uploadFile(bucketName: string, file: Express.Multer.File, subPath?: string) {
    try {
      bucketName = await this.createBucketIfNotExists(bucketName);

      let fileName: string

      if (subPath) {
        subPath = subPath.replace(/^\/|\/$/g, '');
        fileName = `${subPath}/${file.filename}`
      } else {
        fileName = file.filename
      }

      const client = await this.getClient();

      await client.putObject(bucketName, fileName, file.buffer, file.size);

      console.log(`File uploaded to bucket "${bucketName}" as "${fileName}"`);

      return {
        url: `${this.config.endPoint}:${this.config.port}/${bucketName}/${fileName}` 
      }
    } catch (error) {
      console.error('Error uploading file:', error.message);
      throw error;
    }
  }

  async getFileUrl(bucketName: string, fileName: string) {
    try {
        bucketName = await this.createBucketIfNotExists(bucketName);
        const client = await this.getClient();
        return await client.presignedUrl('GET', bucketName, fileName);
    } catch (error) {
        console.error('Error generating file URL:', error.message);
        throw error;
    }
  }

  async deleteFile(bucketName: string, fileName: string) {
    try {
        bucketName = await this.createBucketIfNotExists(bucketName);
        const client = await this.getClient();
        await client.removeObject(bucketName, fileName);
        console.log(`File "${fileName}" deleted from bucket "${bucketName}"`);
        return true;
    } catch (error) {
        console.error('Error deleting file:', error.message);
        throw error;
    }
  }

  onModuleDestroy() {
    if (this.client) {
      console.log('MinIO client cleanup on module destroy');
      this.close();
    }
  }
}
