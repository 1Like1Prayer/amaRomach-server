import * as mongoose from 'mongoose';
import * as nconf from 'nconf';
import { logger } from '../utils/logs/logger';

export const mongoConnect = async () => {
  try {
    await mongoose.connect(nconf.get('database').mongoUrl, {
      autoReconnect: true,
      reconnectInterval: 1000,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    mongoose.connection.on('connected', () => {
      logger.info('db connected successfully');
    });
    mongoose.connection.on('disconnected', () => {
      logger.info('db disconnected,trying to reconnect');
    });
    mongoose.connection.on('reconnected', () => {
      logger.info('db reconnected');
    });
    logger.info('connected successfully to db');
  } catch (err) {
    logger.error(`error----> ${err}`);
  }
};
