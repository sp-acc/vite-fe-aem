import { describe, it, expect, vi } from 'vitest';
import { severity, log } from '../../src/utils/log.js';

describe('Test utils/log.js', () => {
  Object.keys(severity).forEach((severetyName) => {
    it(`Check formating of each error severety send to console log [${severetyName}]`, () => {
      const fn = severetyName === 'error' ? severetyName : 'log';
      const file = import.meta.filename;
      const title = 'My error';
      const extra = 'Extra error information';
      console[fn] = vi.fn();
      log(file, title, extra, severetyName);
      expect(console[fn].mock.calls[0][0]).toMatchSnapshot();
    });
  });
});
