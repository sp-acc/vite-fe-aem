import warnIgnored from './warnIgnored.js';
import viteResolveModulesPlugin from './viteResolveModulesPlugin.js';
import { parseVendorsConfig, mergeVendorsExternals } from './vendorsConfig.js';

// fe-build forwarded webpack `externals` to webpack, keeping e.g. `{ jquery:
// 'jQuery' }` out of the bundle and referencing the page global instead.
// The object form maps 1:1 to rollup externals + globals; the other webpack
// forms (string/array/regex/function) are warned about and ignored.
// clientlibs.vendors modules are merged in: they are served as window globals
// by the shared vendors clientlib, so regular entries must not bundle them.
function buildExternals(config) {
  const externals = config.externals;
  let map = {};

  if (externals) {
    if (Array.isArray(externals) || typeof externals !== 'object' || externals instanceof RegExp) {
      warnIgnored(
        'externals (non-object form)',
        'use the object form { "lib-name": "GlobalName" }'
      );
    } else {
      map = { ...externals };
    }
  }

  const vendors = parseVendorsConfig(config);

  if (vendors) {
    map = mergeVendorsExternals(map, vendors.modules);
  }

  if (Object.keys(map).length === 0) {
    return {};
  }

  return {
    external: Object.keys(map),
    globals: map,
  };
}

// builds the inline vite config for one source entry.
//
// Every entry becomes a single self-contained IIFE bundle written to its
// fe-build-compatible dist key (rollup cannot code-split classic scripts,
// and AEM clientlibs reference only the entry file anyway).
export default function viteEntryConfig(distKey, srcFile, config) {
  const { general, resolve, vite } = config;

  // IIFE bundles with exports need a global name; derive it from the dist key
  const globalName = `__${distKey.replace(/[^a-zA-Z0-9_$]/g, '_')}`;

  // node_modules is resolved by vite natively; only extra module dirs
  // (fe-build's `resolve.modules`) need the pre-resolver plugin
  const modulesDirs = (resolve.modules || []).filter(dir => dir !== general.nodeModules);
  const plugins = [...vite.plugins];

  if (modulesDirs.length > 0) {
    plugins.push(viteResolveModulesPlugin(modulesDirs));
  }

  const { external, globals } = buildExternals(config);

  return {
    configFile: false,
    envFile: false,
    root: general.rootPath,
    logLevel: general.quiet ? 'silent' : 'info',
    clearScreen: false,
    mode: general.mode,
    define: {
      'process.env.NODE_ENV': JSON.stringify(general.mode),
    },
    resolve: {
      alias: resolve.alias,
    },
    plugins,
    build: {
      outDir: general.destinationPath,
      emptyOutDir: false,
      copyPublicDir: false,
      target: config.esbuild.target,
      minify: general.isProduction ? 'esbuild' : false,
      // parity with fe-build's devtool: inline-source-map in development
      sourcemap: general.isProduction ? false : 'inline',
      watch: general.watch ? {} : null,
      rollupOptions: {
        input: srcFile,
        ...external && { external },
        output: {
          format: 'iife',
          name: globalName,
          entryFileNames: distKey,
          inlineDynamicImports: true,
          ...globals && { globals },
        },
      },
    },
  };
}
