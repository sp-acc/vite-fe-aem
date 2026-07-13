import fs from 'node:fs';
import path from 'node:path';
import glob from 'fast-glob';
import { loadESLint } from 'eslint';
import { log } from './log.js';

const FLAT_CONFIG_FILES = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  'eslint.config.mts',
  'eslint.config.cts',
];

function hasFlatConfig(rootPath) {
  return FLAT_CONFIG_FILES.some(file => fs.existsSync(path.join(rootPath, file)));
}

// replaces fe-build's eslint-webpack-plugin: lint all sources once before the
// per-entry vite builds, with the same failOnError / fix gating semantics
export default async function runEslint(config) {
  const { failOnError, fix } = config.eslint;
  const { rootPath, sourcesPath, watch } = config.general;

  // consumer projects may still use legacy .eslintrc configs
  const ESLint = await loadESLint({ useFlatConfig: hasFlatConfig(rootPath) });
  const eslint = new ESLint({ cwd: rootPath, fix });

  // dotfiles (like .febuild.js configs) are excluded: eslint-webpack-plugin
  // only ever linted modules that were part of the bundle
  const files = glob.sync('**/*.js', {
    cwd: sourcesPath,
    absolute: true,
    ignore: ['**/node_modules/**'],
  });

  if (files.length === 0) {
    return true;
  }

  const results = await eslint.lintFiles(files);

  // parity with eslint-webpack-plugin: fixes are written back to the sources
  if (fix) {
    await ESLint.outputFixes(results);
  }

  const formatter = await eslint.loadFormatter('stylish');
  const output = formatter.format(results);

  if (output) {
    console.log(output);
  }

  const errorCount = results.reduce((count, result) => count + result.errorCount, 0);

  if (errorCount > 0) {
    log(import.meta.filename, `ESLint found ${errorCount} error(s)`, '', 'error');

    if (failOnError && !watch) {
      process.exit(1);
    }

    return false;
  }

  log(import.meta.filename, 'ESLint passed', '', 'success');
  return true;
}
