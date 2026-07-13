import '../quiet.js';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, beforeAll, expect } from 'vitest';
import clientlibTask from '../../src/tasks/clientlibs.js';
import defaults from '../../src/config/index.js';
import extendConfig from '../../src/utils/extendConfig.js';
import generateEntries from '../../src/utils/generateEntries.js';
import getClientlib from '../../src/utils/getClientlib.js';

const FEBUILD = './tests/fixtures/.febuild';

const config = extendConfig(FEBUILD, defaults);
const entries = {
  ...generateEntries(config),
  ...generateEntries(config, 'scss')
};
const { destinationPath, projectKey } = config.general;
const { clientlibTemplate } = config.templates;

beforeAll(async () => {
  await clientlibTask(config);
});

describe('Test task/clientlibs.js', () => {
  Object.keys(entries).forEach((entry) => {
    const file = path.join(destinationPath, entry);
    const type = path.extname(file);
    const dir = path.dirname(file);
    const { name, fileName } = getClientlib(entry);
    const ext = type == '.js' ? 'js' : 'css';
    const txtContet = `${fileName.split('.').slice(0, -1).join('.')}.${ext}`;
    const txtPath = path.join(dir, `${ext}.txt`);

    it(`TXT files should be created and point to ${entry} file`, () => {
      const fileContent = fs.readFileSync(txtPath, { encoding: 'utf8', flag: 'r' });
      expect(fileContent).toBe(txtContet);
    });

    it(`Should create .content.xml files with it's category "${name}" based on template`, () => {
      const template = clientlibTemplate(name, projectKey);
      const fileContent = fs.readFileSync(path.join(dir, '.content.xml'), { encoding: 'utf8', flag: 'r' });
      expect(fileContent).toBe(template);
    });
  });
});

// -- fileNameDotSuffixesAsDistFolder [fixtures/src-feature-segments -> fixtures/dist-feature-segments]
const cfgFeatureSegments = extendConfig(FEBUILD, defaults);
cfgFeatureSegments.general.sourcesPath = path.resolve('tests/fixtures/src-feature-segments');
cfgFeatureSegments.general.destinationPath = path.resolve('tests/fixtures/dist-feature-segments');
cfgFeatureSegments.general.fileNameDotSuffixesAsDistFolder = true;
const entriesFeatureSegments = {
  ...generateEntries(cfgFeatureSegments),
  ...generateEntries(cfgFeatureSegments, 'scss'),
};

describe('clientlibs with fileNameDotSuffixesAsDistFolder [fixtures/src-feature-segments]', () => {
  beforeAll(async () => {
    await clientlibTask(cfgFeatureSegments);
  });

  Object.keys(entriesFeatureSegments).forEach((entry) => {
    const file = path.join(cfgFeatureSegments.general.destinationPath, entry);
    const type = path.extname(file);
    const dir = path.dirname(file);
    const { name, fileName } = getClientlib(entry);
    const ext = type == '.js' ? 'js' : 'css';
    const txtContet = `${fileName.split('.').slice(0, -1).join('.')}.${ext}`;
    const txtPath = path.join(dir, `${ext}.txt`);

    it(`TXT files should be created and point to ${entry} file`, () => {
      const fileContent = fs.readFileSync(txtPath, { encoding: 'utf8', flag: 'r' });
      expect(fileContent).toBe(txtContet);
    });

    it(`Should create .content.xml files with its category "${name}" based on template`, () => {
      const template = config.templates.clientlibTemplate(name, cfgFeatureSegments.general.projectKey);
      const fileContent = fs.readFileSync(path.join(dir, '.content.xml'), { encoding: 'utf8', flag: 'r' });
      expect(fileContent).toBe(template);
    });
  });
});

// -- Array sourceKey + sourceKeyAsDistFolder [fixtures/src-multi-sourcekey -> fixtures/dist-multi-sourcekey]
const cfgMultiSourcekey = extendConfig(FEBUILD, defaults);
cfgMultiSourcekey.general.sourcesPath = path.resolve('tests/fixtures/src-multi-sourcekey');
cfgMultiSourcekey.general.destinationPath = path.resolve('tests/fixtures/dist-multi-sourcekey');
cfgMultiSourcekey.general.sourceKey = ['src', 'authorlibs', 'publishlibs'];
cfgMultiSourcekey.general.sourceKeyAsDistFolder = true;
const entriesMultiSourcekey = {
  ...generateEntries(cfgMultiSourcekey),
  ...generateEntries(cfgMultiSourcekey, 'scss'),
};

describe('clientlibs with array sourceKey + sourceKeyAsDistFolder [fixtures/src-multi-sourcekey]', () => {
  beforeAll(async () => {
    await clientlibTask(cfgMultiSourcekey);
  });

  Object.keys(entriesMultiSourcekey).forEach((entry) => {
    const file = path.join(cfgMultiSourcekey.general.destinationPath, entry);
    const type = path.extname(file);
    const dir = path.dirname(file);
    const { name, fileName } = getClientlib(entry);
    const ext = type == '.js' ? 'js' : 'css';
    const txtContet = `${fileName.split('.').slice(0, -1).join('.')}.${ext}`;
    const txtPath = path.join(dir, `${ext}.txt`);

    it(`TXT files should be created and point to ${entry} file`, () => {
      const fileContent = fs.readFileSync(txtPath, { encoding: 'utf8', flag: 'r' });
      expect(fileContent).toBe(txtContet);
    });

    it(`Should create .content.xml files with its category "${name}" based on template`, () => {
      const template = config.templates.clientlibTemplate(name, cfgMultiSourcekey.general.projectKey);
      const fileContent = fs.readFileSync(path.join(dir, '.content.xml'), { encoding: 'utf8', flag: 'r' });
      expect(fileContent).toBe(template);
    });
  });
});

// -- generateSplitChunksClientlibs is accepted but a no-op (vite bundles are self-contained)
const cfgSplitChunks = extendConfig(FEBUILD, defaults);
cfgSplitChunks.general.destinationPath = path.resolve('tests/fixtures/dist-splitchunks');
cfgSplitChunks.clientlibs.generateSplitChunksClientlibs = true;
// a webpack-era optimization override that fe-build would have turned into commons clientlibs
cfgSplitChunks.optimization = {
  runtimeChunk: { name: 'commons/treeshaking/treeshaking.bundle.js' },
  splitChunks: {
    cacheGroups: {
      vendors: { name: 'commons/vendors/vendors.bundle.js' },
    },
  },
};

describe('generateSplitChunksClientlibs is a warn/no-op', () => {
  beforeAll(async () => {
    await clientlibTask(cfgSplitChunks);
  });

  it('No commons/ clientlib metadata is generated from optimization config', () => {
    const base = cfgSplitChunks.general.destinationPath;
    expect(fs.existsSync(path.join(base, 'commons'))).toBe(false);
  });

  it('Source-entry clientlibs are still generated normally', () => {
    const txtPath = path.join(cfgSplitChunks.general.destinationPath, 'author', 'js.txt');
    const content = fs.readFileSync(txtPath, { encoding: 'utf8', flag: 'r' });
    expect(content).toBe('author.dist.js');
  });
});
