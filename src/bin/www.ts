import * as nconf from 'nconf';
import { initConfig } from '../config/configuration';
initConfig();
import { listen } from '../app';
import { mongoConnect } from '../db/database-connection';
import { logger } from '../utils/logs/logger';

process.on('uncaughtException', (err) => {
  logger.error(`unexpectedException ----> ${err}`);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error(`unexpected rejection ----> ${err}`);
  process.exit(1);
});

const appPort = nconf.get('port');
const initServer = (async () => {
  try {
    await mongoConnect();
    listen(appPort);
  } catch (error) {
    logger.error(error);
  }
})();
