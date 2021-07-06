import * as cors from '@koa/cors';
import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import { errorMiddleware } from './middlewares/error-middleware';
import { productRouter } from './routes/router';
import { logger } from './utils/logs/logger';
import { graphqlServer } from './graphql/graphql-server';
export const app: Koa = new Koa();
import { server } from './ws/ws-server';

app
  .use(cors())
  .use(errorMiddleware)
  .use(bodyParser())
  .use(productRouter.routes())
  .use(productRouter.allowedMethods());

graphqlServer.applyMiddleware({ app });
graphqlServer.installSubscriptionHandlers(server);

export const listen = (appPort: number) => {
  server.listen(appPort, () =>
    logger.info(
      `listening on port ${appPort} gql ${graphqlServer.graphqlPath} sub ${graphqlServer.subscriptionsPath}`,
    ),
  );
};
