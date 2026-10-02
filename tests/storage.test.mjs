import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { zipSync, strToU8 } from 'fflate';
import { atomicSave, digest, validateBytes } from '../dist/storage.mjs';
test('atomic save preserves original backup and refuses external changes', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'hanul-test-'));
  try {
    const path = join(folder, '문서.hwpx');
    const initial = Buffer.from('original'); const edited = Buffer.from('edited');
    await writeFile(path, initial);
    await atomicSave(path, edited, digest(initial));
    assert.equal((await readFile(path)).toString(), 'edited');
    assert.equal((await readFile(path + '.hanul-backup')).toString(), 'original');
    await writeFile(path, 'external');
    await assert.rejects(atomicSave(path, Buffer.from('overwrite'), digest(edited)), /외부/);
    assert.equal((await readFile(path)).toString(), 'external');
    assert.equal((await readdir(folder)).filter(f => f.endsWith('.tmp')).length, 0);
  } finally { await rm(folder, { recursive: true }); }
});
test('HWPX validator rejects missing parts and malformed XML', () => {
  assert.throws(() => validateBytes(zipSync({ 'mimetype': strToU8('application/hwp+zip') }), 'hwpx'), /필수/);
  const entries = { mimetype: strToU8('application/hwp+zip'), 'Contents/header.xml': strToU8('<header/>'), 'Contents/content.hpf': strToU8('<package/>'), 'Contents/section0.xml': strToU8('<section><broken></section>') };
  assert.throws(() => validateBytes(zipSync(entries), 'hwpx'));
  entries['Contents/section0.xml'] = strToU8('<section/>');
  assert.doesNotThrow(() => validateBytes(zipSync(entries), 'hwpx'));
  entries['Contents/section0.xml'] = strToU8('<!DOCTYPE section [<!ENTITY bad SYSTEM "file:///x">]><section/>');
  assert.throws(() => validateBytes(zipSync(entries), 'hwpx'), /엔티티/);
});
