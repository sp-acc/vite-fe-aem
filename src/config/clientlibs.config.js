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
// (a leading segment equal to general.projectKey is also stripped)
const clientlibsDir = 'clientlibs';

// fe-build compatibility: webpack split chunks do not exist in the vite build,
// the clientlibs task warns and ignores this flag when set
const generateSplitChunksClientlibs = false;

export default {
  override,
  skipCategories,
  extraEntries,
  clientlibsDir,
  generateSplitChunksClientlibs,
};
