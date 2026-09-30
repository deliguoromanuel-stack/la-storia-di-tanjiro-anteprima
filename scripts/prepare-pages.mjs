import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

const html = await readFile('dist/index.html', 'utf8');
if (!html.includes('/la-storia-di-tanjiro-anteprima/assets/')) {
  throw new Error('Build GitHub Pages mancante o con percorso base errato.');
}
await mkdir('dist/storia', { recursive: true });
await copyFile('dist/index.html', 'dist/storia/index.html');
await copyFile('dist/index.html', 'dist/404.html');
await writeFile('dist/.nojekyll', '');
