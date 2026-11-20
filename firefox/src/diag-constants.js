// SPDX-License-Identifier: GPL-3.0-or-later
//
// src/diag-constants.js — the three strings shared by the diagnostic's content
// half (src/content/diagnose.js) and background half (src/background-diag.js).
//
// DELIBERATELY IMPORT-FREE. The background bundle must not pull in the
// diagnostic's heavy dependencies (roles/tokens/color): rollup keeps any module
// with top-level calls it cannot prove pure, which silently bloated the
// production background (14.36 kB → 18.57 kB) when the shared constants lived in
// diagnose.js. Gate: production dist/background.js hash must not change.
export const DIAG_SCHEMA = 'uxx-diag-v1';
export const DIAG_MESSAGE = 'uxx-diagnose';
export const DIAG_ENDPOINT = 'http://127.0.0.1:47615/report';
