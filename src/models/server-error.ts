import { JoiError } from './joi-error';

export class ServerError extends Error {
  devMessage: string;
  status: number;
  joiError?: JoiError[];

  constructor(devMessage: string, status: number, message?: string, joiError?: JoiError[]) {
    super(message);
    this.status = status;
    this.devMessage = devMessage;
    this.joiError = joiError;
  }
}
