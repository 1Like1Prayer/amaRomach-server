import * as nconf from 'nconf';
import { listen } from '../app';
import { initConfig } from '../config/configuration';
import { mongoConnect } from '../data/database-connection';
import { logger } from '../utils/logs/logger';

process.on('uncaughtException', (err) => {
    logger.error(`unexpectedException ----> ${err}`);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    logger.error(`unexpected rejection ----> ${err}`);
    process.exit(1);
});

initConfig();
const appPort = nconf.get('port');
const initServer = (async () => {
    try {
        await mongoConnect();
        listen(appPort);
    } catch (error) {
        logger.error(error);
    }
})();
