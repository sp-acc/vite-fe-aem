import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { describe, it, expect, beforeAll } from 'vitest';

const exec = promisify(execFile);

const ROOT = path.resolve('.');
const BIN = path.join(ROOT, 'bin', 'index.js');
const FIXTURES = path.join(ROOT, 'tests', 'fixtures');
const DIST = path.join(FIXTURES, 'dist');

const TIMEOUT = 120000;

function cleanDist() {
  fs.rmSync(DIST, { recursive: true, force: true });
}

describe('CLI single build via --config-file', () => {
  beforeAll(async () => {
    cleanDist();
    await exec('node', [BIN, '--config-file=tests/fixtures/.febuild'], { cwd: ROOT });
  }, TIMEOUT);

  it('Emits CSS bundles', () => {
    expect(fs.existsSync(path.join(DIST, 'publish/publish.dist.css'))).toBe(true);
    expect(fs.existsSync(path.join(DIST, 'author/author.dist.css'))).toBe(true);
    expect(fs.existsSync(path.join(DIST, 'publish/component/component.dist.css'))).toBe(true);
  });

  it('Emits JS bundles', () => {
    expect(fs.existsSync(path.join(DIST, 'publish/publish.dist.js'))).toBe(true);
    expect(fs.existsSync(path.join(DIST, 'author/author.dist.js'))).toBe(true);
  });

  it('Emits clientlib metadata', () => {
    expect(fs.readFileSync(path.join(DIST, 'publish/js.txt'), 'utf8')).toBe('publish.dist.js');
    expect(fs.readFileSync(path.join(DIST, 'publish/css.txt'), 'utf8')).toBe('publish.dist.css');
    expect(fs.existsSync(path.join(DIST, 'publish/.content.xml'))).toBe(true);
  });
});

describe('CLI single task via --task', () => {
  beforeAll(async () => {
    cleanDist();
    await exec('node', [BIN, '--task=styles', '--config-file=tests/fixtures/.febuild'], { cwd: ROOT });
  }, TIMEOUT);

  it('Runs only the styles task', () => {
    expect(fs.existsSync(path.join(DIST, 'publish/publish.dist.css'))).toBe(true);
    expect(fs.existsSync(path.join(DIST, 'publish/publish.dist.js'))).toBe(false);
    expect(fs.existsSync(path.join(DIST, 'publish/js.txt'))).toBe(false);
  });
});

describe('CLI fe-build task alias --task=webpack', () => {
  beforeAll(async () => {
    cleanDist();
    await exec('node', [BIN, '--task=webpack', '--config-file=tests/fixtures/.febuild'], { cwd: ROOT });
  }, TIMEOUT);

  it('Runs the scripts task instead', () => {
    expect(fs.existsSync(path.join(DIST, 'publish/publish.dist.js'))).toBe(true);
    expect(fs.existsSync(path.join(DIST, 'publish/publish.dist.css'))).toBe(false);
  });
});

describe('CLI unknown task', () => {
  it('Logs an error without crashing', async () => {
    const { stdout, stderr } = await exec('node', [BIN, '--task=nonexistent', '--config-file=tests/fixtures/.febuild'], { cwd: ROOT });
    expect(`${stdout}${stderr}`).toContain('Cannot find task to execute nonexistent');
  }, TIMEOUT);
});

describe('CLI .febuild discovery (no --config-file)', () => {
  let output;

  beforeAll(async () => {
    cleanDist();
    // fixtures contain .febuild, .febuild.js and src/minimal/.febuild(.js);
    // the minimal ones carry a webpack-era babel override that must not crash
    const { stdout, stderr } = await exec('node', [BIN], { cwd: FIXTURES });
    output = `${stdout}${stderr}`;
  }, TIMEOUT);

  it('Discovers and runs the local configurations', () => {
    expect(output).toContain('Found local configurations');
    expect(fs.existsSync(path.join(DIST, 'publish/publish.dist.js'))).toBe(true);
    expect(fs.existsSync(path.join(DIST, 'publish/publish.dist.css'))).toBe(true);
    expect(fs.existsSync(path.join(DIST, 'publish/js.txt'))).toBe(true);
  });

  it('Warns about the ignored babel override instead of failing', () => {
    expect(output).toContain('"babel" is not supported');
  });
});
