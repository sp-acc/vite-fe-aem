import glob from 'fast-glob';
import config from './config/index.js';
import extendConfig from './utils/extendConfig.js';
import taskVerification from './utils/taskVerification.js';
import { log } from './utils/log.js';

// start log messages
log(import.meta.filename, ' Looking for configuration files', ', if it finds its runs ', 'info');

// check if there is a params sent to run a single config file
if (config && config.general && config.general.configFile) {
  log(import.meta.filename, ' Running configuration from parameter');

  // load the configuration
  const configuration = extendConfig(config.general.configFile, config);

  // run the proper task on the sent config
  await taskVerification(configuration);
} else {
  // No configFile set then lookup for configurations files
  const configPattern = `**/${config.general.extendConfigurations}`;
  const availableBuilds = glob.sync([configPattern, `${configPattern}.js`], { cwd: config.general.rootPath, ignore: ['./node_modules/**'] });

  // log what is happening
  if (availableBuilds.length === 0) {
    log(import.meta.filename, ' No configuration files found, running default configuration');

    await taskVerification(config);
  } else {
    log(import.meta.filename, ' Found local configurations', ' - Running them instead', 'warning');

    // extending every found build options
    for (const configPath of availableBuilds) {
      const configuration = extendConfig(configPath, config);

      // check if a specific task was sent
      await taskVerification(configuration);
    }
  }
}
