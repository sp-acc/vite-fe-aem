import '../quiet.js';
import { describe, it, expect, vi } from 'vitest';
import linterError from '../../src/utils/linterError.js';

describe('Test utils/linterError.js', () => {
  it('Check formating of a error send to console log', () => {
    const source = import.meta.filename;
    const line = 12;
    const column = 10;
    const text = 'my error';
    console.error = vi.fn();
    linterError({ line, column, text }, { source });
    const output = console.error.mock.calls[0][0].replaceAll(source, '<source>');
    expect(output).toMatchSnapshot();
  });
});
