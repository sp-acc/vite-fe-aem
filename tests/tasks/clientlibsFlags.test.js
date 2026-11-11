import '../quiet.js';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, beforeAll, expect, vi } from 'vitest';

// build logs are silenced in tests, so capture log() calls to observe warnings
const { logged } = vi.hoisted(() => ({ logged: [] }));
vi.mock('../../src/utils/log.js', () => ({
  log: (file, title, extra, sev) => {
    logged.push({ title: String(title), extra: String(extra), sev });
  },
  colorOptions: {},
  color: () => '',
  emojis: {},
  random: () => '',
  severity: {},
}));

const { default: clientlibTask } = await import('../../src/tasks/clientlibs.js');
const { default: defaults } = await import('../../src/config/index.js');
const { default: extendConfig } = await import('../../src/utils/extendConfig.js');

const FEBUILD = './tests/fixtures/.febuild';
const warnedAboutFlag = () => logged.some(entry => entry.title.includes('generateSplitChunksClientlibs'));

// -- fe-build's split-chunk flag together with the replacement: the flag is
// harmless and must not produce the "use clientlibs.vendors instead" warning
// (the replacement is already active). Ordered first: warnIgnored warns once.
const cfgBoth = extendConfig(FEBUILD, defaults);
cfgBoth.general.sourcesPath = path.resolve('tests/fixtures/src-vendors');
cfgBoth.general.destinationPath = path.resolve('tests/fixtures/dist-flags-both');
cfgBoth.clientlibs.vendors = { modules: { jquery: 'jQuery' } };
cfgBoth.clientlibs.generateSplitChunksClientlibs = true;

describe('generateSplitChunksClientlibs alongside clientlibs.vendors', () => {
  beforeAll(async () => {
    await clientlibTask(cfgBoth);
  });

  it('Does not warn about the flag when vendors is configured', () => {
    expect(warnedAboutFlag()).toBe(false);
  });

  it('Still renders the vendors clientlib metadata', () => {
    expect(fs.readFileSync(
      path.join(cfgBoth.general.destinationPath, 'commons', 'js.txt'), 'utf8'
    )).toBe('vendors.dist.js');
  });
});

// -- the flag alone has no split chunks to describe, so it stays a warned no-op
const cfgFlagOnly = extendConfig(FEBUILD, defaults);
cfgFlagOnly.general.sourcesPath = path.resolve('tests/fixtures/src-vendors');
cfgFlagOnly.general.destinationPath = path.resolve('tests/fixtures/dist-flags-only');
cfgFlagOnly.clientlibs.generateSplitChunksClientlibs = true;

describe('generateSplitChunksClientlibs without vendors', () => {
  beforeAll(async () => {
    await clientlibTask(cfgFlagOnly);
  });

  it('Warns that the flag is ignored', () => {
    expect(warnedAboutFlag()).toBe(true);
  });

  it('Generates no commons clientlib metadata', () => {
    expect(fs.existsSync(path.join(cfgFlagOnly.general.destinationPath, 'commons'))).toBe(false);
  });
});
