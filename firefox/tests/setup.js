// Global test guard (spec §9): when `__UXX_TEST__` is set on globalThis,
// main.js must NOT autostart and background.js must not apply the theme on
// startup — tests drive every entry point explicitly.
globalThis.__UXX_TEST__ = true;
