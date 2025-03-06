// email.module.ts
import { DynamicModule, Global, Module } from '@nestjs/common';
import { MailerService } from './mailer.service'
import SMTPTransport from 'nodemailer/lib/smtp-transport';

@Global()
@Module({})
export class MailerModule {
  static register(config: SMTPTransport.Options ): DynamicModule {
    return {
      module: MailerModule,
      providers: [
        {
          provide: MailerService,
          useFactory: () => {
            return new MailerService(config)
          },
        },
      ],
      exports: [MailerService],
    }
  }
}
