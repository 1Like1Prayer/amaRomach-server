import * as Koa from 'koa';
import { JoiError } from '../models/joi-error';
import { logger } from '../utils/logs/logger';

export const errorMiddleware: Koa.Middleware = async (ctx: Koa.Context, next: Koa.Next) => {
  try {
    await next();
  } catch (err) {
    if (err.joiError) {
      ctx.body = err.joiError;
      err.joiError.forEach((error: JoiError) => {
        logger.error(`joi Error - ${error.message}`);
      });
    } else {
      ctx.status = err.status || 500;
      process.env.NODE_ENV === 'production'
        ? (ctx.body = `Internal Server Error - ${err.status}`)
        : (ctx.body = `${err.message} - ${err.status}`);
      logger.error(`${err.devMessage}`);
    }
  }
};
