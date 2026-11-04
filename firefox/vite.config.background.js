// SPDX-License-Identifier: GPL-3.0-or-later
// Background event-page build (spec §1.3, design §4): ES module — the
// manifest declares `background: { scripts, type: "module" }`. Shares dist/
// with the content build, so emptyOutDir stays false on both.
import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    outDir: 'dist', emptyOutDir: false,
    lib: { entry: 'src/background.js', formats: ['es'],
           fileName: () => 'background.js' },
  },
});
