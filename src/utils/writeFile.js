import fs from 'node:fs';
import path from 'node:path';
import { log } from './log.js';

export default function writeFile(filepath, content, override = false) {
  const normalizePath = path.normalize(filepath);
  // if is not set to not override
  if (!override && fs.existsSync(normalizePath)) return;
  const dir = path.dirname(normalizePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    fs.writeFileSync(normalizePath, content);
  } catch (err) {
    log(import.meta.filename, `could not write file: ${err.message}`, `\n ${normalizePath}`, 'error');
    return;
  }

  log(import.meta.filename, `write file...${normalizePath}`, '', 'info');
}
