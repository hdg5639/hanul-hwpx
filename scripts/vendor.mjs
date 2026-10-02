import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
const origin = 'https://edwardkim.github.io';
const upstream = 'https://github.com/edwardkim/rhwp';
const root = 'vendor/studio';
const manifest = { upstream, downloadedAt: new Date().toISOString(), files: {} };
let existing;
try { existing = JSON.parse(await readFile('vendor/runtime-manifest.json', 'utf8')); } catch {}
async function download(path, url = origin + '/rhwp/' + path) {
  const response = await fetch(url);
  if (!response.ok) throw Error(`${response.status}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (existing?.files[path] && existing.files[path].sha256 !== sha256) throw Error(`Upstream changed: ${path}. Existing manifest retained; update vendor explicitly.`);
  await mkdir(dirname(`${root}/${path}`), { recursive: true });
  await writeFile(`${root}/${path}`, bytes);
  manifest.files[path] = { url, sha256, bytes: bytes.length };
  return bytes.toString('utf8');
}
const html = await download('index.html');
for (const path of ['images/icon_small_ko.svg', 'images/icon_small_ko_dark.svg']) await download(path);
const queue = [...html.matchAll(/(?:src|href)="\/rhwp\/([^"?]+\.(?:js|css))"/g)].map(m => m[1]).filter(p => !p.includes('registerSW'));
const done = new Set();
while (queue.length) {
  const path = queue.shift();
  if (done.has(path)) continue;
  done.add(path);
  const code = await download(path);
  for (const match of code.matchAll(/(?:\/rhwp\/assets\/|\.\/)([A-Za-z0-9_-]+\.(?:js|wasm))/g)) {
    const child = `assets/${match[1]}`;
    if (!child.endsWith('rhwp_bg.js')) queue.push(child);
  }
  // Dynamic chunks refer to their own fonts and WASM. Non-code files aren't scanned.
}
const tree = await (await fetch('https://api.github.com/repos/edwardkim/rhwp/git/trees/main?recursive=1')).json();
manifest.upstreamCommit = tree.sha;
const fonts = tree.tree.filter(f => f.type === 'blob' && f.path.startsWith('assets/fonts/') && /\.(woff2|txt|md)$/.test(f.path));
for (let i = 0; i < fonts.length; i += 6) await Promise.all(fonts.slice(i, i + 6).map(f => download(f.path.replace('assets/', ''), `https://raw.githubusercontent.com/edwardkim/rhwp/${tree.sha}/${f.path}`)));
for (const path of ['LICENSE', 'THIRD_PARTY_LICENSES.md']) await download(path, `https://raw.githubusercontent.com/edwardkim/rhwp/${tree.sha}/${path}`);
await writeFile('vendor/runtime-manifest.json', JSON.stringify(manifest, null, 2));
console.log(`Vendored ${Object.keys(manifest.files).length} local resources.`);
