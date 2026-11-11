import '../quiet.js';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { parseVendorsConfig, mergeVendorsExternals } from '../../src/utils/vendorsConfig.js';

const config = bundleKey => ({ general: { bundleKey }, clientlibs: {} });

describe('parseVendorsConfig', () => {
  it('Returns null when vendors is not configured', () => {
    expect(parseVendorsConfig({ general: {}, clientlibs: {} })).toBe(null);
    expect(parseVendorsConfig({ general: {} })).toBe(null);
  });

  it('Applies the fe-build-compatible defaults', () => {
    const parsed = parseVendorsConfig({ general: { bundleKey: 'dist' }, clientlibs: { vendors: { modules: { jquery: 'jQuery' } } } });
    expect(parsed).toEqual({
      modules: { jquery: 'jQuery' },
      category: 'commons',
      output: path.join('commons', 'vendors.dist.js'),
    });
  });

  it('Honors explicit category and output', () => {
    const parsed = parseVendorsConfig({
      general: { bundleKey: 'dist' },
      clientlibs: { vendors: { modules: { jquery: 'jQuery' }, category: 'sharedlibs', output: 'vendor/shared.bundle.js' } },
    });
    expect(parsed.category).toBe('sharedlibs');
    expect(parsed.output).toBe('vendor/shared.bundle.js');
  });

  it('Rejects invalid shapes with null', () => {
    const invalid = [
      true,
      'jquery',
      {},
      { modules: null },
      { modules: {} },
      { modules: ['jquery'] },
      { modules: { jquery: 42 } },
      { modules: { '': 'jQuery' } },
      { modules: { jquery: '' } },
    ];

    invalid.forEach((vendors) => {
      expect(parseVendorsConfig({ general: { bundleKey: 'dist' }, clientlibs: { vendors } })).toBe(null);
    });
  });
});

describe('mergeVendorsExternals', () => {
  it('Returns the vendors modules on an empty externals map', () => {
    expect(mergeVendorsExternals({}, { jquery: 'jQuery' })).toEqual({ jquery: 'jQuery' });
  });

  it('Unions externals and vendors modules', () => {
    expect(mergeVendorsExternals({ lodash: '_' }, { jquery: 'jQuery' })).toEqual({ lodash: '_', jquery: 'jQuery' });
  });

  it('Vendors mapping wins on conflicting globals', () => {
    expect(mergeVendorsExternals({ jquery: '$' }, { jquery: 'jQuery' })).toEqual({ jquery: 'jQuery' });
  });
});
