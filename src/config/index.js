import clientlibs from './clientlibs.config.js';
import esbuild from './esbuild.config.js';
import eslint from './eslint.config.js';
import general from './general.config.js';
import postcss from './postcss.config.js';
import resolve from './resolve.config.js';
import sass from './sass.config.js';
import stylelint from './stylelint.config.js';
import templates from './templates.config.js';
import vite from './vite.config.js';
import {
  babel,
  optimization,
  output,
  plugins,
  stats,
  cache,
  devServer,
  performance
} from './ignored.config.js';

const modules = general.modules;

export default {
  general,
  esbuild,
  vite,
  eslint,
  sass,
  clientlibs,
  stylelint,
  resolve,
  postcss,
  templates,
  modules,
  // fe-build compatibility stubs (accepted, ignored)
  babel,
  optimization,
  output,
  plugins,
  stats,
  cache,
  devServer,
  performance
};
