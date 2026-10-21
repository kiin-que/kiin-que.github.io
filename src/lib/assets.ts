import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { withBase } from './i18n';

// GitHub Pages lets browsers reuse public/ files for 10 minutes, so a deploy could pair new HTML
// with an old script or stylesheet. A content hash in the URL makes changed files load at once.
const versions = new Map<string, string>();
export function asset(file: string) {
  if (!versions.has(file)) versions.set(file, createHash('sha1').update(readFileSync(join(process.cwd(), 'public', file))).digest('hex').slice(0, 8));
  return withBase(file) + '?v=' + versions.get(file);
}
