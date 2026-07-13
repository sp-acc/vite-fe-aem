import path from 'node:path';
import general from './general.config.js';

const { common, nodeModules } = general;

export default {
  alias: {
    utils: path.join(common, 'utils'),
  },
  modules: [nodeModules]
};
