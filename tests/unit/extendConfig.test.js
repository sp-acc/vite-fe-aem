import '../quiet.js';
import { createRequire } from 'node:module';
import { describe, it, expect } from 'vitest';
import config from '../../src/config/index.js';
import extendConfig from '../../src/utils/extendConfig.js';

const require = createRequire(import.meta.url);
const json = require('../fixtures/.febuild');
const minimal = require('../fixtures/src/minimal/.febuild');
const finalValues = json(config);

describe('Test utils/extendConfig.js', () => {
  it('Should throw an error no .febuild file is found ', () => {
    expect(() => extendConfig('.febuild', config)).toThrowError();
  });

  it('Should find a .febuild file, read and merge into defaults values', () => {
    const newConfig = extendConfig('./tests/fixtures/.febuild', config);
    const reducer = (o, f) => {
      return Object.keys(o).reduce((v, k) => {
        if (typeof o[k] === 'function') return v && true;
        if (typeof o[k] !== 'object' || Array.isArray(o[k])) return v && JSON.stringify(f[k]) === JSON.stringify(o[k]);
        return v && reducer(o[k], f[k]);
      }, true);
    };
    const test = reducer(finalValues, newConfig);
    expect(test).toBe(true);
  });

  it('should work even if no destination path or source paths are configured', () => {
    delete config.general.destinationPath;
    delete config.general.sourcesPath;
    const newConfig = extendConfig('./tests/fixtures/src/minimal/.febuild', config);
    const reducer = (o, f) => {
      return Object.keys(o).reduce((v, k) => {
        if (typeof o[k] === 'function') return v && true;
        if (typeof o[k] !== 'object' || Array.isArray(o[k])) {
          return v && JSON.stringify(f[k]) === JSON.stringify(o[k]);
        }
        return v && reducer(o[k], f[k]);
      }, true);
    };
    const test = reducer(minimal, newConfig);
    expect(test).toBe(true);
  });
});
