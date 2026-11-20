// SPDX-License-Identifier: GPL-3.0-or-later
// Content-script build (spec §1.3, design §4): IIFE — Firefox content scripts
// are classic scripts, and an IIFE cannot carry dynamic import(), so the
// content graph must stay static-only (grep gate in spec §11).
//
// `UXX_DIAG=1` (set ONLY by scripts/build-diag.mjs) compiles the developer
// diagnostic in and writes to UXX_DIAG_OUT; the normal build pins the flag to a
// literal `false`, so the diagnostic is tree-shaken out of dist/.
import { defineConfig } from 'vite';
const diag = process.env.UXX_DIAG === '1';
export default defineConfig({
  define: { __UXX_DIAG__: JSON.stringify(diag) },
  build: {
    outDir: diag ? process.env.UXX_DIAG_OUT : 'dist', emptyOutDir: false,
    lib: { entry: 'src/content/main.js', formats: ['iife'],
           name: 'UxxContent', fileName: () => 'content.js' },
  },
});
