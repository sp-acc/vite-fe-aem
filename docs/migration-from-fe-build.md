# Migrating from @netcentric/fe-build

`vite-aem-fe-build` is a drop-in replacement: the `.febuild` format, `*.<sourceKey>.<js|scss>` naming convention, dist layout and clientlib output are unchanged. Swap the dependency and update the script name:

```diff
- "build": "nc-fe-build"
+ "build": "vite-aem-fe-build"
```

## What changes

### Self-contained bundles — commons chunks are opt-in again

webpack split shared code into `commons/treeshaking.bundle.js` (runtime, required by **every** entry) and `commons/vendors.bundle.js`. Rollup cannot code-split classic scripts, so every entry is now a **self-contained IIFE** with all imports inlined.

- **Remove any `commons` clientlib references** from AEM page policies/templates — the webpack-generated files are no longer produced.
- clientlib `css.txt`/`js.txt` content is identical (they only ever referenced the entry bundle).
- Vendor code used by N clientlibs is duplicated N times on disk **unless** you configure the replacement: [`clientlibs.vendors`](configuration.md#shared-vendors-clientlib-vendors) builds one vendors clientlib that exposes your shared libraries as window globals (`commons/vendors.<bundleKey>.js`, like fe-build's chunk location) and auto-externalizes them in every entry. If you adopt it, point your page policies/embed at the new vendors clientlib — and mind the load order, exactly as with the old commons chunks.
- `clientlibs.generateSplitChunksClientlibs` is accepted but ignored (warning) — configuring `clientlibs.vendors` is the replacement opt-in (metadata for the shared bundle is generated whenever it is configured, no extra flag). Keep the flag if you like: nothing breaks, the warning is skipped once `vendors` is set.

**`@netcentric/component-loader` is unaffected by any of this.** Its registry (`window.ncComponents`) is populated by `register()` calls from statically bundled code and tolerates bundles loading in any order (deferred queue); it never inspects chunk structure, has no webpack runtime coupling, and works unchanged with self-contained IIFEs. Also note fe-build's babel special case `exclude: /node_modules\/(?!@netcentric)/` (needed because component-loader ships untranspiled) has no equivalent here — vite/rollup consume untranspiled ESM natively, nothing to configure.

### esbuild instead of Babel + core-js

JS is transpiled by esbuild for modern evergreen browsers (default target `es2020`, override via the new `esbuild.target` option). **core-js polyfills are no longer injected automatically** — if you must support a runtime missing an API, import the polyfill explicitly in your source.

`.febuild` overrides of `babel` are accepted but ignored (warning).

### Ignored webpack-era config domains

These `.febuild` keys still merge without errors but have no effect: `babel`, `optimization`, `output`, `plugins` (webpack plugin arrays), `stats`, `cache`, `devServer`, `performance`. The consuming task logs a warning once per key.

New domains replace them where it makes sense:

| Old | New |
|---|---|
| `babel` | `esbuild: { target }` |
| `plugins` (webpack) | `vite: { plugins: [...] }` (vite plugins) |

### Task rename

The `webpack` task is now `scripts`. `--task=webpack` and `defaultTasks: [... 'webpack' ...]` still work via an alias (with a warning).

### Clientlib categories default to fe-build's exact spelling

Categories in `.content.xml` are derived from the output folder path. fe-build joined every folder segment verbatim (producing duplicates like `myproj.myproj.base.clientlibs.author…` when sources live under a folder named after the project key); this tool reproduces that **byte-for-byte by default**, so AEM policies and templates referencing existing categories keep working.

The duplicates can be cleaned up per project with `clientlibs.categoryDerivation: 'clean'` — it drops a leading `projectKey` segment and the `clientlibs` folder segment (`myproj.myproj.base.clientlibs.author…` → `myproj.base.author…`). If you opt in, update the category references in your AEM policies/templates as part of the migration.

### Externals and resolve.modules keep working

- `externals: { jquery: 'jQuery' }` keeps the dependency out of the bundle and references the page global, like webpack did. Only the object form is supported; other webpack externals forms are warned about and ignored.
- `resolve.modules: [<dir>, …]` lets bare imports (e.g. `import 'components/foo.js'`) resolve against your own directories, as before.

### Other differences

- `--watch` uses one rollup watcher per JS entry (full import-graph aware) and chokidar for SCSS entry files, same as before.
- `--analyze` is not supported yet.
- `--disable-stylelint` is the documented flag; the old typo `--disable-styelint` still works.
- ESLint runs once over `src/**/*.js` before bundling instead of per-module inside webpack; `fix: true` still writes fixes back to your sources, `failOnError: true` still exits 1. Note the major jump from ESLint 8 to ESLint 9: projects with custom plugins or legacy configs may need small updates (legacy `.eslintrc.*` configs are still detected and used).
- Entries that `export` values no longer silently drop them; if the export survives tree-shaking, the bundle exposes it on a generated global (`__<distKey>`).
- Dynamic `import()` inside entry code is **inlined** into the bundle instead of producing an async chunk — the code loads eagerly with the entry. (webpack would have emitted a separate async chunk.)
- CSS imported from JS (`import './styles.source.scss'` inside an entry) is injected at runtime as a `<style>` tag instead of failing the webpack build. It bypasses clientlib `css.txt` management — prefer SCSS entries so AEM keeps serving your CSS.
- Requires Node `^20.19.0 || >=22.12.0` (vite 7).

## What stays exactly the same

- `.febuild` discovery (one build per file), object and function forms, `sourcesPath`/`destinationPath` derivation from the `.febuild` location
- Entry discovery: `sourceKey`/`bundleKey`, `sourceKeyAsDistFolder`, `fileNameDotSuffixesAsDistFolder`, `excludeFileNameDotSuffixes`
- The SCSS pipeline (sass → PostCSS/Autoprefixer → Stylelint) — CSS output is byte-identical
- clientlib generation layout (`override`, `skipCategories`, `extraEntries`, custom `templates.clientlibTemplate`) and, by default, the exact category strings fe-build produced
- `externals` (object form) and `resolve.modules` semantics
- CLI flags and `NODE_ENV`/`--development` mode handling

The parity of dist trees and clientlib metadata is enforced by `npm run parity`, which builds the same fixtures with both tools and compares the output.
