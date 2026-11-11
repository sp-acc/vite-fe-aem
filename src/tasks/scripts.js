import { build } from 'vite';
import { log } from '../utils/log.js';
import generateEntries from '../utils/generateEntries.js';
import runEslint from '../utils/runEslint.js';
import viteEntryConfig from '../utils/viteEntryConfig.js';
import viteVendorsConfig from '../utils/viteVendorsConfig.js';
import { parseVendorsConfig } from '../utils/vendorsConfig.js';
import warnIgnored from '../utils/warnIgnored.js';

// warn once about webpack-era .febuild overrides that have no vite equivalent
function warnIgnoredDomains(config) {
  if (config.babel && Object.keys(config.babel).length > 0) {
    warnIgnored('babel', 'JS is transpiled by esbuild, see the "esbuild" config domain');
  }

  if (config.optimization && Object.keys(config.optimization).length > 0) {
    warnIgnored('optimization', 'every entry is a self-contained bundle, vendor/runtime splitting is not supported');
  }

  if (Array.isArray(config.plugins) && config.plugins.length > 0) {
    warnIgnored('plugins', 'webpack plugins cannot run in vite, use "vite.plugins" for vite plugins');
  }
}

// replaces fe-build's webpack task: one self-contained IIFE build per JS entry
export default async function scripts(config) {
  // checking all entries at this configuration
  const entries = generateEntries(config);
  const { watch } = config.general;
  const vendors = parseVendorsConfig(config);

  log(import.meta.filename, 'Vite transpile running...', '', 'info');

  warnIgnoredDomains(config);

  if ((!entries || Object.keys(entries).length === 0) && !vendors) {
    log(import.meta.filename, 'No entries for vite, nothing found', '', 'info');
    return;
  }

  await runEslint(config);

  if (config.general.analyze) {
    warnIgnored('--analyze', 'bundle analysis is not supported yet');
  }

  // the shared vendors clientlib is built first, so an unresolvable module
  // name fails before any entry build
  if (vendors) {
    try {
      await build(viteVendorsConfig(vendors, config));
      log(import.meta.filename, `Bundled - ${vendors.output}`, '', 'success');
    } catch (error) {
      log(import.meta.filename, error.message, '', 'error');

      if (!watch) {
        process.exit(1);
      }
    }
  }

  for (const [distKey, srcFile] of Object.entries(entries || {})) {
    try {
      await build(viteEntryConfig(distKey, srcFile, config));
      log(import.meta.filename, `Bundled - ${distKey}`, '', 'success');
    } catch (error) {
      log(import.meta.filename, error.message, '', 'error');

      if (!watch) {
        process.exit(1);
      }
    }
  }

  log(import.meta.filename, 'Vite transpile ended', '', 'success');
}
