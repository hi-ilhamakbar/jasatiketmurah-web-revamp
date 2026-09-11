import { cp, rm, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('src');
const output = resolve('dist');
await rm(output, { recursive: true, force: true });
await cp(source, output, { recursive: true });
const htmlFiles = async directory => {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? htmlFiles(resolve(directory, entry.name)) : entry.name.endsWith('.html') ? [resolve(directory, entry.name)] : []))).flat();
};
for (const file of await htmlFiles(output)) {
  const html = await readFile(file, 'utf8');
  const updated = html.replace(/(<script src=["']\/?script\.js["']><\/script>)/, '<script src="/i18n/translations.js"></script>$1');
  if (updated !== html) await writeFile(file, updated);
}
console.log('Static site built to dist.');
