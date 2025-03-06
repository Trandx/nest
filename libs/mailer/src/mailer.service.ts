// email.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import { TemplateEmail, SendEmail } from './interface';
import { inlineContent } from 'juice';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor(private config: SMTPTransport.Options) {
    this.transporter = nodemailer.createTransport(this.config);
  }

  static async buildTemplatedEmail({ templatePath, params }: TemplateEmail) {
    try {
      // Read template files
      const [htmlTemplate, cssStyle] = await Promise.all([
        fs.readFileSync(
          templatePath.html,
          { encoding: 'utf-8'}
        ),
        fs.readFileSync(
          templatePath.css,
          { encoding: 'utf-8'}
        ),
      ]);

      // Compile template with Handlebars
      const compiledTemplate = handlebars.compile(htmlTemplate);
      const html = compiledTemplate(params);

      // Inline CSS using juice
      const htmlWithInlinedCss = inlineContent(html, cssStyle, {
        applyStyleTags: true,
        removeStyleTags: false,
        preserveMediaQueries: true,
        preserveFontFaces: true,
      });

      return htmlWithInlinedCss;

    } catch (error) {
      throw new Error(`Failed to build email: ${error.message}`);
    }
  }

  async sendEmail ( { from, to, subject, body: html }: SendEmail) {
    try {
      // Send email
      return await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
    } catch (error) {
      //throw  error;
      console.error(error);
      
      return error
    }
  }
}