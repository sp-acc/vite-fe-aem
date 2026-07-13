import postcss from 'postcss';
import { log } from './log.js';
import getPlugins from './getPlugins.js';

export default function renderPostcss(input, outFile, config, cb) {
  const { plugins, failOnError } = config.postcss;

  try {
    // try to dynamic load of postcss plugins
    const runPlugins = getPlugins(plugins);
    const map = config.general.isProduction ? false : { inline: true, prev: input.sourceMap };

    // run postcss plugins at sass output
    postcss(runPlugins).process(input.css.toString(), { from: outFile, map })
      .then((result) => {
        // check all warnings
        const warns = result.warnings();

        if (warns && warns.length > 0) {
          // log warnings
          return result.warnings().forEach((warn) => {
            log(import.meta.filename, 'error', warn.toString(), 'error');
            // exit if fail on error is defined
            if (failOnError) {
              process.exit(1);
            }
          });
        }

        // success and return
        log(import.meta.filename,
          `PostCSS applied: ${plugins.map(ent => (Array.isArray(ent) ? ent[0] : ent)).join(', ')}`,
          input.destFile,
          'success');

        return cb(result);
      });
  } catch (error) {
    log(import.meta.filename, 'Postcss error', error.message, 'error');
    // exit if fail on error is defined
    if (failOnError) {
      process.exit(1);
    }
  }
}
