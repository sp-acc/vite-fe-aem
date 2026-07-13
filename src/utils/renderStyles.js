import renderSass from './renderSass.js';
import renderPostcss from './renderPostcss.js';
import runStylelint from './runStylelint.js';
import writeFile from './writeFile.js';

export default async function renderStyles(file, dest, config) {
  return new Promise((resolve) => {
    runStylelint(
      [file], config, () =>
        renderSass(
          dest, file, config, (result, outFile) =>
            renderPostcss(
              result, outFile, config, postCssResult => {
                // only write file at the end
                writeFile(outFile, postCssResult.css, true);
                resolve();
              }
            )
        )
    );
  });
}
