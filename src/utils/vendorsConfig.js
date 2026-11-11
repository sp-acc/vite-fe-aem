import path from 'node:path';
import { log } from './log.js';

const warned = new Set();

function warnOnce(message, hint) {
  if (warned.has(message)) return;
  warned.add(message);
  log(false, message, ` - ${hint}`, 'warning');
}

// normalizes config.clientlibs.vendors — the shared vendors clientlib:
//
//   clientlibs: {
//     vendors: {
//       modules: { jquery: 'jQuery', lodash: '_' },  // module specifier -> window global
//       category: 'commons',                          // clientlib category (default)
//       output: 'commons/vendors.dist.js'             // dist path (default)
//     }
//   }
//
// The tool builds ONE self-contained IIFE importing every module and exposing
// it on window under its global name (restoring fe-build's splitChunks vendor
// sharing without a webpack runtime), auto-externalizes those modules in every
// regular entry, and renders the clientlib metadata (.content.xml / js.txt).
//
// Returns the normalized config, or null when unset or misconfigured.
export function parseVendorsConfig(config) {
  const vendors = config && config.clientlibs && config.clientlibs.vendors;

  if (!vendors) {
    return null;
  }

  const modules = vendors.modules;
  const validModules = Boolean(
    modules
    && typeof modules === 'object'
    && !Array.isArray(modules)
    && Object.keys(modules).length > 0
    && Object.entries(modules).every(([name, globalName]) => name && typeof globalName === 'string' && globalName)
  );

  if (!validModules) {
    warnOnce(
      '"clientlibs.vendors" is misconfigured and is ignored',
      'use { modules: { "lib-name": "GlobalName" }, category: "commons", output: "commons/vendors.dist.js" }'
    );
    return null;
  }

  const { bundleKey } = config.general;
  const category = typeof vendors.category === 'string' && vendors.category ? vendors.category : 'commons';
  // default mirrors fe-build's splitChunks cacheGroup location
  const output = typeof vendors.output === 'string' && vendors.output
    ? vendors.output
    : path.join('commons', `vendors.${bundleKey}.js`);

  return {
    modules: { ...modules },
    category,
    output,
  };
}

// merges the vendors module map into an externals map: every vendors module is
// externalized in regular entries, which reference the window globals served
// by the vendors clientlib. On a module mapped to two different globals the
// vendors mapping wins (warned once).
export function mergeVendorsExternals(externals = {}, modules = {}) {
  const merged = { ...externals };

  Object.entries(modules).forEach(([name, globalName]) => {
    if (merged[name] && merged[name] !== globalName) {
      warnOnce(
        `"externals" and "clientlibs.vendors" map "${name}" to different globals`,
        `"${merged[name]}" (externals) vs "${globalName}" (vendors) - using "${globalName}"`
      );
    }

    merged[name] = globalName;
  });

  return merged;
}
