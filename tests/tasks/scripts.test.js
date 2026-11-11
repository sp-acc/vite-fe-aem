import '../quiet.js';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, beforeAll, expect } from 'vitest';
import scripts from '../../src/tasks/scripts.js';
import runEslint from '../../src/utils/runEslint.js';
import defaults from '../../src/config/index.js';
import extendConfig from '../../src/utils/extendConfig.js';
import generateEntries from '../../src/utils/generateEntries.js';

const FEBUILD = './tests/fixtures/.febuild';

const config = extendConfig(FEBUILD, defaults);
const entries = generateEntries(config);
const { destinationPath } = config.general;

beforeAll(async () => {
  await scripts(config);
}, 60000);

describe('Test task/scripts.js (production build)', () => {
  it('Finds the 2 fixture JS entries', () => {
    expect(Object.keys(entries).length).toBe(2);
  });

  Object.keys(entries).forEach((entry) => {
    const outFile = path.join(destinationPath, entry);

    it(`Emits a bundle at the exact dist key ${entry}`, () => {
      expect(fs.existsSync(outFile)).toBe(true);
      expect(fs.statSync(outFile).size).toBeGreaterThan(0);
    });

    it(`${entry} is a classic script (no top-level import/export)`, () => {
      const content = fs.readFileSync(outFile, 'utf8');
      expect(content).not.toMatch(/^\s*import[\s{"']/m);
      expect(content).not.toMatch(/^\s*export[\s{"']/m);
    });

    it(`${entry} inlines the aliased common/utils imports`, () => {
      const content = fs.readFileSync(outFile, 'utf8');
      // randomInt body from tests/fixtures/src/common/utils must be bundled in
      expect(content).toContain('Math.random()');
    });

    it(`${entry} is minified in production and has no inline sourcemap`, () => {
      const content = fs.readFileSync(outFile, 'utf8');
      expect(content).not.toContain('\n\n');
      expect(content).not.toContain('sourceMappingURL');
    });
  });
});

// -- development build: unminified with inline sourcemaps
const cfgDev = extendConfig(FEBUILD, defaults);
cfgDev.general.destinationPath = path.resolve('tests/fixtures/dist-dev');
cfgDev.general.isProduction = false;
cfgDev.general.mode = 'development';
const entriesDev = generateEntries(cfgDev);

describe('scripts task (development build)', () => {
  beforeAll(async () => {
    await scripts(cfgDev);
  }, 60000);

  Object.keys(entriesDev).forEach((entry) => {
    const outFile = path.join(cfgDev.general.destinationPath, entry);

    it(`${entry} carries an inline sourcemap`, () => {
      const content = fs.readFileSync(outFile, 'utf8');
      expect(content).toContain('sourceMappingURL=data:application/json');
    });

    it(`${entry} is not minified`, () => {
      const content = fs.readFileSync(outFile, 'utf8');
      // class and method names survive without minification
      expect(content).toContain('constructor');
    });

    it(`${entry} has NODE_ENV replaced with the build mode`, () => {
      const content = fs.readFileSync(outFile, 'utf8');
      expect(content).not.toContain('process.env.NODE_ENV');
    });
  });
});

// -- externals: webpack-era `externals` maps to rollup external + globals
const cfgExternals = extendConfig(FEBUILD, defaults);
cfgExternals.general.sourcesPath = path.resolve('tests/fixtures/src-externals');
cfgExternals.general.destinationPath = path.resolve('tests/fixtures/dist-externals');
cfgExternals.externals = { jquery: 'jQuery' };

describe('scripts task with externals', () => {
  beforeAll(async () => {
    await scripts(cfgExternals);
  }, 60000);

  const outFile = path.join(cfgExternals.general.destinationPath, 'ext', 'ext.dist.js');

  it('Emits the bundle', () => {
    expect(fs.existsSync(outFile)).toBe(true);
  });

  it('References the jQuery global instead of bundling or importing it', () => {
    const content = fs.readFileSync(outFile, 'utf8');
    expect(content).toContain('jQuery');
    expect(content).not.toMatch(/^\s*import[\s{"']/m);
  });
});

// -- resolve.modules: bare imports resolve against configured directories
// (the imported module is a plain .js file, only entries carry the sourceKey)
const cfgModules = extendConfig(FEBUILD, defaults);
const srcModulesDir = path.resolve('tests/fixtures/src-resolvemodules');
cfgModules.general.sourcesPath = srcModulesDir;
cfgModules.general.destinationPath = path.resolve('tests/fixtures/dist-resolvemodules');
cfgModules.resolve.modules = [srcModulesDir];

describe('scripts task with resolve.modules', () => {
  beforeAll(async () => {
    await scripts(cfgModules);
  }, 60000);

  const outFile = path.join(cfgModules.general.destinationPath, 'main', 'main.dist.js');

  it('Emits only the entry (plain modules are not entries)', () => {
    expect(fs.readdirSync(cfgModules.general.destinationPath, { recursive: true }).filter(f => f.endsWith('.js'))).toEqual(['main/main.dist.js']);
  });

  it('Emits the bundle', () => {
    expect(fs.existsSync(outFile)).toBe(true);
  });

  it('Inlines the module resolved through resolve.modules', () => {
    const content = fs.readFileSync(outFile, 'utf8');
    expect(content).toContain('widget-rendered');
  });
});

// -- clientlibs.vendors: one shared vendors clientlib + auto-externals.
// The vendors bundle must actually resolve `jquery`, hence the devDependency.
const cfgVendors = extendConfig(FEBUILD, defaults);
cfgVendors.general.sourcesPath = path.resolve('tests/fixtures/src-vendors');
cfgVendors.general.destinationPath = path.resolve('tests/fixtures/dist-vendors');
cfgVendors.clientlibs.vendors = { modules: { jquery: 'jQuery' } };

describe('scripts task with clientlibs.vendors', () => {
  beforeAll(async () => {
    await scripts(cfgVendors);
  }, 60000);

  const vendorsFile = path.join(cfgVendors.general.destinationPath, 'commons', 'vendors.dist.js');
  const entryFile = path.join(cfgVendors.general.destinationPath, 'app', 'app.dist.js');

  it('Emits the vendors clientlib bundle at the fe-build commons path', () => {
    expect(fs.existsSync(vendorsFile)).toBe(true);
    expect(fs.statSync(vendorsFile).size).toBeGreaterThan(10000);
  });

  it('Vendors bundle contains the library and exposes the window global', () => {
    const content = fs.readFileSync(vendorsFile, 'utf8');
    // esbuild minification strips jquery's banner but keeps the version string
    expect(content).toContain('3.7.1');
    expect(content).toMatch(/window\.jQuery\s*=|window\[\s*["']jQuery["']\s*\]\s*=/);
  });

  it('Vendors bundle is a classic script', () => {
    const content = fs.readFileSync(vendorsFile, 'utf8');
    expect(content).not.toMatch(/^\s*import[\s{"']/m);
    expect(content).not.toMatch(/^\s*export[\s{"']/m);
  });

  it('Entry bundle references the global instead of bundling jquery', () => {
    const content = fs.readFileSync(entryFile, 'utf8');
    expect(content).toContain('jQuery');
    expect(content).not.toContain('3.7.1');
    expect(content).not.toMatch(/^\s*import[\s{"']/m);
  });
});

// -- eslint gating
describe('runEslint', () => {
  it('Passes on the clean fixture sources (legacy .eslintrc config)', async () => {
    const cfg = extendConfig(FEBUILD, defaults);
    const ok = await runEslint(cfg);
    expect(ok).toBe(true);
  });

  it('Reports errors without exiting when failOnError is false', async () => {
    const cfg = extendConfig(FEBUILD, defaults);
    cfg.eslint.failOnError = false;
    cfg.eslint.fix = false;

    const badDir = path.resolve('tests/fixtures/dist-lint-bad');
    fs.mkdirSync(badDir, { recursive: true });
    fs.writeFileSync(path.join(badDir, 'bad.js'), 'const a = undefinedVariable;\n');
    cfg.general.sourcesPath = badDir;

    const ok = await runEslint(cfg);
    fs.rmSync(badDir, { recursive: true, force: true });
    expect(ok).toBe(false);
  });
});
