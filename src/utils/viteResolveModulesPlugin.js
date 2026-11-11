import fs from 'node:fs';
import path from 'node:path';

// fe-build let webpack resolve bare imports against `resolve.modules`
// directories (e.g. `resolve.modules: [src]` makes `import 'components/foo.js'`
// work from anywhere). Rollup/vite has no module-directories concept, so this
// pre-resolver tries each configured dir before vite's own resolution runs.
// Returning null on a miss defers to vite (node_modules, alias, ...).
export default function viteResolveModulesPlugin(modulesDirs = []) {
  const dirs = modulesDirs.filter(Boolean);

  return {
    name: 'fe-build-resolve-modules',
    enforce: 'pre',
    resolveId(source) {
      if (!source || path.isAbsolute(source) || source.startsWith('.') || source.startsWith('\0')) {
        return null;
      }

      for (const dir of dirs) {
        const candidate = path.join(dir, source);
        const options = [candidate, `${candidate}.js`, path.join(candidate, 'index.js')];

        for (const file of options) {
          try {
            if (fs.statSync(file).isFile()) {
              return file;
            }
          } catch {
            // not found here, keep looking
          }
        }
      }

      return null;
    },
  };
}
