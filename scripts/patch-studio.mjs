import { readFile, writeFile } from 'node:fs/promises';
export async function patchStudio() {
  const html = await readFile('vendor/studio/index.html', 'utf8');
  const entry = html.match(/src="\/rhwp\/(assets\/index[^" ]+\.js)"/)[1];
  let code = await readFile(`vendor/studio/${entry}`, 'utf8');
  for (const anchor of ['var $=VA();', 'gA=await hh()', 'var vA=uD(window.location.search)', 'async function Sj()', 'async function hj(', 'window.rhwpStudio=']) {
    if (!code.includes(anchor)) throw Error(`Pinned runtime adapter requires review: ${anchor}`);
  }
  code = code.replace('gA=await hh()', 'gA={disableExternalWebFonts:!0}')
    .replace('var vA=uD(window.location.search)', 'var vA=uD("?chrome=embed")')
    .replace('$.then(()=>{hA&&mD()})', '$.then(()=>{})');
  const adapter = await readFile('media/engine-adapter.js', 'utf8');
  await writeFile('vendor/studio/assets/hanul-runtime.js', code + '\n' + adapter);
  const cssEntry = html.match(/href="\/rhwp\/(assets\/index[^" ]+\.css)"/)[1];
  const css = await readFile(`vendor/studio/${cssEntry}`, 'utf8');
  await writeFile('vendor/studio/assets/hanul-runtime.css', css.replaceAll('/rhwp/images/', '../images/'));
  return entry;
}
