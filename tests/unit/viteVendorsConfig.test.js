import '../quiet.js';
import { describe, it, expect } from 'vitest';
import viteVendorsConfig, { vendorsVirtualModuleCode } from '../../src/utils/viteVendorsConfig.js';
import defaults from '../../src/config/index.js';
import extendConfig from '../../src/utils/extendConfig.js';

const FEBUILD = './tests/fixtures/.febuild';
const config = extendConfig(FEBUILD, defaults);
const vendors = { modules: { jquery: 'jQuery', lodash: '_' }, category: 'commons', output: 'commons/vendors.dist.js' };

describe('vendorsVirtualModuleCode', () => {
  it('Default-imports every module and assigns its window global', () => {
    const code = vendorsVirtualModuleCode({ jquery: 'jQuery', lodash: '_' });

    expect(code).toContain('import __feVendor0 from "jquery";');
    expect(code).toContain('import __feVendor1 from "lodash";');
    expect(code).toContain('window["jQuery"] = __feVendor0;');
    expect(code).toContain('window["_"] = __feVendor1;');
  });
});

describe('viteVendorsConfig', () => {
  const cfg = viteVendorsConfig(vendors, config);

  it('Uses the virtual module as rollup input', () => {
    expect(cfg.build.rollupOptions.input).toBe('\0fe-build-vendors-entry');
  });

  it('Emits an IIFE at the configured output path', () => {
    const { output } = cfg.build.rollupOptions;
    expect(output.format).toBe('iife');
    expect(output.entryFileNames).toBe('commons/vendors.dist.js');
    expect(output.inlineDynamicImports).toBe(true);
    expect(output.name).toBeUndefined();
  });

  it('Externalizes nothing - this build bundles the vendors', () => {
    expect(cfg.build.rollupOptions.external).toBeUndefined();
    expect(cfg.build.rollupOptions.output.globals).toBeUndefined();
  });

  it('Provides the virtual module through the pre plugin', () => {
    const plugin = cfg.plugins.find(p => p.name === 'fe-build-vendors-entry');

    expect(plugin).toBeTruthy();
    expect(plugin.resolveId('\0fe-build-vendors-entry')).toBe('\0fe-build-vendors-entry');
    expect(plugin.resolveId('./some/other.js')).toBe(null);
    expect(plugin.load('\0fe-build-vendors-entry')).toContain('import __feVendor0 from "jquery";');
    expect(plugin.load('./some/other.js')).toBe(null);
  });

  it('Mirrors the entry build settings', () => {
    expect(cfg.build.outDir).toBe(config.general.destinationPath);
    expect(cfg.build.emptyOutDir).toBe(false);
    expect(cfg.build.minify).toBe('esbuild');
    expect(cfg.build.sourcemap).toBe(false);
    expect(cfg.root).toBe(config.general.rootPath);
  });
});
