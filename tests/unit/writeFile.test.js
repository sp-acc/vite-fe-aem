import '../quiet.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import writeFile from '../../src/utils/writeFile.js';

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'writeFile-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('Test utils/writeFile.js', () => {
  it('Creates missing directories and writes the file', () => {
    const target = path.join(tmpDir, 'a', 'b', 'file.txt');
    writeFile(target, 'content');
    expect(fs.readFileSync(target, 'utf8')).toBe('content');
  });

  it('Does not override an existing file by default', () => {
    const target = path.join(tmpDir, 'file.txt');
    writeFile(target, 'first');
    writeFile(target, 'second');
    expect(fs.readFileSync(target, 'utf8')).toBe('first');
  });

  it('Overrides an existing file when override is true', () => {
    const target = path.join(tmpDir, 'file.txt');
    writeFile(target, 'first');
    writeFile(target, 'second', true);
    expect(fs.readFileSync(target, 'utf8')).toBe('second');
  });
});
