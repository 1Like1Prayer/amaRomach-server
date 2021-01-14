import * as nconf from 'nconf';
import * as path from 'path';

export const initConfig = () => {
    const configPath = path.join(__dirname, '/config.json');
    nconf.argv().env().file(configPath);
};
