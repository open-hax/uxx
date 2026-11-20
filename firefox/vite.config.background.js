// SPDX-License-Identifier: GPL-3.0-or-later
// Background event-page build (spec §1.3, design §4): ES module — the
// manifest declares `background: { scripts, type: "module" }`. Shares dist/
// with the content build, so emptyOutDir stays false on both.
//
// `UXX_DIAG=1` (set ONLY by scripts/build-diag.mjs): see vite.config.content.js.
import { defineConfig } from 'vite';
const diag = process.env.UXX_DIAG === '1';
export default defineConfig({
  define: { __UXX_DIAG__: JSON.stringify(diag) },
  build: {
    outDir: diag ? process.env.UXX_DIAG_OUT : 'dist', emptyOutDir: false,
    lib: { entry: 'src/background.js', formats: ['es'],
           fileName: () => 'background.js' },
  },
});
