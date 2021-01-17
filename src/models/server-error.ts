export class ServerError extends Error {
  devMessage: string;
  status: number;
  joiError?: boolean;

  constructor(devMessage: string, status: number, message?: string, joiError?: boolean) {
    super(message);
    this.status = status;
    this.devMessage = devMessage;
    this.joiError = joiError;
  }
}
