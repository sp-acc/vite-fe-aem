// builds the shared vendors clientlib bundle (clientlibs.vendors): one
// self-contained IIFE importing every configured module and exposing it on
// window under its global name. Build settings mirror viteEntryConfig.js; the
// difference is the entry — a virtual module (nothing is written to the
// user's source tree) and no externals, since this build exists to bundle
// the vendors.
const VENDOR_VIRTUAL_ID = '\0fe-build-vendors-entry';

// generates the virtual entry module source: default-import each module (the
// standard interop, same as how externals globals are consumed) and assign it
// to its window global.
export function vendorsVirtualModuleCode(modules) {
  const entries = Object.entries(modules);
  const imports = entries.map(([name], index) => `import __feVendor${index} from ${JSON.stringify(name)};`);
  const globals = entries.map(([name, globalName], index) => `window[${JSON.stringify(globalName)}] = __feVendor${index};`);

  return [...imports, ...globals, ''].join('\n');
}

export default function viteVendorsConfig(vendors, config) {
  const { general, resolve, vite } = config;

  const plugins = [
    {
      name: 'fe-build-vendors-entry',
      enforce: 'pre',
      resolveId(source) {
        return source === VENDOR_VIRTUAL_ID ? VENDOR_VIRTUAL_ID : null;
      },
      load(id) {
        return id === VENDOR_VIRTUAL_ID ? vendorsVirtualModuleCode(vendors.modules) : null;
      },
    },
    ...vite.plugins,
  ];

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
        input: VENDOR_VIRTUAL_ID,
        output: {
          format: 'iife',
          entryFileNames: vendors.output,
          inlineDynamicImports: true,
        },
      },
    },
  };
}
