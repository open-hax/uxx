// SPDX-License-Identifier: GPL-3.0-or-later
//
// scripts/generate-user-css.mjs — emit dist/uxx-user.css, the USER-ORIGIN
// stylesheet the background registers via browser.scripting (cssOrigin:'user').
// User !important outranks every author !important (including cascade layers
// and inline styles), which is what forced-light cards like LinkedIn's
// `.theme--light` require. Same builder as the content sheets, so no drift.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as tokens from '../src/theme/tokens.js';
import * as roles from '../src/theme/roles.js';
import { userCss } from '../src/theme/sheet-css.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist', 'uxx-user.css');
const css = userCss(roles, tokens.resolveToken);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, css);
console.log(`Generated ${out} (${css.length} bytes)`);
