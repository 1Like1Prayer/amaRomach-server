import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import { addErrorMiddleware } from './middlewares/error-middleware';
import { productRouter } from './routes/router';
import { logger } from './utils/logs/logger';

const app: Koa = new Koa();
addErrorMiddleware(app);
app.use(bodyParser()).use(productRouter.routes()).use(productRouter.allowedMethods());

export const listen = (appPort: number) => {
  app.listen(appPort, () => logger.info(`listening on port ${appPort}`));
};
