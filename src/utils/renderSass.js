import fs from 'node:fs';
import path from 'node:path';
import * as sass from 'sass';
import writeFile from './writeFile.js';
import { log } from './log.js';

export default function renderSass(dest, file, config, cb, write = false) {
  // extract sass only configs
  const { outputStyle, includePaths, failOnError, adicionalOptions } = config.sass;

  // proper extension
  const destFile = dest.replace('.scss', '.css');

  // url of the saved file
  const outFile = path.join(config.general.destinationPath, destFile);

  // extract from config
  const compiled = sass.compileAsync(file, {
    outputStyle,
    loadPaths: includePaths,
    sourceMap: !config.general.isProduction,
    // adicional config from https://sass-lang.com/documentation/js-api/interfaces/options/
    ...adicionalOptions
  });

  compiled.then((result) => {
    // create folder if it does not exist
    fs.mkdirSync(path.dirname(outFile), { recursive: true });

    // write the css file, overriding it if write is enabled
    // its better to skip this so we only write the css once reducing I/O
    if (write) {
      writeFile(outFile, result.css, true);
    }

    // if is dev add source maps
    if (!config.general.isProduction && write) {
      writeFile(`${outFile}.map`, JSON.stringify(result.sourceMap), true);
    }

    // pass the destination relative for map
    result.destFile = destFile;

    // log and call back
    log(import.meta.filename, `Sass rendered - ${path.basename(destFile)}`, ` -- `, 'success');
    return cb(result, outFile);
  }).catch((error) => {
    log(import.meta.filename, `${destFile} ${error.message}!`, '', 'error');
    // if set to exit on error, you might not want to exit on all cases
    if (failOnError) {
      process.exit(1);
    } else {
      log(import.meta.filename, `Sass file not rendered - ${path.basename(destFile)}`, ``, 'error');
    }
  });
}
