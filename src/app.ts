import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import { productRouter } from './routes/router';
import { logger } from './utils/logs/logger';

const app = new Koa();
app.use(bodyParser()).use(productRouter.routes()).use(productRouter.allowedMethods());

export const listen = (appPort: number) => {
  app.listen(appPort, () => logger.info(`listening on port ${appPort}`));
};
