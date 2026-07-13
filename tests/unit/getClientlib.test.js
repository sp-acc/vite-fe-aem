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
});
