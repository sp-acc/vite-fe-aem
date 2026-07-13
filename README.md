# vite-aem-fe-build

Vite-based frontend build tool for [AEM](https://business.adobe.com/products/experience-manager/adobe-experience-manager.html) projects — a drop-in replacement for [`@netcentric/fe-build`](https://github.com/Netcentric/fe-build) with webpack/babel swapped for vite/esbuild.

It compiles your SCSS and JS source files and creates the appropriate [clientLibs](https://experienceleague.adobe.com/docs/experience-manager-65/developing/introduction/clientlibs.html?lang=en) resources (`css.txt`, `js.txt`, `.content.xml`) to be included by AEM.

## Requirements

Node.js `^20.19.0 || >=22.12.0` (matching [Vite 7](https://vite.dev/)'s supported versions).

## Getting started

```bash
npm i vite-aem-fe-build
```

Add the build task to your package.json scripts:

```json
"scripts": {
  "build": "vite-aem-fe-build"
}
```

Then:

1. Create a `src` directory and name your source files `*.source.scss` / `*.source.js`, for example:

   ```
   my-project/
   ├─ package.json
   └─ src/
      └─ author/
         ├─ author.source.js
         └─ author.source.scss
   ```

2. Optionally add a `.febuild` config at your project root (alongside `src/`) to override defaults — without one, the tool runs its default configuration:

   ```javascript
   module.exports = {};
   ```

3. Run the build:

   ```bash
   npm run build
   ```

## Migrating from @netcentric/fe-build

Existing `.febuild` files keep working — see [docs/migration-from-fe-build.md](./docs/migration-from-fe-build.md) for the differences (self-contained bundles instead of commons chunks, esbuild instead of babel).

## Features

### JavaScript
- Bundled per entry as self-contained classic scripts (IIFE) with [Vite](https://vite.dev/)/[Rollup](https://rollupjs.org/)
- Transpiled and minified by [esbuild](https://esbuild.github.io/) (modern browser targets)
- Linted with [ESLint](https://eslint.org/) (flat and legacy configs supported), failing the build on errors

### CSS
- [Sass](https://sass-lang.com/) compilation
- Vendor prefixes via [Autoprefixer](https://github.com/postcss/autoprefixer) (extensible with any PostCSS plugin)
- Linted with [Stylelint](https://stylelint.io/)

### ClientLibraries
- Automatically creates clientLibrary resources based on the source files
- Generated CSS and JS files referenced from css.txt and js.txt

## CLI flags

`--watch`, `--development`, `--task=<styles|scripts|clientlibs>`, `--config-file=<path>`, `--quiet`, `--disable-stylelint`

## Guides

- [Configuration](./docs/configuration.md)
- [Migrating from fe-build](./docs/migration-from-fe-build.md)

## Development

```bash
npm test          # vitest suite
npm run parity    # compares output against @netcentric/fe-build (needs ../fe-build or $FE_BUILD_HOME)
```
