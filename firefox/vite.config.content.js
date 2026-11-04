// SPDX-License-Identifier: GPL-3.0-or-later
// Content-script build (spec §1.3, design §4): IIFE — Firefox content scripts
// are classic scripts, and an IIFE cannot carry dynamic import(), so the
// content graph must stay static-only (grep gate in spec §11).
import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    outDir: 'dist', emptyOutDir: false,
    lib: { entry: 'src/content/main.js', formats: ['iife'],
           name: 'UxxContent', fileName: () => 'content.js' },
  },
});
