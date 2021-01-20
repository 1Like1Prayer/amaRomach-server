import { ValidationErrorItem } from '@hapi/joi';
import * as Koa from 'koa';
import { JoiError } from '../models/joi-error';
import { logger } from '../utils/logs/logger';

export const errorMiddleware: Koa.Middleware = async (ctx: Koa.Context, next: Koa.Next) => {
  try {
    await next();
  } catch (err) {
    if (err.joiError) {
      const joiError: JoiError[] = parseJoiError(err.joiError);
      ctx.body = joiError;
      logger.error({ joiError });
    } else {
      ctx.status = err.status || 500;
      process.env.NODE_ENV === 'production'
        ? (ctx.body = `Internal Server Error - ${err.status}`)
        : (ctx.body = `${err.message} - ${err.status}`);
      logger.error(`${err.devMessage}`);
    }
  }
};

const parseJoiError = (details: ValidationErrorItem[]): JoiError[] =>
  details.map((detail: ValidationErrorItem) => ({ data: detail.path, message: detail.message }));
