import * as Koa from 'koa';
import { logger } from '../utils/logs/logger';

export const addErrorMiddleware = (app: Koa) => {
  app.use(async (ctx: Koa.Context, next: Koa.Next) => {
    try {
      await next();
    } catch (err) {
      if (err.joiError) {
        ctx.body = 'joi Error -';
      }
      ctx.status = err.status || 500;
      process.env.NODE_ENV === 'production'
        ? (ctx.body = `Internal Server Error - ${err.status}`)
        : (ctx.body = `${ctx.body} ${err.message} - ${err.status}`);
      logger.error(`${err.devMessage}`);
    }
  });
};
