import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { URL, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import process from 'node:process';
import console from 'node:console';

const archives = process.argv.slice(2);
assert.equal(archives.length, 2, 'Usage: node scripts/verify-packed-adapters.mjs HELIX.tgz REAGENT.tgz');
const root = path.resolve(new URL('..', import.meta.url).pathname);
const require = createRequire(path.join(root, 'package.json'));
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'uxx-packed-consumer-'));
const result = [];
try {
  const modules = path.join(temporary, 'node_modules');
  fs.mkdirSync(path.join(modules, '@open-hax'), { recursive: true });
  fs.writeFileSync(path.join(temporary, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  fs.symlinkSync(root, path.join(modules, '@open-hax/uxx'), 'dir');
  for (const peer of ['react', 'react-dom', 'scheduler']) {
    fs.symlinkSync(path.dirname(require.resolve(peer + '/package.json')), path.join(modules, peer), 'dir');
  }
  const canonicalReact = require.resolve('react');
  for (const [index, adapter] of ['helix', 'reagent'].entries()) {
    const archive = path.resolve(archives[index]);
    const entries = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' }).trim().split('\n');
    for (const entry of entries) {
      assert.ok(entry.startsWith('package/'), 'Archive entry outside package/: ' + entry);
      assert.ok(!entry.split('/').some(segment => ['..', '.shadow-cljs', 'node_modules', '.git'].includes(segment)), entry);
    }
    const destination = path.join(modules, '@open-hax', 'uxx-' + adapter);
    fs.mkdirSync(destination);
    execFileSync('tar', ['-xzf', archive, '--strip-components=1', '-C', destination]);
    const manifest = JSON.parse(fs.readFileSync(path.join(destination, 'package.json'), 'utf8'));
    assert.equal(manifest.name, '@open-hax/uxx-' + adapter);
    assert.equal(manifest.scripts.prepack, 'npm run release');
    for (const peer of ['react', 'react-dom', '@open-hax/uxx']) {
      assert.ok(manifest.peerDependencies?.[peer], manifest.name + ' must declare peer ' + peer);
    }
    for (const developmentOnly of ['react', 'react-dom', 'shadow-cljs', 'reagent']) {
      assert.ok(!manifest.dependencies?.[developmentOnly], manifest.name + ' must not install runtime ' + developmentOnly);
    }
    const artifact = path.join(destination, manifest.exports['.'].import);
    assert.ok(fs.statSync(artifact).isFile(), 'Published import entrypoint must exist');
    assert.equal(createRequire(artifact).resolve('react'), canonicalReact, 'Extracted adapter must share the consumer React');
    const exports = await import(pathToFileURL(artifact));
    assert.equal(typeof exports.Button, 'function');
    assert.equal(typeof exports.ThemeProvider, 'function');
    result.push({ adapter, files: entries.length, exports: Object.keys(exports).length,
      bytes: fs.statSync(archive).size, sha256: createHash('sha256').update(fs.readFileSync(archive)).digest('hex'),
      sharedReactPeer: true, importedExtractedPackage: true });
  }
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
console.log(JSON.stringify({ packages: result, temporaryConsumerRemoved: !fs.existsSync(temporary) }, null, 2));
