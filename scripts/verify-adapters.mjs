import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { URL } from 'node:url';
import console from 'node:console';

const require = createRequire(new URL('../package.json', import.meta.url));
const canonicalReact = require.resolve('react');
for (const consumer of ['react-dom', '@testing-library/react', 'react-markdown', 'prism-react-renderer']) {
  assert.equal(createRequire(require.resolve(consumer)).resolve('react'), canonicalReact, consumer + ' must share the React peer');
}
// Load both production artifacts together: development CLJS runtimes are global.
for (const adapter of ['helix', 'reagent']) {
  const artifactUrl = new URL('../' + adapter + '/dist/index.js', import.meta.url);
  assert.equal(createRequire(artifactUrl).resolve('react'), canonicalReact, adapter + ' artifact must share the React peer');
  const exports = await import(artifactUrl);
  assert.equal(typeof exports.Button, 'function', adapter + ' Button export');
  assert.equal(typeof exports.ThemeProvider, 'function', adapter + ' ThemeProvider export');
  console.log(adapter + ': ' + Object.keys(exports).length + ' runtime exports, shared React peer');
}
