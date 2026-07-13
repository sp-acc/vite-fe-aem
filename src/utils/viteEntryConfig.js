// builds the inline vite config for one source entry.
//
// Every entry becomes a single self-contained IIFE bundle written to its
// fe-build-compatible dist key (rollup cannot code-split classic scripts,
// and AEM clientlibs reference only the entry file anyway).
export default function viteEntryConfig(distKey, srcFile, config) {
  const { general, resolve, vite } = config;

  // IIFE bundles with exports need a global name; derive it from the dist key
  const globalName = `__${distKey.replace(/[^a-zA-Z0-9_$]/g, '_')}`;

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
    plugins: vite.plugins,
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
        output: {
          format: 'iife',
          name: globalName,
          entryFileNames: distKey,
          inlineDynamicImports: true,
        },
      },
    },
  };
}
