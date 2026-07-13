import path from 'node:path';
import general from './general.config.js';

const { isProduction, common, nodeModules } = general;

const includePaths = [path.join(common, 'styles'), nodeModules];
const outputStyle = isProduction ? 'compressed' : 'expanded';

export default {
  includePaths,
  outputStyle,
  // for any https://sass-lang.com/documentation/js-api/interfaces/options/ options
  // (key name kept as-is for .febuild compatibility with fe-build)
  adicionalOptions: {},
  failOnError: true,
};
