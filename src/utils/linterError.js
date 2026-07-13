import { log, color } from './log.js';

export default function linterError(lintError, fileError) {
  const location = `${(fileError.source)}:${lintError.line}:${lintError.column} \n`;
  log(import.meta.filename, `
    ${lintError.text}${color('reset', '')}
    ${color('dim', `LintError at ${location}`)}`, '', 'error', true);
}
