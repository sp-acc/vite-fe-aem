import { createRequire } from 'node:module';

// plugins are resolved like fe-build resolved them: from this package first,
// falling back to the consumer project's node_modules via node's upward lookup
const require = createRequire(import.meta.url);

export default function getPlugins(plugins = []) {
  return plugins
    .filter(Boolean)
    .map((entry) => {
      if (Array.isArray(entry)) {
        const [pluginName, pluginOptions] = entry;
        const pluginModule = require(pluginName);
        const pluginFn = pluginModule.default || pluginModule;
        return pluginFn(pluginOptions);
      } else if (typeof entry === 'string') {
        const pluginModule = require(entry);
        return pluginModule.default || pluginModule;
      } else {
        throw new Error(`Invalid plugin entry: ${JSON.stringify(entry)}`);
      }
    });
}
