# Configuration

The default configuration can be extended via a `.febuild` file — a CommonJS module used for all source files in the same directory tree. Multiple `.febuild` files run as separate builds.

Export an object, or a function receiving the default config:

```javascript
module.exports = {
  general: {
    projectKey: 'myproject',
    sourceKey: 'source',
    bundleKey: 'bundle'
  }
};
```

```javascript
module.exports = (defaultConfig) => ({
  sass: {
    includePaths: [...defaultConfig.sass.includePaths, 'node_modules/@my/lib']
  }
});
```

If `general.sourcesPath` / `general.destinationPath` are omitted, they derive from the `.febuild` location (sources next to it, `dist` as the output segment).

## Configuration domains

### general

Paths (`rootPath`, `sourcesPath`, `destinationPath`, `common`), `projectKey`, entry discovery (`sourceKey` — string or array, `bundleKey`, `sourceKeyAsDistFolder`, `fileNameDotSuffixesAsDistFolder`, `excludeFileNameDotSuffixes`), `defaultTasks` (`['styles', 'scripts', 'clientlibs']`), and CLI-flag-derived state.

### esbuild

JS transpilation target (replaces fe-build's `babel` domain):

```javascript
module.exports = {
  esbuild: { target: ['es2018', 'safari14'] }
};
```

### vite

Extra vite plugins applied to every entry build:

```javascript
module.exports = {
  vite: { plugins: [myVitePlugin()] }
};
```

### eslint

`failOnError` (default `true`, exits 1 on lint errors), `fix` (default `true`, writes fixes back to sources). Your project's own ESLint config is used — flat (`eslint.config.js`) and legacy (`.eslintrc.*`) are both supported.

### sass

`includePaths`, `outputStyle`, `adicionalOptions` (any [sass option](https://sass-lang.com/documentation/js-api/interfaces/options/)), `failOnError`.

### postcss

`plugins` (names or `[name, options]` tuples, resolved from your project), `failOnError`, `extraEntries` (generate clientlibs for extra generated files).

### stylelint

`failOnError`. Uses your project's stylelint config. Disable entirely with `--disable-stylelint`.

### clientlibs

`override` (rewrite existing files), `skipCategories`, `extraEntries`. (`generateSplitChunksClientlibs` is a fe-build compatibility no-op.)

### templates

`clientlibTemplate(category, prefix)` — function returning the `.content.xml` content.

### resolve

`alias` — import aliases, passed to vite's `resolve.alias`.

## Accepted-but-ignored domains (fe-build compatibility)

`babel`, `optimization`, `output`, `plugins` (webpack arrays), `stats`, `cache`, `devServer`, `performance` — these merge without errors so existing `.febuild` files keep loading; the consuming task warns once and ignores the values. See [migration-from-fe-build.md](./migration-from-fe-build.md).
