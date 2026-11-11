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

// -- category derivation: default 'fe-build' reproduces webpack categories
// byte-for-byte, including the projectKey duplication quirk
const cfgCategory = extendConfig(FEBUILD, defaults);
cfgCategory.general.sourcesPath = path.resolve('tests/fixtures/src-category');
cfgCategory.general.destinationPath = path.resolve('tests/fixtures/dist-category');

describe('clientlibs category derivation defaults to fe-build', () => {
  beforeAll(async () => {
    await clientlibTask(cfgCategory);
  });

  const contentXml = path.join(cfgCategory.general.destinationPath, 'febuild', 'base', 'clientlibs', 'author', 'components', 'hero', '.content.xml');

  it('Emits .content.xml in the physical output folder', () => {
    expect(fs.existsSync(contentXml)).toBe(true);
  });

  it('Category matches fe-build byte-for-byte (projectKey duplication kept)', () => {
    const content = fs.readFileSync(contentXml, 'utf8');
    expect(content).toContain('categories="[febuild.febuild.base.clientlibs.author.components.hero]"');
  });

  it('js.txt / css.txt point at the bundle regardless of derivation', () => {
    const dir = path.dirname(contentXml);
    expect(fs.readFileSync(path.join(dir, 'js.txt'), 'utf8')).toBe('hero.dist.js');
    expect(fs.readFileSync(path.join(dir, 'css.txt'), 'utf8')).toBe('hero.dist.css');
  });
});

// -- opt-in clean derivation strips projectKey and clientlibs segments
const cfgCategoryClean = extendConfig(FEBUILD, defaults);
cfgCategoryClean.general.sourcesPath = path.resolve('tests/fixtures/src-category');
cfgCategoryClean.general.destinationPath = path.resolve('tests/fixtures/dist-category-clean');
cfgCategoryClean.clientlibs.categoryDerivation = 'clean';

describe('clientlibs categoryDerivation clean', () => {
  beforeAll(async () => {
    await clientlibTask(cfgCategoryClean);
  });

  it('Strips the leading projectKey and the clientlibs folder from the category', () => {
    const contentXml = path.join(cfgCategoryClean.general.destinationPath, 'febuild', 'base', 'clientlibs', 'author', 'components', 'hero', '.content.xml');
    const content = fs.readFileSync(contentXml, 'utf8');
    expect(content).toContain('categories="[febuild.base.author.components.hero]"');
  });
});

// -- clientlibs.vendors: metadata for the shared vendors clientlib.
// The scripts task builds commons/vendors.dist.js; the clientlibs task renders
// its .content.xml (explicit category, not folder-derived) and js.txt.
const cfgVendors = extendConfig(FEBUILD, defaults);
cfgVendors.general.sourcesPath = path.resolve('tests/fixtures/src-vendors');
cfgVendors.general.destinationPath = path.resolve('tests/fixtures/dist-vendors-clientlibs');
cfgVendors.clientlibs.vendors = { modules: { jquery: 'jQuery' } };

describe('clientlibs with clientlibs.vendors', () => {
  beforeAll(async () => {
    await clientlibTask(cfgVendors);
  });

  const commonsDir = path.join(cfgVendors.general.destinationPath, 'commons');

  it('Renders .content.xml with the projectKey-prefixed category', () => {
    const content = fs.readFileSync(path.join(commonsDir, '.content.xml'), 'utf8');
    expect(content).toContain('categories="[febuild.commons]"');
  });

  it('js.txt points at the vendors bundle', () => {
    expect(fs.readFileSync(path.join(commonsDir, 'js.txt'), 'utf8')).toBe('vendors.dist.js');
  });

  it('Honors an explicit category', async () => {
    const cfgCustom = extendConfig(FEBUILD, defaults);
    cfgCustom.general.sourcesPath = path.resolve('tests/fixtures/src-vendors');
    cfgCustom.general.destinationPath = path.resolve('tests/fixtures/dist-vendors-clientlibs-custom');
    cfgCustom.clientlibs.vendors = { modules: { jquery: 'jQuery' }, category: 'sharedlibs' };
    await clientlibTask(cfgCustom);

    const content = fs.readFileSync(
      path.join(cfgCustom.general.destinationPath, 'commons', '.content.xml'),
      'utf8'
    );
    expect(content).toContain('categories="[febuild.sharedlibs]"');
  });
});

// -- clientlibs.vendors folder collision with an entry clientlib folder is warned about
const cfgVendorsCollision = extendConfig(FEBUILD, defaults);
cfgVendorsCollision.general.sourcesPath = path.resolve('tests/fixtures/src-vendors');
cfgVendorsCollision.general.destinationPath = path.resolve('tests/fixtures/dist-vendors-collision');
// the fixture entry lives in app/, so point the vendors clientlib there
cfgVendorsCollision.clientlibs.vendors = { modules: { jquery: 'jQuery' }, output: 'app/vendors.dist.js' };

describe('clientlibs.vendors output folder collision', () => {
  beforeAll(async () => {
    await clientlibTask(cfgVendorsCollision);
  });

  it('Skips the vendors metadata and keeps the entry clientlib intact', () => {
    const base = cfgVendorsCollision.general.destinationPath;
    // entry metadata for app/ still there…
    expect(fs.readFileSync(path.join(base, 'app', 'js.txt'), 'utf8')).toBe('app.dist.js');
    // …and no vendors js.txt overwrote it (only one js.txt for the folder)
    expect(fs.readdirSync(path.join(base, 'app')).filter(f => f === '.content.xml').length).toBe(1);
    expect(fs.readFileSync(path.join(base, 'app', '.content.xml'), 'utf8'))
      .toContain('categories="[febuild.app]"');
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
