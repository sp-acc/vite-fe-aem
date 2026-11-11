import path from 'node:path';
import { log } from '../utils/log.js';
import generateEntries from '../utils/generateEntries.js';
import getClientlib from '../utils/getClientlib.js';
import renderClientLibs from '../utils/renderClientLibs.js';
import { parseVendorsConfig } from '../utils/vendorsConfig.js';
import warnIgnored from '../utils/warnIgnored.js';

// extend log to proper say what file is running
export default function clientlibs(config) {
  log(import.meta.filename, 'clientlibs task running...', '', 'info');

  const { extraEntries } = config.postcss;

  // checking all entries at this configuration
  let entries = {
    ...generateEntries(config),
    ...generateEntries(config, 'scss'),
  };

  entries = {
    ...entries,
    ...extraEntries ? {
      ...generateEntries(config, extraEntries.extension, extraEntries.filenamePattern, extraEntries.cwd),
    } : null,
  };

  // clientlibs to render
  const clientLibs = {};

  // category derivation: strip a leading projectKey segment (the template
  // re-adds it) and the AEM clientlibs folder, so new clientlibs get a clean
  // category instead of fe-build's duplicated `projectKey.projectKey....`
  const { projectKey } = config.general;
  const { clientlibsDir = 'clientlibs', categoryDerivation } = config.clientlibs;

  // get parse to check if it has css or js or both.
  Object.keys(entries).forEach((entryKey) => {
    const { name, folder, fileName, extension } = getClientlib(entryKey, { projectKey, clientlibsDir, categoryDerivation });

    if (!clientLibs[folder]) {
      clientLibs[folder] = { name, folder };
    }

    // set the extension
    clientLibs[folder][extension] = fileName;
  });

  // fe-build compatibility: the vite build emits self-contained bundles, there
  // are no webpack split chunks to describe
  const { generateSplitChunksClientlibs = false } = config.clientlibs;

  if (generateSplitChunksClientlibs) {
    warnIgnored(
      'clientlibs.generateSplitChunksClientlibs',
      'every entry is a self-contained bundle, no split chunk clientlibs are generated - use clientlibs.vendors instead'
    );
  }

  // the shared vendors clientlib gets an explicit category (not folder-derived)
  // and is rendered through the same path as the entries
  const vendors = parseVendorsConfig(config);

  if (vendors) {
    const folder = path.dirname(vendors.output);

    if (clientLibs[folder]) {
      log(
        false,
        `"clientlibs.vendors.output" folder "${folder}" collides with an entry clientlib folder`,
        ' - adjust "output" so the vendors clientlib gets its own folder',
        'warning'
      );
    } else {
      clientLibs[folder] = { name: vendors.category, folder, js: path.basename(vendors.output) };
    }
  }

  Object.keys(clientLibs).forEach(lib => renderClientLibs(clientLibs[lib], config));
}
