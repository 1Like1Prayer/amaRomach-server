import * as cors from '@koa/cors';
import { createServer } from 'http';
import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import { Server } from 'socket.io';
import { errorMiddleware } from './middlewares/error-middleware';
import { socketMiddleware } from './middlewares/socket-middleware';
import { productRouter } from './routes/router';
import { logger } from './utils/logs/logger';

const app: Koa = new Koa();
const server: any = createServer(app.callback());
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:4200'],
  },
});

io.use(socketMiddleware).on('connection', (socket, next) => {
  logger.info(`user ${socket.id} has connected`);
});

app
  .use(cors())
  .use(errorMiddleware)
  .use(bodyParser())
  .use(productRouter.routes())
  .use(productRouter.allowedMethods());

export const listen = (appPort: number) => {
  server.listen(appPort, () => logger.info(`listening on port ${appPort}`));
};
