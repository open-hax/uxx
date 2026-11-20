// SPDX-License-Identifier: GPL-3.0-or-later
//
// scripts/build-diag.mjs — build the DIAGNOSTIC variant of the extension.
//
//   node scripts/build-diag.mjs [outDir]      (default /tmp/opencode/uxx-diag-build)
//
// Produces <outDir>/uxx-monokai-diag.xpi: the normal extension plus the
// `uxx-diagnose` keyboard command and the report code, with the SAME add-on id
// so it replaces the installed build in place. The shipped manifest.json and
// dist/ are never touched.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(process.argv[2] || '/tmp/opencode/uxx-diag-build');
const xpi = join(out, 'uxx-monokai-diag.xpi');

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'dist'), { recursive: true });

const env = { ...process.env, UXX_DIAG: '1', UXX_DIAG_OUT: join(out, 'dist') };
for (const config of ['vite.config.content.js', 'vite.config.background.js']) {
  execFileSync('npx', ['vite', 'build', '--config', config], { cwd: root, env, stdio: 'inherit' });
}

cpSync(join(root, 'assets'), join(out, 'assets'), { recursive: true });
execFileSync('node', ['scripts/generate-user-css.mjs'], { cwd: root, stdio: 'inherit' });
cpSync(join(root, 'dist', 'uxx-user.css'), join(out, 'dist', 'uxx-user.css'));

const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
manifest.commands = {
  'uxx-diagnose': {
    // Not Alt+Shift+<letter>: on many Linux setups Alt+Shift is an XKB
    // layout-switch combo consumed before any application sees it. Rebind in
    // about:addons → Manage Extension Shortcuts if this one is taken.
    suggested_key: { default: 'Ctrl+Shift+F12' },
    description: 'Uxx diagnostic: send a theming report to the local listener',
  },
};
writeFileSync(join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

execFileSync(
  'zip',
  ['-q', '-X', xpi, 'manifest.json', 'dist/content.js', 'dist/background.js', 'dist/uxx-user.css', 'assets/icon-48.png', 'assets/icon-96.png'],
  { cwd: out, stdio: 'inherit' },
);
console.log(`built ${xpi}`);
