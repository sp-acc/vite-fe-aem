import '../quiet.js';
import { describe, it, expect } from 'vitest';
import getPlugins from '../../src/utils/getPlugins.js';

// unlike the jest original this uses the real autoprefixer module,
// since vi.mock cannot intercept createRequire-based CJS loading
describe('Test getPlugins.js', () => {
  it('Should load a plugin from string', () => {
    const result = getPlugins(['autoprefixer']);

    expect(result).toHaveLength(1);
    expect(typeof result[0]).toBe('function');
    expect(result[0].postcss).toBe(true);
  });

  it('Should load a plugin from [plugin, options] format', () => {
    const result = getPlugins([['autoprefixer', { grid: 'autoplace' }]]);

    expect(result).toHaveLength(1);
    expect(result[0].postcssPlugin).toBe('autoprefixer');
  });

  it('Should ignore falsy values in plugin list', () => {
    const result = getPlugins([null, undefined, false, 'autoprefixer']);

    expect(result).toHaveLength(1);
  });

  it('Should throw on invalid plugin entry', () => {
    const invalidPlugins = [{ foo: 'bar' }, 123, true];
    invalidPlugins.forEach(plugin => {
      expect(() => getPlugins([plugin])).toThrow('Invalid plugin entry');
    });
  });
});
