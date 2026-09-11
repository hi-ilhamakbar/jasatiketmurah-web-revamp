import { cp, rm, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const source = resolve('src');
const output = resolve('dist');
await rm(output, { recursive: true, force: true });
await cp(source, output, { recursive: true });
const htmlFiles = async directory => {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? htmlFiles(resolve(directory, entry.name)) : entry.name.endsWith('.html') ? [resolve(directory, entry.name)] : []))).flat();
};
const assetVersion = createHash('sha256').update(await readFile(resolve(output, 'script.js'))).update(await readFile(resolve(output, 'i18n/translations.js'))).update(await readFile(resolve(output, 'styles.css'))).digest('hex').slice(0, 12);
const fallbackHeader = '<div id="site-header"><header class="site-header"><a class="brand" href="/"><img src="/assets/logo.png" alt="Jasa Tiket Murah"></a><nav class="main-nav"><a href="/">Beranda</a><a href="/inspiration/">Inspirasi</a><a href="/about/">Tentang kami</a><a href="/contact/">Hubungi kami</a></nav></header></div>';
for (const file of await htmlFiles(output)) {
  const html = await readFile(file, 'utf8');
  const withHeader = html.replace('<div id="site-header"></div>', fallbackHeader);
  const withTranslations = withHeader.replace(/(<script src=["']\/?script\.js["']><\/script>)/, `<script src="/i18n/translations.js?v=${assetVersion}"></script><script src="/script.js?v=${assetVersion}"></script>`);
  const updated = withTranslations.replace(/href=["']\/?styles\.css["']/g, `href="/styles.css?v=${assetVersion}"`);
  if (updated !== html) await writeFile(file, updated);
}
console.log('Static site built to dist.');
