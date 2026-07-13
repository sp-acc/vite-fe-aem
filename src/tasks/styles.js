import { log } from '../utils/log.js';
import generateEntries from '../utils/generateEntries.js';
import renderStyles from '../utils/renderStyles.js';

// extend log to proper say what file is running
export default async function styles(config) {
  if (config && config.general && config.general.watch) {
    try {
      log(import.meta.filename, 'Watcher Sass / autoprefixer running...', '', 'info');

      const { watch } = await import('chokidar');
      const entries = generateEntries(config, 'scss');

      if (!Object.values(entries).length) {
        log(import.meta.filename, 'No SCSS sources found to watch', '', 'warning');
        return;
      }

      // Build reverse map: absolute src path -> dest key
      const srcToDest = Object.fromEntries(
        Object.entries(entries).map(([dest, src]) => [src, dest])
      );

      const watcher = watch(Object.values(entries), {
        ignoreInitial: true
      });

      config.stylelint.failOnError = false;

      const handleChange = (file) => {
        const destFile = srcToDest[file];
        if (!destFile) return;

        renderStyles(file, destFile, config);
      };

      watcher.on('add', handleChange);
      watcher.on('change', handleChange);
    } catch (e) {
      log(import.meta.filename, 'Failed to start SCSS watcher', e.message, 'error');
    }
  } else {
    log(import.meta.filename, 'Sass / autoprefixer running...', '', 'info');

    const entries = generateEntries(config, 'scss');
    const promises = Object.keys(entries).map(file => renderStyles(entries[file], file, config));
    await Promise.allSettled(promises);
    log(import.meta.filename, 'Styles done', '', 'info');
  }
}
