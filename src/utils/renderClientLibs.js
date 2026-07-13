import path from 'node:path';
import fs from 'node:fs';
import { log, color } from './log.js';
import writeFile from './writeFile.js';

export default function renderClientLibs(clientLibObject, config) {
  // extract from config
  const { projectKey, destinationPath } = config.general;
  const { name, folder, js, scss } = clientLibObject;
  const { override } = config.clientlibs;
  const { clientlibTemplate } = config.templates;
  const absolutePath = path.join(destinationPath, folder);

  log(import.meta.filename, `checking ${color('cyan', `${projectKey}.${name}`)}`);

  // check if the folder already exist
  if (!fs.existsSync(absolutePath)) {
    log(import.meta.filename, `Folder for ${name} does not exist creating ${folder}`);

    fs.mkdirSync(absolutePath, { recursive: true });

    log(import.meta.filename, `Creating ${color('cyan', `${projectKey}.${name}`)}`);
  }

  // if there is a scss or js we write the css.txt
  // write css.txt
  if (scss) {
    writeFile(path.join(absolutePath, 'css.txt'), `${scss.replace('.scss', '.css')}`, override);
  }

  // write js.txt
  if (js) {
    writeFile(path.join(absolutePath, 'js.txt'), `${js}`, override);
  }

  const extensionFile = config.postcss.extraEntries?.extension;
  const hasExtraEntries = extensionFile && clientLibObject[extensionFile];
  const fileName = clientLibObject[extensionFile];
  if (hasExtraEntries) {
    writeFile(path.join(absolutePath, `${extensionFile}.txt`), `${fileName}`, override);
  }

  // write .content.xml
  const content = clientlibTemplate(name, projectKey);
  writeFile(path.join(absolutePath, '.content.xml'), content, override);
}
