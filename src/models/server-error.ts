export class ServerError extends Error {
    devMessage: string;
    status: number;

    constructor(devMessage: string, status: number, message?: string) {
        super(message);
        this.status = status;
        this.devMessage = devMessage;
    }
}
