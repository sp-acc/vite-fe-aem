import '../quiet.js';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import getClientlib from '../../src/utils/getClientlib.js';

describe('Test utils/getClientlib.js', () => {
  it('Should return from a file location the required info for a clientlib, eg category name, file to import into js.txt etc', () => {
    const fileName = 'component.bundle.js';
    const folder = 'publish/content/component';
    const extension = 'js';
    const location = `${folder}${path.sep}${fileName}`;
    const clientlibNameCategory = 'publish.content.component';
    const clientlib = getClientlib(location);
    expect(clientlib.name).toBe(clientlibNameCategory);
    expect(clientlib.fileName).toBe(fileName);
    expect(clientlib.folder).toBe(folder);
    expect(clientlib.extension).toBe(extension);
  });

  it('Strips a leading projectKey segment and the clientlibs folder from the category, but keeps folder intact', () => {
    const folder = ['batcom', 'base', 'clientlibs', 'author', 'components', 'batcom-agegate'].join(path.sep);
    const location = `${folder}${path.sep}batcom-agegate.bundle.js`;
    const clientlib = getClientlib(location, { projectKey: 'batcom', clientlibsDir: 'clientlibs' });
    // template re-adds projectKey, so name omits it -> batcom.base.author.components.batcom-agegate
    expect(clientlib.name).toBe('base.author.components.batcom-agegate');
    // physical output folder is untouched (that is where .content.xml is written)
    expect(clientlib.folder).toBe(folder);
  });

  it('Keeps a non-projectKey module segment such as brands', () => {
    const folder = ['batcom', 'brands', 'clientlibs', 'corp'].join(path.sep);
    const location = `${folder}${path.sep}corp.bundle.css`;
    const clientlib = getClientlib(location, { projectKey: 'batcom', clientlibsDir: 'clientlibs' });
    expect(clientlib.name).toBe('brands.corp');
  });

  it('Is a no-op when neither the projectKey nor the clientlibs folder appears', () => {
    const folder = ['author', 'components', 'foo'].join(path.sep);
    const location = `${folder}${path.sep}foo.bundle.js`;
    const clientlib = getClientlib(location, { projectKey: 'febuild', clientlibsDir: 'clientlibs' });
    expect(clientlib.name).toBe('author.components.foo');
  });
});
