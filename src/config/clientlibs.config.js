/*

  clientLibs generation configuration
  All other configurations

*/

// Override all clientlibs
const override = false;

// array of categories to skip (if override is true)
const skipCategories = ['myproject.author'];

// Object to be able to generate clientlibs for new CSS files (created in build process) in target folder
const extraEntries = {};

// name of the AEM clientlibs folder segment stripped from generated categories
// when categoryDerivation is 'clean'
const clientlibsDir = 'clientlibs';

// how the clientlib category is derived from the output folder path:
//   'fe-build' (default) joins every folder segment verbatim, producing
//     byte-identical categories to webpack fe-build
//     (e.g. `myproj.myproj.base.clientlibs.author...`)
//   'clean' drops a leading projectKey segment and the clientlibs folder
//     segment for a readable category (`myproj.base.author...`), but AEM
//     policies/templates referencing fe-build's categories must be updated
const categoryDerivation = 'fe-build';

// fe-build compatibility: webpack split chunks do not exist in the vite build,
// the clientlibs task warns and ignores this flag when set
const generateSplitChunksClientlibs = false;

// shared vendors clientlib, off by default. Set to restore fe-build's
// splitChunks vendor sharing without webpack:
//   vendors: {
//     modules: { jquery: 'jQuery', lodash: '_' },  // module specifier -> window global
//     category: 'commons',                          // clientlib category (default)
//     output: 'commons/vendors.dist.js'             // dist path (default)
//   }
// The tool builds one vendors IIFE exposing the globals, externalizes those
// modules in every regular entry, and renders the clientlib metadata.
const vendors = null;

export default {
  override,
  skipCategories,
  extraEntries,
  clientlibsDir,
  categoryDerivation,
  generateSplitChunksClientlibs,
  vendors,
};
