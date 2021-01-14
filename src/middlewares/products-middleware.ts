import * as Router from 'koa-router';
import { logger } from '../utils/logs/logger';

export const addMiddlewares = (router: Router) => {
    router.use(async (ctx, next) => {
        try {
            await next();
        } catch (err) {
            ctx.status = err.status || 500;
            process.env.NODE_ENV === 'production' ? ctx.body = `Internal Server Error - ${err.status}` : ctx.body = `${err.message} - ${err.status}`;
            logger.error(`${err.devMessage}`);
        }
    });
};
