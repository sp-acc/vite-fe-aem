import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, afterAll } from 'vitest';
import viteResolveModulesPlugin from '../../src/utils/viteResolveModulesPlugin.js';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fe-resolve-modules-'));
fs.mkdirSync(path.join(tmp, 'components'), { recursive: true });
fs.mkdirSync(path.join(tmp, 'widgets', 'no-index'), { recursive: true });
fs.writeFileSync(path.join(tmp, 'components', 'foo.js'), 'export const foo = 1;');
fs.writeFileSync(path.join(tmp, 'bare'), 'x');
fs.writeFileSync(path.join(tmp, 'widgets', 'no-index', 'other.js'), 'export const x = 1;');

const plugin = viteResolveModulesPlugin([tmp]);
const resolveId = source => plugin.resolveId(source);

afterAll(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('viteResolveModulesPlugin', () => {
  it('Resolves a dir-relative path that includes the extension', () => {
    expect(resolveId('components/foo.js')).toBe(path.join(tmp, 'components', 'foo.js'));
  });

  it('Appends .js when the extension is omitted', () => {
    expect(resolveId('components/foo')).toBe(path.join(tmp, 'components', 'foo.js'));
  });

  it('Resolves an extensionless file by exact name', () => {
    expect(resolveId('bare')).toBe(path.join(tmp, 'bare'));
  });

  it('Returns null for misses so vite resolution proceeds', () => {
    expect(resolveId('nope/nothing')).toBeNull();
  });

  it('Returns null when a dir exists but has no index.js', () => {
    expect(resolveId('widgets/no-index')).toBeNull();
  });

  it('Returns null for relative and absolute sources', () => {
    expect(resolveId('./components/foo.js')).toBeNull();
    expect(resolveId(path.join(tmp, 'widget.js'))).toBeNull();
  });
});
