import { ValidationErrorItem } from '@hapi/joi';

export class ServerError extends Error {
  devMessage: string;
  status: number;
  joiError?: ValidationErrorItem[];

  constructor(
    devMessage: string,
    status: number,
    message?: string,
    joiError?: ValidationErrorItem[],
  ) {
    super(message);
    this.status = status;
    this.devMessage = devMessage;
    this.joiError = joiError;
  }
}
