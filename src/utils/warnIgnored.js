import { log } from './log.js';

const warned = new Set();

// fe-build compatibility: warn once per option about webpack-era settings
// that are accepted in .febuild files but have no effect in the vite build
export default function warnIgnored(option, reason) {
  if (warned.has(option)) return;
  warned.add(option);
  log(false, `"${option}" is not supported by vite-aem-fe-build and is ignored`, ` - ${reason}`, 'warning');
}
