// decorators/on-message.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const MESSAGE_METADATA = 'message_handler';
export interface MessageHandlerMetadata {
  queueName: string;
}

export const OnMessage = (queueName: string): MethodDecorator => {
  return SetMetadata<string, MessageHandlerMetadata>(MESSAGE_METADATA, { queueName });
};