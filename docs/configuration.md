# Configuration

The default configuration can be extended via a `.febuild` file — a CommonJS
module. It applies to every source file in its own directory and the
subdirectory tree below it. Add multiple `.febuild` files when you need to run
separate builds with different options; each runs as its own build.

A `.febuild` file exports either an **object** with the domains you want to
override…

```javascript
module.exports = {
  general: {
    projectKey: 'myproject',
    sourceKey: 'source',
    bundleKey: 'bundle'
  }
};
```

…or a **function** that receives the resolved default config, for when an
override needs to build on the defaults:

```javascript
module.exports = (defaultConfig) => ({
  sass: {
    includePaths: [...defaultConfig.sass.includePaths, 'node_modules/@my/lib']
  }
});
```

Only the keys you list are overridden; everything else keeps its default.

If `general.sourcesPath` / `general.destinationPath` are omitted, they derive
from the `.febuild` location (sources next to it, `dist` as the output segment).

---

## `general`

Basic project setup, entry discovery, and paths. Defaults:

```javascript
module.exports = {
  general: {
    // Project name used to prefix ClientLib categories and derive folders.
    projectKey: 'myproj',

    // Only source files whose filename carries this suffix are compiled.
    // String (e.g. 'source') or array (e.g. ['publishlibs', 'authorlibs']).
    sourceKey: 'source',

    // Filename suffix of the compiled bundle (input `x.source.js` -> `x.bundle.js`).
    bundleKey: 'bundle',

    // When true, the sourceKey segment becomes an extra dist folder level and is
    // dropped from the dist filename. See "Filename-based clientlib convention".
    sourceKeyAsDistFolder: false,

    // When true, dot-separated segments between the component prefix and the
    // sourceKey are expanded into dist folder levels.
    fileNameDotSuffixesAsDistFolder: false,

    // Values excluded from folder promotion when either flag above is true.
    // Each entry is an exact string or a RegExp. Empty = no exclusions.
    excludeFileNameDotSuffixes: [],

    // Source file types discovered by the build.
    sourceTypes: ['js', 'scss'],

    // Absolute paths — derived from the .febuild location if omitted.
    rootPath: path.resolve('.'),
    sourcesPath: '<rootPath>/src',
    destinationPath: '<rootPath>/dist',

    // Folder holding code shared between SCSS and JS (backing the `utils` alias).
    common: '<sourcesPath>/common',

    // Glob patterns excluded from the file search.
    ignore: ['!(**/target/**)', '!(**/jcr_root/**)', '!(**/common/**)'],

    // Name of the config file the build looks for.
    extendConfigurations: '.febuild',

    // Tasks run by default (order matters). 'clientlibs' is optional.
    defaultTasks: ['styles', 'scripts', 'clientlibs'],
  }
};
```

> **fe-build note:** the task is `scripts` here, not `webpack`. The alias
> `webpack` is still accepted and maps to `scripts`, so existing `defaultTasks`
> arrays keep working.

### Filename-based clientlib convention

By default `sourceKey` is a single string. The build finds every
`**/*.source.js` and compiles it to a dist file in the same relative folder:

```
src/components/video/video.source.js  ->  dist/components/video/video.bundle.js
```

AEM requires **each clientlib to live in its own folder** with a `.content.xml`.
A component often needs several (publish, author, optional features). Three
options let you keep the source tree flat while the build derives the dist
hierarchy from the filename: an array `sourceKey`, `sourceKeyAsDistFolder`, and
`fileNameDotSuffixesAsDistFolder`.

**`sourceKey` array + `sourceKeyAsDistFolder`** — co-locate publish/author files
in one source folder; the suffix picks the dist folder:

```
src/components/video/video.publishlibs.scss   ->  dist/components/video/publishlibs/video.bundle.css
src/components/video/video.authorlibs.scss    ->  dist/components/video/authorlibs/video.bundle.css
```

**`fileNameDotSuffixesAsDistFolder`** — dot-segments between the component name
and the sourceKey become folder levels, for feature-specific clientlibs:

```
src/components/video/video.hd.publishlibs.scss  ->  dist/components/video/hd/publishlibs/video.hd.bundle.css
```

Combined behaviour for `video.main.publishlibs.js`:

| `sourceKeyAsDistFolder` / `fileNameDotSuffixesAsDistFolder` | dist key |
|---|---|
| `false` / `false` | `video.main.bundle.js` (default) |
| `false` / `true`  | `main/video.main.bundle.js` |
| `true`  / `false` | `publishlibs/video.main.bundle.js` |
| `true`  / `true`  | `main/publishlibs/video.main.bundle.js` |

**`excludeFileNameDotSuffixes`** — opt specific values out of promotion while
still treating them as valid source keys (e.g. migrating some files but not
others). Entries are exact strings or RegExps; it is a no-op when both flags are
`false`.

```javascript
general: {
  sourceKey: ['clientlibs', 'publishlibs', 'authorlibs'],
  sourceKeyAsDistFolder: true,
  excludeFileNameDotSuffixes: ['clientlibs', /^v\d+$/], // clientlibs stays flat; v1/v2… not promoted
}
```

---

## `esbuild`

JS transpilation target for the vite/esbuild bundler (replaces fe-build's
`babel` domain — see [migration-from-fe-build.md](./migration-from-fe-build.md)).

```javascript
module.exports = {
  esbuild: {
    target: 'es2020', // string or array, e.g. ['es2018', 'safari14']
  }
};
```

## `vite`

Extra vite plugins applied to every entry build.

```javascript
module.exports = {
  vite: {
    plugins: [], // e.g. [myVitePlugin()]
  }
};
```

## `eslint`

Runs against your project's own ESLint config — flat (`eslint.config.js`) and
legacy (`.eslintrc.*`) are both detected automatically.

```javascript
module.exports = {
  eslint: {
    failOnError: true, // exit non-zero on lint errors
    fix: true,         // write auto-fixes back to sources
  }
};
```

## `sass`

```javascript
module.exports = {
  sass: {
    // Paths searched for @import / @use.
    includePaths: ['<common>/styles', '<nodeModules>'],
    // 'expanded' | 'compressed' | 'nested' | 'compact'.
    outputStyle: 'compressed', // 'expanded' in development
    // Any option from https://sass-lang.com/documentation/js-api/interfaces/options/
    // (key spelled `adicionalOptions` for fe-build compatibility).
    adicionalOptions: {},
    failOnError: true,
  }
};
```

## `postcss`

Transforms the CSS produced by Sass. Plugins are names or `[name, options]`
tuples, resolved from your project's `node_modules`. Place custom plugins
*before* `autoprefixer`.

```javascript
module.exports = {
  postcss: {
    plugins: ['autoprefixer'],
    failOnError: true,
    // Generate clientlibs for extra files produced during the build.
    extraEntries: {},
  }
};
```

## `stylelint`

Uses your project's Stylelint config. Disable entirely with the
`--disable-stylelint` CLI flag.

```javascript
module.exports = {
  stylelint: {
    failOnError: true,
  }
};
```

## `clientlibs`

Controls AEM clientlib metadata generation.

```javascript
module.exports = {
  clientlibs: {
    // When true, overwrite existing .content.xml / *.txt files.
    // When false (default) existing files are preserved — keeping any
    // hand-authored categories intact.
    override: false,

    // Categories skipped when override is true.
    skipCategories: ['myproject.author'],

    // Generate clientlibs for extra generated files.
    extraEntries: {},

    // AEM clientlibs folder segment stripped from generated categories
    // (see "Category derivation" below).
    clientlibsDir: 'clientlibs',

    // fe-build webpack split-chunk flag — no split chunks exist in the vite
    // build, so this is accepted, warned about once, and ignored.
    generateSplitChunksClientlibs: false,
  }
};
```

### Category derivation

The category written to `.content.xml` is derived from the clientlib's folder
path, then prefixed with `general.projectKey` by the template. To avoid the
duplicated `projectKey.projectKey…` categories fe-build produced for projects
whose sources live under a folder named after the projectKey, the build:

1. drops a **leading** path segment equal to `projectKey` (the template re-adds it), and
2. drops any segment equal to `clientlibsDir`.

So `batcom/base/clientlibs/author/components/agegate` with
`projectKey: 'batcom'` yields category `batcom.base.author.components.agegate`.
The physical output folder (where `.content.xml` is written) is unchanged; only
the category string is cleaned.

## `templates`

```javascript
module.exports = {
  templates: {
    // Returns the .content.xml body. `category` is the derived name,
    // `prefix` is general.projectKey.
    clientlibTemplate: (category, prefix) => `...<jcr:root .../>`,
  }
};
```

## `resolve`

Import aliases, passed through to vite's `resolve.alias`.

```javascript
module.exports = {
  resolve: {
    alias: {
      utils: '<common>/utils',
    }
  }
};
```

---

## CLI flags

These are set per-invocation, not in `.febuild`. They flow into `general`:

| Flag | Effect |
|---|---|
| `--development` | Development mode (also `NODE_ENV=development`); expanded CSS, inline sourcemaps. |
| `--watch` | Rebuild on source changes. |
| `--analyze` | Emit a bundle analysis report. |
| `--port=<n>` | Analyzer port (default `8888`). |
| `--task=<name>` | Run a single task (`styles`, `scripts`, `clientlibs`). `webpack` is an alias for `scripts`. |
| `--config-file=<path>` | Use a specific `.febuild` instead of globbing for them. |
| `--disable-stylelint` | Skip Stylelint (`--disable-styelint` typo also accepted). |
| `--quiet` | Suppress non-essential log output. |

---

## Accepted-but-ignored domains (fe-build compatibility)

`babel`, `optimization`, `output`, `plugins` (webpack arrays), `stats`,
`cache`, `devServer`, and `performance` are webpack concepts with no vite
equivalent. They are accepted as empty, mergeable objects so existing `.febuild`
files keep loading without errors; the consuming task warns once and ignores the
values. See [migration-from-fe-build.md](./migration-from-fe-build.md).
