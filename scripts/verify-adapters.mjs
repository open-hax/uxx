import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../package.json', import.meta.url));
const canonicalReact = require.resolve('react');
for (const consumer of ['react-dom', '@testing-library/react', 'react-markdown', 'prism-react-renderer']) {
  assert.equal(createRequire(require.resolve(consumer)).resolve('react'), canonicalReact, consumer + ' must share the React peer');
}
// Load both production artifacts together: development CLJS runtimes are global.
for (const adapter of ['helix', 'reagent']) {
  const exports = await import('../' + adapter + '/dist/index.js');
  assert.equal(typeof exports.Button, 'function', adapter + ' Button export');
  assert.equal(typeof exports.ThemeProvider, 'function', adapter + ' ThemeProvider export');
  console.log(adapter + ': ' + Object.keys(exports).length + ' runtime exports, shared React peer');
}
