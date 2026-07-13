import path from 'node:path';
import { createRequire } from 'node:module';
import { log } from './log.js';
import merge from './merge.js';

// .febuild files are CommonJS modules (module.exports = {...} or a function);
// createRequire lets this ESM package load them unchanged
const require = createRequire(import.meta.url);

export default function extendConfig(configPath, config) {
  const dir = path.isAbsolute(configPath) ? configPath : path.join(config.general.rootPath, configPath);

  const buildConfig = require(dir);
  const override = typeof buildConfig === 'function' ? buildConfig(config) : buildConfig;

  // extending the configs
  log(import.meta.filename, `Extending Fe build config for ${path.dirname(configPath)}`);

  // this allows our .febuild create its own config per folder
  // if sourcesPath is not provided, .febuild file location is used
  const { general = {} } = override;
  let basePath = general.sourcesPath;

  if (!general.sourcesPath) {
    override.general = override.general || {};
    override.general.sourcesPath = path.dirname(dir);
    basePath = override.general.sourcesPath.split(config.general.rootPath)[1];
  }

  if (!general.destinationPath) {
    const parts = basePath.split(path.sep);
    parts[1] = 'dist';
    const dest = path.join(config.general.rootPath, ...parts);
    override.general = override.general || {};
    override.general.destinationPath = dest;
  }

  // config merge
  const copyConfig = merge({}, config);
  const extendedConfig = merge(copyConfig, override);
  return extendedConfig;
}
