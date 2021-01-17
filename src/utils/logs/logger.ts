import * as nconf from 'nconf';
import * as winston from 'winston';

export const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: nconf.get('logPath') }),
  ],
});
