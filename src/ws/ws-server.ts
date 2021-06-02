import { createServer } from 'http';
import * as nconf from 'nconf';
import { Server } from 'socket.io';
import { app } from '../app';
import { logger } from '../utils/logs/logger';
import { socketMiddleware } from './middlewares/socket-middleware';

export const server: any = createServer(app.callback());
const io = new Server(server, {
  cors: {
    origin: nconf.get('cors').origin,
  },
});

io.use(socketMiddleware).on('connection', (socket, next) => {
  logger.info(`user ${socket.id} has connected`);
});
