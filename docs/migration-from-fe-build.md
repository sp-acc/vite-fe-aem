# Migrating from @netcentric/fe-build

`vite-aem-fe-build` is a drop-in replacement: the `.febuild` format, `*.<sourceKey>.<js|scss>` naming convention, dist layout and clientlib output are unchanged. Swap the dependency and update the script name:

```diff
- "build": "nc-fe-build"
+ "build": "vite-aem-fe-build"
```

## What changes

### Self-contained bundles — no more commons chunks

webpack split shared code into `commons/treeshaking.bundle.js` (runtime, required by **every** entry) and `commons/vendors.bundle.js`. Rollup cannot code-split classic scripts, so every entry is now a **self-contained IIFE** with all imports inlined.

- **Remove any `commons` clientlib references** from AEM page policies/templates — the files are no longer generated.
- clientlib `css.txt`/`js.txt` content is identical (they only ever referenced the entry bundle).
- Trade-off: vendor code used by N clientlibs is duplicated N times on disk. Page weight only grows on pages loading multiple heavy clientlibs; for typical component clientlibs the removed runtime chunk roughly offsets it.
- `clientlibs.generateSplitChunksClientlibs` is accepted but ignored (warning).

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

### Other differences

- `--watch` uses one rollup watcher per JS entry (full import-graph aware) and chokidar for SCSS entry files, same as before.
- `--analyze` is not supported yet.
- `--disable-stylelint` is the documented flag; the old typo `--disable-styelint` still works.
- ESLint runs once over `src/**/*.js` before bundling instead of per-module inside webpack; `fix: true` still writes fixes back to your sources, `failOnError: true` still exits 1.
- Entries that `export` values no longer silently drop them; if the export survives tree-shaking, the bundle exposes it on a generated global (`__<distKey>`).
- Requires Node `^20.19.0 || >=22.12.0` (vite 7).

## What stays exactly the same

- `.febuild` discovery (one build per file), object and function forms, `sourcesPath`/`destinationPath` derivation from the `.febuild` location
- Entry discovery: `sourceKey`/`bundleKey`, `sourceKeyAsDistFolder`, `fileNameDotSuffixesAsDistFolder`, `excludeFileNameDotSuffixes`
- The SCSS pipeline (sass → PostCSS/Autoprefixer → Stylelint) — CSS output is byte-identical
- clientlib generation (`override`, `skipCategories`, `extraEntries`, custom `templates.clientlibTemplate`)
- CLI flags and `NODE_ENV`/`--development` mode handling

The parity of dist trees and clientlib metadata is enforced by `npm run parity`, which builds the same fixtures with both tools and compares the output.
