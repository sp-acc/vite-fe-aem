import '../quiet.js';
import { describe, it, expect } from 'vitest';
import viteEntryConfig from '../../src/utils/viteEntryConfig.js';
import defaults from '../../src/config/index.js';
import extendConfig from '../../src/utils/extendConfig.js';

const FEBUILD = './tests/fixtures/.febuild';
const config = extendConfig(FEBUILD, defaults);

describe('viteEntryConfig externals', () => {
  it('Emits no rollup external/globals by default', () => {
    const cfg = viteEntryConfig('ext/ext.dist.js', '/x/ext.src.js', config);
    expect(cfg.build.rollupOptions.external).toBeUndefined();
    expect(cfg.build.rollupOptions.output.globals).toBeUndefined();
  });

  it('Maps object externals to rollup external + output.globals', () => {
    const cfgWith = extendConfig(FEBUILD, defaults);
    cfgWith.externals = { jquery: 'jQuery' };

    const cfg = viteEntryConfig('ext/ext.dist.js', '/x/ext.src.js', cfgWith);
    expect(cfg.build.rollupOptions.external).toEqual(['jquery']);
    expect(cfg.build.rollupOptions.output.globals).toEqual({ jquery: 'jQuery' });
  });

  it('Warns about and ignores non-object externals forms', () => {
    ['jquery', ['jquery'], /jquery/].forEach((form) => {
      const cfgWith = extendConfig(FEBUILD, defaults);
      cfgWith.externals = form;

      const cfg = viteEntryConfig('ext/ext.dist.js', '/x/ext.src.js', cfgWith);
      expect(cfg.build.rollupOptions.external).toBeUndefined();
      expect(cfg.build.rollupOptions.output.globals).toBeUndefined();
    });
  });

  it('Auto-externalizes clientlibs.vendors modules in regular entries', () => {
    const cfgWith = extendConfig(FEBUILD, defaults);
    cfgWith.clientlibs.vendors = { modules: { jquery: 'jQuery', lodash: '_' } };

    const cfg = viteEntryConfig('app/app.dist.js', '/x/app.src.js', cfgWith);
    expect(cfg.build.rollupOptions.external).toEqual(['jquery', 'lodash']);
    expect(cfg.build.rollupOptions.output.globals).toEqual({ jquery: 'jQuery', lodash: '_' });
  });

  it('Merges explicit externals with clientlibs.vendors modules', () => {
    const cfgWith = extendConfig(FEBUILD, defaults);
    cfgWith.externals = { moment: 'moment' };
    cfgWith.clientlibs.vendors = { modules: { jquery: 'jQuery' } };

    const cfg = viteEntryConfig('app/app.dist.js', '/x/app.src.js', cfgWith);
    expect(cfg.build.rollupOptions.external).toEqual(['moment', 'jquery']);
    expect(cfg.build.rollupOptions.output.globals).toEqual({ moment: 'moment', jquery: 'jQuery' });
  });
});

describe('viteEntryConfig resolve.modules plugin wiring', () => {
  it('Adds no resolver plugin when only node_modules is configured', () => {
    const cfg = viteEntryConfig('a/a.dist.js', '/x/a.src.js', config);
    expect(cfg.plugins.some(p => p.name === 'fe-build-resolve-modules')).toBe(false);
  });

  it('Adds the resolver plugin when extra module dirs are configured', () => {
    const cfgWith = extendConfig(FEBUILD, defaults);
    cfgWith.resolve.modules = [cfgWith.general.sourcesPath];

    const cfg = viteEntryConfig('a/a.dist.js', '/x/a.src.js', cfgWith);
    expect(cfg.plugins.some(p => p.name === 'fe-build-resolve-modules')).toBe(true);
  });
});
