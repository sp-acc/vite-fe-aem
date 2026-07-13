#!/usr/bin/env node
/**
 * Drop-in parity check against @netcentric/fe-build.
 *
 * Copies the test fixtures twice, builds one copy with fe-build (webpack)
 * and one with this tool (vite), then compares the dist trees:
 *   - file sets must match, except an allowlist of expected webpack-only files
 *   - css.txt / js.txt / .content.xml must be byte-identical
 *   - .css files must be byte-identical (sourcemap comments stripped)
 *   - .js bundles must exist, be non-empty and classic-script safe
 *
 * fe-build is looked up at $FE_BUILD_HOME or ../ (the nested-repo layout);
 * the check is skipped with a notice when it is not available.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES = path.join(ROOT, 'tests', 'fixtures');
const PARITY = path.join(ROOT, 'tests', '.parity');

// files fe-build emits that this tool intentionally does not (self-contained
// bundles instead of webpack runtime/vendor split chunks)
const EXPECTED_ONLY_IN_WEBPACK = [
  // chunk names use fe-build's default bundleKey, not the .febuild override
  /^commons\/treeshaking\.(bundle|dist)\.js$/,
  /^commons\/vendors\.(bundle|dist)\.js$/,
  // fe-build excludes core-js from its named vendor/treeshaking cache groups
  // (config/general.config.js excludedFromVendors), so shared core-js helpers
  // still fall into webpack's implicit default split-chunks group and get
  // emitted as an unnamed, numeric-id chunk (output.config.js chunkFilename:
  // '[name]' falls back to the id) that is never referenced by any clientlib
  // js.txt. Not applicable to vite, which doesn't split usage-based polyfills.
  /^\d+$/,
];

function findFeBuild() {
  const home = process.env.FE_BUILD_HOME || path.resolve(ROOT, '..');
  const cli = path.join(home, 'cli', 'index.js');

  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(home, 'package.json'), 'utf8'));
    if (pkg.name === '@netcentric/fe-build' && fs.existsSync(cli)) return cli;
  } catch {
    // fall through
  }

  return null;
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => path.relative(dir, path.join(entry.parentPath, entry.name)))
    .sort();
}

function stripSourcemapComments(css) {
  return css.replace(/\/\*#\s*sourceMappingURL=[^*]*\*\/\s*$/g, '').trimEnd();
}

function setupCopy(name) {
  const target = path.join(PARITY, name);
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  fs.cpSync(FIXTURES, target, { recursive: true });
  // discovery mode must only find the top-level .febuild pair once per tool
  return target;
}

function build(label, cli, cwd) {
  console.log(`[parity] building with ${label}...`);
  execFileSync('node', [cli, '--config-file=.febuild', '--quiet'], {
    cwd,
    stdio: ['ignore', 'inherit', 'inherit'],
    env: { ...process.env, NODE_ENV: 'production' },
  });
}

// fe-build resolves webpack loaders (e.g. babel-loader) relative to the cwd
// of the project being built. In real usage that project has its own
// node_modules with fe-build's loaders hoisted into it; our throwaway
// fixture copy does not, so symlink fe-build's node_modules in to match.
function linkFeBuildNodeModules(feBuildCli, cwd) {
  const feBuildNodeModules = path.join(path.dirname(feBuildCli), '..', 'node_modules');
  const target = path.join(cwd, 'node_modules');
  fs.symlinkSync(feBuildNodeModules, target, 'dir');
}

const feBuildCli = findFeBuild();

if (!feBuildCli) {
  console.log('[parity] @netcentric/fe-build not found at $FE_BUILD_HOME or ../ - skipping parity check');
  process.exit(0);
}

const webpackDir = setupCopy('webpack');
const viteDir = setupCopy('vite');

linkFeBuildNodeModules(feBuildCli, webpackDir);

build('@netcentric/fe-build (webpack)', feBuildCli, webpackDir);
build('vite-aem-fe-build (vite)', path.join(ROOT, 'bin', 'index.js'), viteDir);

const webpackDist = path.join(webpackDir, 'dist');
const viteDist = path.join(viteDir, 'dist');

const webpackFiles = listFiles(webpackDist);
const viteFiles = listFiles(viteDist);

const failures = [];

// 1. file tree comparison
const onlyWebpack = webpackFiles.filter(f => !viteFiles.includes(f));
const onlyVite = viteFiles.filter(f => !webpackFiles.includes(f));

for (const file of onlyWebpack) {
  if (!EXPECTED_ONLY_IN_WEBPACK.some(rx => rx.test(file))) {
    failures.push(`missing in vite dist: ${file}`);
  }
}

for (const file of onlyVite) {
  failures.push(`unexpected extra file in vite dist: ${file}`);
}

// 2. clientlib metadata must be byte-identical
// 3. css must be byte-identical modulo sourcemap comments
for (const file of webpackFiles.filter(f => viteFiles.includes(f))) {
  const a = fs.readFileSync(path.join(webpackDist, file));
  const b = fs.readFileSync(path.join(viteDist, file));

  if (/(?:css|js)\.txt$|\.content\.xml$/.test(file)) {
    if (!a.equals(b)) failures.push(`clientlib metadata differs: ${file}`);
  } else if (file.endsWith('.css')) {
    if (stripSourcemapComments(a.toString()) !== stripSourcemapComments(b.toString())) {
      failures.push(`css output differs: ${file}`);
    }
  } else if (file.endsWith('.js')) {
    const content = b.toString();
    if (content.length === 0) failures.push(`empty js bundle: ${file}`);
    if (/^\s*(?:import|export)[\s{"']/m.test(content)) {
      failures.push(`js bundle is not classic-script safe: ${file}`);
    }
  }
}

console.log(`[parity] compared ${webpackFiles.length} webpack files vs ${viteFiles.length} vite files`);
console.log(`[parity] webpack-only files (expected): ${onlyWebpack.filter(f => EXPECTED_ONLY_IN_WEBPACK.some(rx => rx.test(f))).join(', ') || 'none'}`);

if (failures.length > 0) {
  console.error('\n[parity] FAILED:');
  failures.forEach(f => console.error(`  - ${f}`));
  process.exit(1);
}

console.log('[parity] OK - dist trees are drop-in compatible');
