import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { log, color } from './log.js';
import warnIgnored from './warnIgnored.js';

const require = createRequire(import.meta.url);

// fe-build task names that map to a different task here
const TASK_ALIASES = {
  webpack: 'scripts',
};

async function loadBuiltinTask(taskName) {
  const name = TASK_ALIASES[taskName] || taskName;

  if (TASK_ALIASES[taskName]) {
    warnIgnored(`task "${taskName}"`, `running the "${name}" task instead`);
  }

  const module = await import(`../tasks/${name}.js`);
  return module.default;
}

async function loadExternalTask(taskPath) {
  // external tasks may be ESM or CJS scripts of the consumer project
  const absPath = path.resolve(taskPath);

  try {
    const module = await import(pathToFileURL(absPath).href);
    return module.default;
  } catch {
    return require(absPath);
  }
}

export default async function taskVerification(configuration) {
  log(import.meta.filename, `Tasks started with mode - ${color('green', configuration.general.mode)}`);

  if (configuration && configuration.general && configuration.general.task) {
    let execute;

    try {
      execute = await loadBuiltinTask(configuration.general.task);
    } catch (e) {
      log(import.meta.filename, e.message, '', 'info');

      try {
        // try as a abs path script (external tasks) project scripts and share config
        execute = await loadExternalTask(configuration.general.task);
      } catch {
        log(import.meta.filename, `Cannot find task to execute ${configuration.general.task}`, '', 'error');
        return;
      }
    }

    await execute(configuration);
  } else {
    // unlike fe-build's setTimeout fan-out, tasks run sequentially so build
    // failures produce deterministic exit codes
    for (const taskName of configuration.general.defaultTasks) {
      const task = await loadBuiltinTask(taskName);
      await task(configuration);
    }
  }
}
