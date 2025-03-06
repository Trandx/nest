import { type SendEmail } from "@app/mailer";

export interface MessageType {
    command: string;
    data: SendEmail;
}

export interface SendType {
    to: string;
    message: MessageType;
    timeout: number;
}