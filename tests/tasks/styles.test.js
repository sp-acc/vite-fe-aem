import '../quiet.js';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, beforeAll, expect } from 'vitest';
import styles from '../../src/tasks/styles.js';
import defaults from '../../src/config/index.js';
import extendConfig from '../../src/utils/extendConfig.js';
import generateEntries from '../../src/utils/generateEntries.js';

const FEBUILD = './tests/fixtures/.febuild';

const config = extendConfig(FEBUILD, defaults);
config.general.disableStyleLint = true;
const entries = {
  ...generateEntries(config, 'scss')
};
const { destinationPath } = config.general;

beforeAll(async () => {
  await styles(config);
});

describe('Test task/styles.js', () => {
  Object.keys(entries).forEach((entry) => {
    const file = path.join(destinationPath, entry);
    const source = entries[entry];
    const ext = path.extname(file) === '.js' ? 'js' : 'css';
    const fileName = `${file.split('.').slice(0, -1).join('.')}.${ext}`;
    it(`Compile ${source} file and save ${entry} at destination folder`, () => {
      const bundleContent = fs.readFileSync(fileName, { encoding: 'utf8', flag: 'r' });
      const sourceContent = fs.readFileSync(source, { encoding: 'utf8', flag: 'r' });
      expect(bundleContent).not.toBe(sourceContent);
    });
  });
});

// ── fileNameDotSuffixesAsDistFolder [fixtures/src-feature-segments → fixtures/dist-feature-segments] ────
const cfgFeatureSegments = extendConfig(FEBUILD, defaults);
cfgFeatureSegments.general.sourcesPath = path.resolve('tests/fixtures/src-feature-segments');
cfgFeatureSegments.general.destinationPath = path.resolve('tests/fixtures/dist-feature-segments');
cfgFeatureSegments.general.fileNameDotSuffixesAsDistFolder = true;
cfgFeatureSegments.general.disableStyleLint = true;
const entriesFeatureSegments = generateEntries(cfgFeatureSegments, 'scss');

describe('styles with fileNameDotSuffixesAsDistFolder [fixtures/src-feature-segments]', () => {
  beforeAll(async () => {
    await styles(cfgFeatureSegments);
  });

  Object.keys(entriesFeatureSegments).forEach((entry) => {
    const file = path.join(cfgFeatureSegments.general.destinationPath, entry);
    const source = entriesFeatureSegments[entry];
    const ext = path.extname(file) === '.js' ? 'js' : 'css';
    const fileName = `${file.split('.').slice(0, -1).join('.')}.${ext}`;
    it(`Compile ${source} file and save ${entry} at destination folder`, () => {
      const bundleContent = fs.readFileSync(fileName, { encoding: 'utf8', flag: 'r' });
      const sourceContent = fs.readFileSync(source, { encoding: 'utf8', flag: 'r' });
      expect(bundleContent).not.toBe(sourceContent);
    });
  });
});

// ── Array sourceKey + sourceKeyAsDistFolder [fixtures/src-multi-sourcekey → fixtures/dist-multi-sourcekey] ──
const cfgMultiSourcekey = extendConfig(FEBUILD, defaults);
cfgMultiSourcekey.general.sourcesPath = path.resolve('tests/fixtures/src-multi-sourcekey');
cfgMultiSourcekey.general.destinationPath = path.resolve('tests/fixtures/dist-multi-sourcekey');
cfgMultiSourcekey.general.sourceKey = ['src', 'authorlibs', 'publishlibs'];
cfgMultiSourcekey.general.sourceKeyAsDistFolder = true;
cfgMultiSourcekey.general.disableStyleLint = true;
const entriesMultiSourcekey = generateEntries(cfgMultiSourcekey, 'scss');

describe('styles with array sourceKey + sourceKeyAsDistFolder [fixtures/src-multi-sourcekey]', () => {
  beforeAll(async () => {
    await styles(cfgMultiSourcekey);
  });

  Object.keys(entriesMultiSourcekey).forEach((entry) => {
    const file = path.join(cfgMultiSourcekey.general.destinationPath, entry);
    const source = entriesMultiSourcekey[entry];
    const ext = path.extname(file) === '.js' ? 'js' : 'css';
    const fileName = `${file.split('.').slice(0, -1).join('.')}.${ext}`;
    it(`Compile ${source} file and save ${entry} at destination folder`, () => {
      const bundleContent = fs.readFileSync(fileName, { encoding: 'utf8', flag: 'r' });
      const sourceContent = fs.readFileSync(source, { encoding: 'utf8', flag: 'r' });
      expect(bundleContent).not.toBe(sourceContent);
    });
  });
});
